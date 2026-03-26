import { Inngest } from "inngest";
import { db } from "@/lib/db";
import {
  stores,
  orders,
  orderLineItems,
  customers,
  costAlerts,
  alertSettings,
  syncLogs,
  adSpendDaily,
  adPlatformConnections,
  connectedEmails,
  emailLogs,
  shippingCostUpdates,
  taxRecords,
  nexusTracking,
} from "@/lib/db/schema";
import { eq, and, sql, gte, desc } from "drizzle-orm";
import { ShopifyClient } from "@/lib/shopify/client";
import { decrypt } from "@/lib/crypto";
import {
  calculateOrderProfit,
  checkCostAlert,
  type OrderCosts,
} from "@/lib/profit";
import { fetchAdSpend, type AdPlatformType } from "@/lib/ads/client";

export const inngest = new Inngest({
  id: "profit-pilot",
  name: "ProfitPilot",
});

// ─── Sync Orders Function ────────────────────────────────────────────────────

export const syncOrders = inngest.createFunction(
  {
    id: "sync-shopify-orders",
    name: "Sync Shopify Orders",
    throttle: { limit: 1, period: "5m", key: "event.data.storeId" },
  },
  { event: "shopify/orders.sync" },
  async ({ event, step }) => {
    const { storeId } = event.data;

    // Step 1: Get store credentials
    const store = await step.run("get-store", async () => {
      const [s] = await db
        .select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      if (!s) throw new Error(`Store ${storeId} not found`);
      return {
        id: s.id,
        userId: s.userId,
        domain: s.shopifyDomain,
        accessToken: decrypt(s.shopifyAccessToken),
        lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
      };
    });

    // Step 2: Create sync log
    const syncLogId = await step.run("create-sync-log", async () => {
      const [log] = await db
        .insert(syncLogs)
        .values({
          storeId: store.id,
          type: "orders",
          status: "running",
        })
        .returning({ id: syncLogs.id });
      return log.id;
    });

    // Step 3: Fetch and save orders from Shopify (paginated)
    const syncResult = await step.run("sync-orders", async () => {
      const client = new ShopifyClient(store.domain, store.accessToken);
      let cursor: string | undefined;
      let totalSynced = 0;
      const syncErrors: string[] = [];

      do {
        const data = await client.getOrders(
          cursor,
          store.lastSyncAt ?? undefined
        );

        for (const edge of data.orders.edges) {
          const node = edge.node as Record<string, unknown>;
          try {
            await upsertOrder(store.id, node);
            totalSynced++;
          } catch (err) {
            syncErrors.push(
              `Order ${(node as { name?: string }).name}: ${err instanceof Error ? err.message : String(err)}`
            );
          }
        }

        cursor = data.orders.pageInfo.hasNextPage
          ? data.orders.edges[data.orders.edges.length - 1]?.cursor
          : undefined;
      } while (cursor);

      return { totalSynced, errors: syncErrors };
    });

    // Step 4: Update customer LTV for this store
    await step.run("update-customer-ltv", async () => {
      await recalcCustomerLTV(store.id);
    });

    // Step 5: Check cost alerts
    await step.run("check-cost-alerts", async () => {
      await runCostAlertCheck(store.id, store.userId);
    });

    // Step 6: Update tax records
    await step.run("update-tax-records", async () => {
      await updateTaxRecordsForStore(store.id, store.userId);
    });

    // Step 7: Finalize
    await step.run("finalize-sync", async () => {
      await db
        .update(syncLogs)
        .set({
          status:
            syncResult.errors.length > 0 ? "failed" : "completed",
          completedAt: new Date(),
          ordersSynced: syncResult.totalSynced,
          errors:
            syncResult.errors.length > 0 ? syncResult.errors : null,
        })
        .where(eq(syncLogs.id, syncLogId));

      await db
        .update(stores)
        .set({ lastSyncAt: new Date() })
        .where(eq(stores.id, store.id));
    });

    return {
      success: syncResult.errors.length === 0,
      storeId,
      ordersSynced: syncResult.totalSynced,
      errors: syncResult.errors,
    };
  }
);

// ─── Scheduled Hourly Sync ──────────────────────────────────────────────────

