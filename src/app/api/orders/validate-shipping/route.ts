export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, stores, shippingCostUpdates, fedexLookups } from "@/lib/db/schema";
import { eq, and, or, ilike } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, trackingNumber } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing required field: orderId" },
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

    const [store] = await db
      .select()
      .from(stores)
      .where(and(eq(stores.id, order.storeId), eq(stores.userId, session.user.id)))
      .limit(1);

    if (!store) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Look up shipping cost from scanned invoices
    const invoiceMatches = await db
      .select()
      .from(shippingCostUpdates)
      .where(eq(shippingCostUpdates.orderId, orderId));

    // Look up FedEx data if tracking number provided
    let fedexMatch = null;
    if (trackingNumber) {
      const fedexResults = await db
        .select()
        .from(fedexLookups)
        .where(
          or(
            eq(fedexLookups.orderId, orderId),
            ilike(fedexLookups.trackingNumber, trackingNumber)
          )
        );
      fedexMatch = fedexResults[0] || null;
    }

    // Calculate cost comparison
    const shippingCharged = Number(order.shippingCharged) || 0;
    const actualShippingCost = Number(order.actualShippingCost) || 0;

    // Best available actual cost: invoice > fedex > order.actualShippingCost
    let bestActualCost = actualShippingCost;
    let costSource = "none";

    if (invoiceMatches.length > 0) {
      // Use the most recent approved invoice, or most recent overall
      const approved = invoiceMatches.find((i) => i.approvedAt);
      const best = approved || invoiceMatches[0];
      bestActualCost = Number(best.amount);
      costSource = `invoice:${best.source}`;
    } else if (fedexMatch?.actualBilled) {
      bestActualCost = Number(fedexMatch.actualBilled);
      costSource = "fedex";
    } else if (fedexMatch?.estimatedCost) {
      bestActualCost = Number(fedexMatch.estimatedCost);
      costSource = "fedex_estimate";
    }

    const variance = shippingCharged - bestActualCost;
    const variancePercent = shippingCharged > 0
      ? ((variance / shippingCharged) * 100).toFixed(1)
      : "0";

    return NextResponse.json({
      orderId,
      orderNumber: order.orderNumber,
      shippingCharged,
      actualCost: bestActualCost,
      costSource,
      variance,
      variancePercent: Number(variancePercent),
      profitable: variance >= 0,
      invoiceMatches: invoiceMatches.map((i) => ({
        id: i.id,
        source: i.source,
        amount: Number(i.amount),
        invoiceNumber: i.invoiceNumber,
        supplierName: i.supplierName,
        approved: !!i.approvedAt,
      })),
      fedexData: fedexMatch
        ? {
            trackingNumber: fedexMatch.trackingNumber,
            status: fedexMatch.status,
            estimatedCost: fedexMatch.estimatedCost ? Number(fedexMatch.estimatedCost) : null,
            actualBilled: fedexMatch.actualBilled ? Number(fedexMatch.actualBilled) : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Validate shipping error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
