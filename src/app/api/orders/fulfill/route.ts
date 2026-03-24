export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, stores, fulfillments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { ShopifyClient } from "@/lib/shopify/client";

const CARRIER_MAP: Record<string, string> = {
  fedex: "FedEx",
  ups: "UPS",
  usps: "USPS",
  dhl: "DHL Express",
  other: "Other",
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, trackingNumber, carrier, notifyCustomer = true } = body;

    if (!orderId || !trackingNumber || !carrier) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, trackingNumber, carrier" },
        { status: 400 }
      );
    }

    // Get order and verify ownership
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Get store and verify user owns it
    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, order.storeId), eq(stores.userId, session.user.id)))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Store not found or unauthorized" }, { status: 403 });
    }

    // Create fulfillment record in our DB first (pending status)
    const [fulfillmentRecord] = await db
      .insert(fulfillments)
      .values({
        orderId: order.id,
        storeId: store.id,
        trackingNumber,
        carrier,
        shippingCostCharged: order.shippingCharged,
        shippingCostActual: order.actualShippingCost,
        costVariance: order.actualShippingCost
          ? String(Number(order.actualShippingCost) - Number(order.shippingCharged))
          : null,
        notifyCustomer,
        status: "pending",
        fulfilledBy: session.user.id,
      })
      .returning();

    // Push fulfillment to Shopify
    try {
      const client = new ShopifyClient(store.shopifyDomain, store.shopifyAccessToken);

      // Get fulfillment orders for this Shopify order
      const fulfillmentOrdersData = await client.getFulfillmentOrders(order.shopifyOrderId);
      const fulfillmentOrders = fulfillmentOrdersData.order.fulfillmentOrders.edges;

      // Find an open fulfillment order
      const openFO = fulfillmentOrders.find(
        (fo) => fo.node.status === "OPEN" || fo.node.status === "IN_PROGRESS"
      );

      if (!openFO) {
        await db
          .update(fulfillments)
          .set({ status: "failed", errorMessage: "No open fulfillment order found — order may already be fulfilled" })
          .where(eq(fulfillments.id, fulfillmentRecord.id));

        return NextResponse.json(
          { error: "No open fulfillment order found. Order may already be fulfilled." },
          { status: 400 }
        );
      }

      // Create the fulfillment in Shopify
      const result = await client.createFulfillment({
        fulfillmentOrderId: openFO.node.id,
        trackingNumber,
        trackingCompany: CARRIER_MAP[carrier] || carrier,
        notifyCustomer,
      });

      if (result.fulfillmentCreateV2.userErrors.length > 0) {
        const errorMsg = result.fulfillmentCreateV2.userErrors
          .map((e) => e.message)
          .join(", ");

        await db
          .update(fulfillments)
          .set({ status: "failed", errorMessage: errorMsg })
          .where(eq(fulfillments.id, fulfillmentRecord.id));

        return NextResponse.json({ error: errorMsg }, { status: 400 });
      }

      const shopifyFulfillment = result.fulfillmentCreateV2.fulfillment;

      // Update our fulfillment record with success
      await db
        .update(fulfillments)
        .set({
          status: "fulfilled",
          shopifyFulfillmentId: shopifyFulfillment?.id || null,
          fulfilledAt: new Date(),
        })
        .where(eq(fulfillments.id, fulfillmentRecord.id));

      // Update order fulfillment status in our DB
      await db
        .update(orders)
        .set({ fulfillmentStatus: "fulfilled" })
        .where(eq(orders.id, order.id));

      return NextResponse.json({
        success: true,
        fulfillment: {
          id: fulfillmentRecord.id,
          shopifyFulfillmentId: shopifyFulfillment?.id,
          trackingNumber,
          carrier,
          status: "fulfilled",
        },
      });
    } catch (shopifyError) {
      const errorMsg = shopifyError instanceof Error ? shopifyError.message : "Shopify API error";

      await db
        .update(fulfillments)
        .set({ status: "failed", errorMessage: errorMsg })
        .where(eq(fulfillments.id, fulfillmentRecord.id));

      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  } catch (error) {
    console.error("Fulfillment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