export const scheduledSync = inngest.createFunction(
  {
    id: "scheduled-order-sync",
    name: "Hourly Order Sync",
  },
  { cron: "0 * * * *" },
  async ({ step }) => {
    const activeStores = await step.run("get-active-stores", async () => {
      return db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.status, "active"));
    });

    for (const store of activeStores) {
      await step.sendEvent(`trigger-sync-${store.id}`, {
        name: "shopify/orders.sync",
        data: { storeId: store.id },
      });
    }

    return { triggeredStores: activeStores.length };
  }
);

// ─── Ad Spend Sync ──────────────────────────────────────────────────────────

export const syncAdSpendFn = inngest.createFunction(
  {
    id: "sync-ad-spend",
    name: "Daily Ad Spend Sync",
  },
  { cron: "0 6 * * *" },
  async ({ step }) => {
    const connections = await step.run("get-connections", async () => {
      const rows = await db.select().from(adPlatformConnections);
      return rows.map((r) => ({
        ...r,
        accessToken: decrypt(r.accessToken),
        refreshToken: r.refreshToken ? decrypt(r.refreshToken) : null,
        expiresAt: r.expiresAt?.toISOString() ?? null,
        lastSyncAt: r.lastSyncAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }));
    });

    // Group connections by user to find their stores
    const results: Array<{ platform: string; synced: number; error?: string }> =
      [];

    for (const conn of connections) {
      await step.run(`sync-${conn.platform}-${conn.id}`, async () => {
        try {
          // Get user's stores to attribute ad spend
          const userStores = await db
            .select({ id: stores.id })
            .from(stores)
            .where(
              and(eq(stores.userId, conn.userId), eq(stores.status, "active"))
            );

          if (userStores.length === 0) return;

          // Fetch yesterday's ad spend
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);

          const spendData = await fetchAdSpend(
            conn.platform as AdPlatformType,
            conn.accessToken,
            conn.accountId ?? "",
            yesterday,
            yesterday
          );

          // Save each campaign's data — attribute to first store for now
          // (multi-store attribution is a future enhancement)
          const targetStoreId = userStores[0].id;

          for (const campaign of spendData) {
            await db
              .insert(adSpendDaily)
              .values({
                storeId: targetStoreId,
                platform: conn.platform as
                  | "google"
                  | "meta"
                  | "tiktok"
                  | "bing"
                  | "snapchat"
                  | "amazon",
                campaignId: campaign.campaignId,
                campaignName: campaign.campaignName,
                date: yesterday,
                spend: campaign.spend.toFixed(2),
                impressions: campaign.impressions,
                clicks: campaign.clicks,
                conversions: campaign.conversions,
                revenueAttributed: campaign.revenueAttributed?.toFixed(2),
              })
              .onConflictDoNothing();
          }

          // Update last sync
          await db
            .update(adPlatformConnections)
            .set({ lastSyncAt: new Date() })
            .where(eq(adPlatformConnections.id, conn.id));

          results.push({
            platform: conn.platform,
            synced: spendData.length,
          });
        } catch (err) {
          results.push({
            platform: conn.platform,
            synced: 0,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    }

    return { results };
  }
);

// ─── AI Agent Email Scan ────────────────────────────────────────────────────

export const runShippingAgent = inngest.createFunction(
  {
    id: "run-shipping-agent",
    name: "AI Shipping Agent Email Scan",
  },
  { event: "agent/shipping.scan" },
  async ({ event, step }) => {
    const { userId } = event.data;

    // Step 1: Get connected email accounts for this user
    const emails = await step.run("get-emails", async () => {
      return db
        .select()
        .from(connectedEmails)
        .where(
          and(
            eq(connectedEmails.userId, userId),
            eq(connectedEmails.active, true)
          )
        );
    });

    if (emails.length === 0) {
      return { success: true, message: "No connected email accounts" };
    }

    // Step 2: Call Python AI agent service for each email account
    const agentUrl = process.env.AI_AGENT_URL;
    const apiSecret = process.env.INTERNAL_API_SECRET;

    if (!agentUrl) {
      throw new Error("AI_AGENT_URL is not configured");
    }

    const allInvoices: Array<{
      emailLogId: string;
      orderId: string | null;
      amount: number;
      invoiceNumber: string;
      supplierName: string;
    }> = [];

    for (const emailAccount of emails) {
      const invoices = await step.run(
        `scan-${emailAccount.id}`,
        async () => {
          const res = await fetch(`${agentUrl}/scan-emails`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(apiSecret ? { Authorization: `Bearer ${apiSecret}` } : {}),
            },
            body: JSON.stringify({
              emailAccountId: emailAccount.id,
              provider: emailAccount.provider,
              accessToken: decrypt(emailAccount.accessToken),
              refreshToken: emailAccount.refreshToken
                ? decrypt(emailAccount.refreshToken)
                : null,
              scanKeywords: emailAccount.scanKeywords,
              lastScannedAt: emailAccount.lastScannedAt
                ? new Date(emailAccount.lastScannedAt).toISOString()
                : null,
            }),
          });

          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              `Agent scan failed for ${emailAccount.emailAddress}: ${errorText}`
            );
          }

          const result = (await res.json()) as {
            invoices: Array<{
              subject: string;
              sender: string;
              receivedAt: string;
              invoiceNumber: string;
              supplierName: string;
              amount: number;
              orderNumber?: string;
              trackingNumber?: string;
            }>;
          };

          // Log each email processed
          const processedInvoices = [];
          for (const inv of result.invoices) {
            const [log] = await db
              .insert(emailLogs)
              .values({
                userId,
                connectedEmailId: emailAccount.id,
                emailSubject: inv.subject,
                sender: inv.sender,
                receivedAt: new Date(inv.receivedAt),
                processedAt: new Date(),
                status: "pending",
                extractedData: inv,
              })
              .returning({ id: emailLogs.id });

            // Try to match to an order
            let matchedOrderId: string | null = null;
            if (inv.orderNumber) {
              const storeId =
                emailAccount.storeId ?? undefined;
              const matchQuery = storeId
                ? and(
                    eq(orders.orderNumber, inv.orderNumber),
                    eq(orders.storeId, storeId)
                  )
                : eq(orders.orderNumber, inv.orderNumber);

              const [matchedOrder] = await db
                .select({ id: orders.id })
                .from(orders)
                .where(matchQuery)
                .limit(1);

              if (matchedOrder) {
                matchedOrderId = matchedOrder.id;
                await db
                  .update(emailLogs)
                  .set({ status: "matched" })
                  .where(eq(emailLogs.id, log.id));
              }
            }

            processedInvoices.push({
              emailLogId: log.id,
              orderId: matchedOrderId,
              amount: inv.amount,
              invoiceNumber: inv.invoiceNumber,
              supplierName: inv.supplierName,
            });
          }

          // Update last scanned timestamp
          await db
            .update(connectedEmails)
            .set({ lastScannedAt: new Date() })
            .where(eq(connectedEmails.id, emailAccount.id));

          return processedInvoices;
        }
      );

      allInvoices.push(...invoices);
    }

    // Step 3: Create shipping cost updates for matched invoices
    await step.run("create-shipping-updates", async () => {
      for (const inv of allInvoices) {
        if (!inv.orderId) continue;

        await db.insert(shippingCostUpdates).values({
          orderId: inv.orderId,
          source: "email",
          amount: inv.amount.toFixed(2),
          invoiceNumber: inv.invoiceNumber,
          supplierName: inv.supplierName,
          emailLogId: inv.emailLogId,
        });

        // Update order's actual shipping cost
        await db
          .update(orders)
          .set({ actualShippingCost: inv.amount.toFixed(2) })
          .where(eq(orders.id, inv.orderId));
      }
    });

    return {
      success: true,
      emailsScanned: emails.length,
      invoicesFound: allInvoices.length,
      matched: allInvoices.filter((i) => i.orderId).length,
    };
  }
);

