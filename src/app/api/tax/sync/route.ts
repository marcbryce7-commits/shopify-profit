import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { orders, stores, nexusTracking } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createTransaction } from "@/lib/tax/taxjar";

/**
 * POST /api/tax/sync — Push order transactions to TaxJar for auto-filing.
 * This syncs unfiled orders so TaxJar can handle filing returns.
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { storeId } = await req.json();

  // Get user's stores
  const userStores = storeId
    ? await db
        .select()
        .from(stores)
        .where(
          and(eq(stores.id, storeId), eq(stores.userId, authResult.userId))
        )
    : await db
        .select()
        .from(stores)
        .where(eq(stores.userId, authResult.userId));

  const storeIds = userStores.map((s) => s.id);
  if (storeIds.length === 0) {
    return NextResponse.json({ error: "No stores found" }, { status: 404 });
  }

  // Get nexus states where TaxJar is enabled
  const nexusStates = await db
    .select()
    .from(nexusTracking)
    .where(
      and(
        eq(nexusTracking.userId, authResult.userId),
        eq(nexusTracking.taxjarEnabled, true)
      )
    );

  const nexusStateCodes = new Set(nexusStates.map((n) => n.state));
  if (nexusStateCodes.size === 0) {
    return NextResponse.json({
      success: true,
      message: "No states with TaxJar enabled",
      synced: 0,
    });
  }

  // Get US orders that ship to nexus states
  const orderRows = await db
    .select()
    .from(orders)
    .where(
      and(
        inArray(orders.storeId, storeIds),
        eq(orders.shippingCountry, "US")
      )
    );

  let synced = 0;
  const errors: string[] = [];

  for (const order of orderRows) {
    if (!order.shippingProvince) continue;
    if (!nexusStateCodes.has(order.shippingProvince)) continue;

    try {
      await createTransaction({
        transactionId: `${order.storeId}-${order.shopifyOrderId}`,
        transactionDate: order.orderDate.toISOString().slice(0, 10),
        toCountry: order.shippingCountry ?? "US",
        toZip: "", // Would need full address from Shopify
        toState: order.shippingProvince,
        amount: parseFloat(order.subtotal),
        shipping: parseFloat(order.shippingCharged),
        salesTax: parseFloat(order.totalTax),
      });
      synced++;
    } catch (err) {
      errors.push(
        `Order ${order.orderNumber}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return NextResponse.json({
    success: errors.length === 0,
    synced,
    total: orderRows.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
