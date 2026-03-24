export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { stores, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { ShopifyClient } from "@/lib/shopify/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { storeId } = await params;

  // Optional: read date filter from body
  let updatedAtMin: string | undefined;
  try {
    const body = await req.json();
    updatedAtMin = body.updatedAtMin; // ISO date string e.g. "2025-01-01"
  } catch {
    // No body is fine — sync all orders
  }

  // Verify store belongs to user and get credentials
  const [store] = await db
    .select({
      id: stores.id,
      shopifyDomain: stores.shopifyDomain,
      shopifyAccessToken: stores.shopifyAccessToken,
    })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.userId, authResult.userId)))
    .limit(1);

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  try {
    console.log("Starting sync for store:", store.id, store.shopifyDomain);
    console.log("Has access token:", !!store.shopifyAccessToken);
    const accessToken = decrypt(store.shopifyAccessToken);
    const client = new ShopifyClient(store.shopifyDomain, accessToken);

    let cursor: string | undefined;
    let totalSynced = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await client.getOrders(cursor, updatedAtMin);
      const edges = result.orders.edges;

      for (const { node: order, cursor: edgeCursor } of edges) {
        cursor = edgeCursor;

        const shopifyOrderId = order.id as string;
        const lineItems = (order.lineItems as { edges: Array<{ node: Record<string, unknown> }> }).edges || [];

        // Calculate COGS from line items
        let totalCogs = 0;
        for (const { node: item } of lineItems) {
          const unitCost = parseFloat(
            (item.variant as Record<string, unknown>)?.inventoryItem
              ? ((item.variant as Record<string, { unitCost?: { amount?: string } }>)?.inventoryItem?.unitCost?.amount || "0")
              : "0"
          );
          totalCogs += unitCost * (item.quantity as number || 0);
        }

        // Calculate transaction fees
        let transactionFee = 0;
        const transactions = (order.transactions as Array<{ fees: Array<{ amount: { amount: string }; type: string }> }>) || [];
        for (const tx of transactions) {
          for (const fee of tx.fees || []) {
            transactionFee += parseFloat(fee.amount?.amount || "0");
          }
        }

        const subtotal = parseFloat((order.subtotalPriceSet as { shopMoney: { amount: string } })?.shopMoney?.amount || "0");
        const totalTax = parseFloat((order.totalTaxSet as { shopMoney: { amount: string } })?.shopMoney?.amount || "0");
        const shippingCharged = parseFloat((order.totalShippingPriceSet as { shopMoney: { amount: string } })?.shopMoney?.amount || "0");
        const netProfit = subtotal - totalCogs - shippingCharged - transactionFee;

        const customer = order.customer as { email?: string; firstName?: string; lastName?: string } | null;
        const shippingAddress = order.shippingAddress as { province?: string; country?: string } | null;
        const taxLines = order.taxLines as Array<{ title: string; rate: number; priceSet: { shopMoney: { amount: string } } }> | null;

        await db
          .insert(orders)
          .values({
            storeId: store.id,
            shopifyOrderId,
            orderNumber: order.name as string,
            orderDate: new Date(order.createdAt as string),
            subtotal: subtotal.toFixed(2),
            totalTax: totalTax.toFixed(2),
            shippingCharged: shippingCharged.toFixed(2),
            transactionFee: transactionFee.toFixed(2),
            totalCogs: totalCogs.toFixed(2),
            netProfit: netProfit.toFixed(2),
            customerEmail: customer?.email || null,
            customerName: customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : null,
            financialStatus: (order.displayFinancialStatus as string)?.toLowerCase() || null,
            fulfillmentStatus: (order.displayFulfillmentStatus as string)?.toLowerCase() || null,
            taxLines: taxLines || null,
            shippingProvince: shippingAddress?.province || null,
            shippingCountry: shippingAddress?.country || null,
            rawData: order,
          })
          .onConflictDoUpdate({
            target: [orders.storeId, orders.shopifyOrderId],
            set: {
              subtotal: subtotal.toFixed(2),
              totalTax: totalTax.toFixed(2),
              shippingCharged: shippingCharged.toFixed(2),
              transactionFee: transactionFee.toFixed(2),
              totalCogs: totalCogs.toFixed(2),
              netProfit: netProfit.toFixed(2),
              customerEmail: customer?.email || null,
              customerName: customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : null,
              financialStatus: (order.displayFinancialStatus as string)?.toLowerCase() || null,
              fulfillmentStatus: (order.displayFulfillmentStatus as string)?.toLowerCase() || null,
              taxLines: taxLines || null,
              shippingProvince: shippingAddress?.province || null,
              shippingCountry: shippingAddress?.country || null,
              rawData: order,
              syncedAt: new Date(),
            },
          });

        totalSynced++;
      }

      hasMore = result.orders.pageInfo.hasNextPage && edges.length > 0;
    }

    // Update store lastSyncAt
    await db
      .update(stores)
      .set({ lastSyncAt: new Date() })
      .where(eq(stores.id, store.id));

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced} orders`,
      totalSynced,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Sync error:", message);
    return NextResponse.json(
      { error: "Sync failed", detail: message },
      { status: 500 }
    );
  }
}