// ─── Helper: Upsert an order from Shopify data ─────────────────────────────

interface ShopifyMoney {
  amount: string;
  currencyCode?: string;
}

interface ShopifyMoneySet {
  shopMoney: ShopifyMoney;
}

interface ShopifyLineItem {
  id: string;
  title: string;
  sku: string | null;
  quantity: number;
  originalUnitPriceSet: ShopifyMoneySet;
  product: { id: string } | null;
  variant: {
    id: string;
    inventoryItem: { unitCost: ShopifyMoney | null } | null;
  } | null;
}

async function upsertOrder(
  storeId: string,
  node: Record<string, unknown>
): Promise<void> {
  const shopifyOrderId = (node.id as string).replace(
    "gid://shopify/Order/",
    ""
  );
  const orderName = node.name as string;

  const subtotal = parseFloat(
    (node.subtotalPriceSet as ShopifyMoneySet)?.shopMoney?.amount ?? "0"
  );
  const totalTax = parseFloat(
    (node.totalTaxSet as ShopifyMoneySet)?.shopMoney?.amount ?? "0"
  );
  const shippingCharged = parseFloat(
    (node.totalShippingPriceSet as ShopifyMoneySet)?.shopMoney?.amount ?? "0"
  );

  // Calculate transaction fees from transactions
  const transactions = (node.transactions as Array<{
    fees: Array<{ amount: { amount: string }; type: string }>;
  }>) ?? [];
  let transactionFee = 0;
  for (const tx of transactions) {
    for (const fee of tx.fees ?? []) {
      transactionFee += parseFloat(fee.amount?.amount ?? "0");
    }
  }

  // Parse line items for COGS
  const lineItemEdges = (
    node.lineItems as { edges: Array<{ node: ShopifyLineItem }> }
  )?.edges ?? [];
  let totalCogs = 0;
  const lineItemsToInsert: Array<{
    shopifyLineItemId: string;
    productId: string | null;
    variantId: string | null;
    title: string;
    sku: string | null;
    quantity: number;
    unitCost: string;
    lineCogs: string;
    price: string;
  }> = [];

  for (const liEdge of lineItemEdges) {
    const li = liEdge.node;
    const unitCost = parseFloat(
      li.variant?.inventoryItem?.unitCost?.amount ?? "0"
    );
    const lineCogs = unitCost * li.quantity;
    totalCogs += lineCogs;

    const price = parseFloat(
      li.originalUnitPriceSet?.shopMoney?.amount ?? "0"
    );

    lineItemsToInsert.push({
      shopifyLineItemId: (li.id as string).replace(
        "gid://shopify/LineItem/",
        ""
      ),
      productId: li.product?.id
        ? (li.product.id as string).replace("gid://shopify/Product/", "")
        : null,
      variantId: li.variant?.id
        ? (li.variant.id as string).replace(
            "gid://shopify/ProductVariant/",
            ""
          )
        : null,
      title: li.title,
      sku: li.sku,
      quantity: li.quantity,
      unitCost: unitCost.toFixed(2),
      lineCogs: lineCogs.toFixed(2),
      price: price.toFixed(2),
    });
  }

  // Customer info
  const customer = node.customer as {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  const customerEmail = customer?.email ?? null;
  const customerName = customer
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
    : null;

  // Shipping address
  const shippingAddress = node.shippingAddress as {
    province: string;
    provinceCode: string;
    country: string;
    countryCode: string;
  } | null;

  // Tax lines
  const taxLines = node.taxLines as Array<{
    title: string;
    rate: number;
    priceSet: ShopifyMoneySet;
  }> | null;

  // Calculate net profit (without ad spend / custom costs — those are allocated later)
  // Check if there's an existing actual shipping cost (from approved invoices)
  const [existingOrder] = await db
    .select({ actualShippingCost: orders.actualShippingCost })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), eq(orders.shopifyOrderId, shopifyOrderId)))
    .limit(1);

  const existingActualShipping = existingOrder?.actualShippingCost
    ? parseFloat(existingOrder.actualShippingCost)
    : null;

  const orderCosts: OrderCosts = {
    subtotal,
    totalCogs,
    shippingCharged,
    actualShippingCost: existingActualShipping,
    transactionFee,
    customCostsTotal: 0,
    allocatedAdSpend: 0,
    totalTax,
  };
  const profit = calculateOrderProfit(orderCosts);

  // Upsert order
  const [upserted] = await db
    .insert(orders)
    .values({
      storeId,
      shopifyOrderId,
      orderNumber: orderName,
      orderDate: new Date(node.createdAt as string),
      subtotal: subtotal.toFixed(2),
      totalTax: totalTax.toFixed(2),
      shippingCharged: shippingCharged.toFixed(2),
      transactionFee: transactionFee.toFixed(2),
      totalCogs: totalCogs.toFixed(2),
      netProfit: profit.netProfit.toFixed(2),
      customerEmail,
      customerName,
      financialStatus: node.displayFinancialStatus as string,
      fulfillmentStatus: node.displayFulfillmentStatus as string,
      taxLines: taxLines
        ? taxLines.map((tl) => ({
            title: tl.title,
            rate: tl.rate,
            price: tl.priceSet?.shopMoney?.amount ?? "0",
            province: shippingAddress?.provinceCode,
          }))
        : null,
      shippingProvince: shippingAddress?.provinceCode ?? null,
      shippingCountry: shippingAddress?.countryCode ?? null,
      rawData: node,
    })
    .onConflictDoUpdate({
      target: [orders.storeId, orders.shopifyOrderId],
      set: {
        subtotal: subtotal.toFixed(2),
        totalTax: totalTax.toFixed(2),
        shippingCharged: shippingCharged.toFixed(2),
        transactionFee: transactionFee.toFixed(2),
        totalCogs: totalCogs.toFixed(2),
        netProfit: profit.netProfit.toFixed(2),
        customerEmail,
        customerName,
        financialStatus: node.displayFinancialStatus as string,
        fulfillmentStatus: node.displayFulfillmentStatus as string,
        taxLines: taxLines
          ? taxLines.map((tl) => ({
              title: tl.title,
              rate: tl.rate,
              price: tl.priceSet?.shopMoney?.amount ?? "0",
              province: shippingAddress?.provinceCode,
            }))
          : null,
        shippingProvince: shippingAddress?.provinceCode ?? null,
        shippingCountry: shippingAddress?.countryCode ?? null,
        rawData: node,
        syncedAt: new Date(),
      },
    })
    .returning({ id: orders.id });

  // Upsert line items (delete + re-insert for simplicity)
  await db
    .delete(orderLineItems)
    .where(eq(orderLineItems.orderId, upserted.id));

  if (lineItemsToInsert.length > 0) {
    await db.insert(orderLineItems).values(
      lineItemsToInsert.map((li) => ({
        orderId: upserted.id,
        ...li,
      }))
    );
  }
}

// ─── Helper: Recalculate customer LTV ───────────────────────────────────────

async function recalcCustomerLTV(storeId: string): Promise<void> {
  // Aggregate by customer email
  const customerAgg = await db
    .select({
      email: orders.customerEmail,
      name: sql<string>`MAX(${orders.customerName})`,
      firstOrderDate: sql<Date>`MIN(${orders.orderDate})`,
      lastOrderDate: sql<Date>`MAX(${orders.orderDate})`,
      totalOrders: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<string>`SUM(${orders.subtotal})`,
      totalCogs: sql<string>`SUM(${orders.totalCogs})`,
      totalProfit: sql<string>`SUM(${orders.netProfit})`,
    })
    .from(orders)
    .where(and(eq(orders.storeId, storeId), sql`${orders.customerEmail} IS NOT NULL`))
    .groupBy(orders.customerEmail);

  for (const c of customerAgg) {
    if (!c.email) continue;

    await db
      .insert(customers)
      .values({
        storeId,
        email: c.email,
        name: c.name,
        firstOrderDate: c.firstOrderDate,
        lastOrderDate: c.lastOrderDate,
        totalOrders: c.totalOrders,
        totalRevenue: c.totalRevenue ?? "0",
        totalCogs: c.totalCogs ?? "0",
        ltvNetProfit: c.totalProfit ?? "0",
      })
      .onConflictDoUpdate({
        target: [customers.storeId, customers.email],
        set: {
          name: c.name,
          firstOrderDate: c.firstOrderDate,
          lastOrderDate: c.lastOrderDate,
          totalOrders: c.totalOrders,
          totalRevenue: c.totalRevenue ?? "0",
          totalCogs: c.totalCogs ?? "0",
          ltvNetProfit: c.totalProfit ?? "0",
        },
      });
  }
}

// ─── Helper: Cost alert checks ──────────────────────────────────────────────

async function runCostAlertCheck(
  storeId: string,
  userId: string
): Promise<void> {
  // Get user's alert settings
  const [settings] = await db
    .select()
    .from(alertSettings)
    .where(eq(alertSettings.userId, userId))
    .limit(1);

  if (!settings) return;

  const shippingPctThreshold = parseFloat(
    settings.shippingPercentThreshold
  );
  const shippingDolThreshold = parseFloat(
    settings.shippingDollarThreshold
  );

  // Check orders with actual shipping cost vs charged
  const ordersWithActualShipping = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        sql`${orders.actualShippingCost} IS NOT NULL`
      )
    );

  for (const order of ordersWithActualShipping) {
    const charged = parseFloat(order.shippingCharged);
    const actual = parseFloat(order.actualShippingCost!);

    const alert = checkCostAlert(
      charged,
      actual,
      shippingPctThreshold,
      shippingDolThreshold
    );

    if (alert) {
      // Check if we already have an alert for this order
      const [existing] = await db
        .select({ id: costAlerts.id })
        .from(costAlerts)
        .where(
          and(
            eq(costAlerts.orderId, order.id),
            eq(costAlerts.type, "shipping_discrepancy")
          )
        )
        .limit(1);

      if (!existing) {
        await db.insert(costAlerts).values({
          orderId: order.id,
          storeId,
          type: "shipping_discrepancy",
          severity: alert.severity,
          expectedCost: charged.toFixed(2),
          actualCost: actual.toFixed(2),
          difference: alert.difference.toFixed(2),
          percentOver: alert.percentOver.toFixed(2),
          message: `Shipping for order ${order.orderNumber}: charged $${charged.toFixed(2)}, actual $${actual.toFixed(2)} (+$${alert.difference.toFixed(2)}, ${alert.percentOver.toFixed(0)}% over)`,
        });
      }
    }
  }
}

// ─── Helper: Update tax records ─────────────────────────────────────────────

async function updateTaxRecordsForStore(
  storeId: string,
  userId: string
): Promise<void> {
  // Aggregate tax by state and period
  const taxAgg = await db
    .select({
      state: orders.shippingProvince,
      period: sql<string>`TO_CHAR(${orders.orderDate}, 'YYYY-MM')`,
      taxableAmount: sql<string>`SUM(${orders.subtotal})`,
      taxCollected: sql<string>`SUM(${orders.totalTax})`,
      orderCount: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, storeId),
        eq(orders.shippingCountry, "US"),
        sql`${orders.shippingProvince} IS NOT NULL`
      )
    )
    .groupBy(orders.shippingProvince, sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM')`);

  for (const row of taxAgg) {
    if (!row.state) continue;

    await db
      .insert(taxRecords)
      .values({
        storeId,
        state: row.state,
        taxableAmount: row.taxableAmount ?? "0",
        taxCollected: row.taxCollected ?? "0",
        orderDate: new Date(), // period start
        period: row.period,
      })
      .onConflictDoNothing();

    // Update nexus tracking
    const totalForState = await db
      .select({
        totalRevenue: sql<string>`SUM(${orders.subtotal})`,
        totalTransactions: sql<number>`COUNT(*)::int`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.storeId, storeId),
          eq(orders.shippingProvince, row.state),
          eq(orders.shippingCountry, "US")
        )
      );

    if (totalForState[0]) {
      const rev = parseFloat(totalForState[0].totalRevenue ?? "0");
      const txns = totalForState[0].totalTransactions ?? 0;

      await db
        .insert(nexusTracking)
        .values({
          userId,
          state: row.state,
          totalRevenue: rev.toFixed(2),
          totalTransactions: txns,
          hasNexus: rev >= 100000 || txns >= 200,
        })
        .onConflictDoNothing();
    }
  }
}

// Export all functions for the Inngest handler
export const functions = [
  syncOrders,
  scheduledSync,
  syncAdSpendFn,
  runShippingAgent,
];
