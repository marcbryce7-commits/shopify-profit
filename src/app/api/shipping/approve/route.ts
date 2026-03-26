export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { emailLogs, orders, shippingCostUpdates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

type ApprovalType = "full" | "tracking_only" | "cost_only";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const logId = body.logId;
  const approvalType: ApprovalType = body.type || "full";
  const overrides = body.overrides as {
    productCost?: number;
    shippingCost?: number;
    grandTotal?: number;
  } | undefined;

  if (!logId) {
    return NextResponse.json({ error: "logId required" }, { status: 400 });
  }

  // Get the email log
  const [log] = await db
    .select()
    .from(emailLogs)
    .where(and(eq(emailLogs.id, logId), eq(emailLogs.userId, authResult.userId)))
    .limit(1);

  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  const ext = log.extractedData as Record<string, unknown> | null;
  const orderRef = ext?.order as string | null;
  const invoiceNumber = ext?.invoice as string | null;
  const supplier = ext?.supplier as string | null;
  const tracking = ext?.tracking as string | null;

  // Use overrides if provided, otherwise use AI-extracted values
  const productCost = overrides?.productCost ?? Number(ext?.productCost ?? 0);
  const shippingCost = overrides?.shippingCost ?? Number(ext?.shippingCost ?? ext?.amount ?? 0);
  const grandTotal = overrides?.grandTotal ?? Number(ext?.grandTotal ?? 0);

  // Check for math discrepancy
  let costDiscrepancy = false;
  let discrepancyAmount = 0;
  if (productCost > 0 && shippingCost > 0 && grandTotal > 0) {
    const expectedSubtotal = productCost + shippingCost;
    discrepancyAmount = grandTotal - expectedSubtotal;
    if (discrepancyAmount > expectedSubtotal * 0.15) {
      costDiscrepancy = true;
    }
  }

  let updatedOrder = null;
  let needsShipping = false;
  let needsCost = false;

  if (orderRef) {
    const [matchedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderRef))
      .limit(1);

    if (matchedOrder) {
      const updates: Record<string, string> = {};

      // ── TRACKING ONLY ──────────────────────────────────────────────
      if (approvalType === "tracking_only") {
        // Push tracking to order but keep scanning for costs
        if (tracking) {
          updates.fulfillmentStatus = "fulfilled";
          // Store tracking in a note or custom field if needed
        }
        needsCost = true;
        needsShipping = true;
      }

      // ── COST ONLY ─────────────────────────────────────────────────
      else if (approvalType === "cost_only") {
        if (productCost > 0) {
          updates.totalCogs = String(productCost);
        }
        // Flag that shipping price still needed
        needsShipping = shippingCost <= 0;

        // Recalculate profit with what we have
        const revenue = Number(matchedOrder.subtotal || 0);
        const shipCharged = Number(matchedOrder.shippingCharged || 0);
        const totalRevenue = revenue + shipCharged;
        const actualCogs = productCost > 0 ? productCost : Number(matchedOrder.totalCogs || 0);
        const actualShip = shippingCost > 0 ? shippingCost : Number(matchedOrder.actualShippingCost || 0);
        const txnFee = Number(matchedOrder.transactionFee || 0);
        const customCosts = Number(matchedOrder.customCostsTotal || 0);
        const netProfit = totalRevenue - actualCogs - actualShip - txnFee - customCosts;
        updates.netProfit = String(Math.round(netProfit * 100) / 100);

        if (shippingCost > 0) {
          updates.actualShippingCost = String(shippingCost);
        }

        // Create cost update record
        if (productCost > 0 || shippingCost > 0) {
          await db.insert(shippingCostUpdates).values({
            orderId: matchedOrder.id,
            source: "email",
            amount: String(shippingCost || grandTotal),
            invoiceNumber,
            supplierName: supplier,
            approvedAt: new Date(),
          });
        }
      }

      // ── FULL APPROVAL ─────────────────────────────────────────────
      else {
        if (shippingCost > 0) {
          updates.actualShippingCost = String(shippingCost);
        }
        if (productCost > 0) {
          updates.totalCogs = String(productCost);
        }
        if (tracking) {
          updates.fulfillmentStatus = "fulfilled";
        }

        // Recalculate net profit
        const revenue = Number(matchedOrder.subtotal || 0);
        const shipCharged = Number(matchedOrder.shippingCharged || 0);
        const totalRevenue = revenue + shipCharged;
        const actualCogs = productCost > 0 ? productCost : Number(matchedOrder.totalCogs || 0);
        const actualShip = shippingCost > 0 ? shippingCost : Number(matchedOrder.actualShippingCost || matchedOrder.shippingCharged || 0);
        const txnFee = Number(matchedOrder.transactionFee || 0);
        const customCosts = Number(matchedOrder.customCostsTotal || 0);
        const netProfit = totalRevenue - actualCogs - actualShip - txnFee - customCosts;
        updates.netProfit = String(Math.round(netProfit * 100) / 100);

        // Create cost update record
        if (shippingCost > 0 || grandTotal > 0) {
          await db.insert(shippingCostUpdates).values({
            orderId: matchedOrder.id,
            source: "email",
            amount: String(shippingCost || grandTotal),
            invoiceNumber,
            supplierName: supplier,
            approvedAt: new Date(),
          });
        }
      }

      if (Object.keys(updates).length > 0) {
        await db
          .update(orders)
          .set(updates)
          .where(eq(orders.id, matchedOrder.id));
      }

      updatedOrder = {
        orderNumber: matchedOrder.orderNumber,
        revenue: Number(matchedOrder.subtotal || 0) + Number(matchedOrder.shippingCharged || 0),
        cogs: productCost > 0 ? productCost : Number(matchedOrder.totalCogs || 0),
        shippingCost: shippingCost > 0 ? shippingCost : Number(matchedOrder.actualShippingCost || 0),
        txnFee: Number(matchedOrder.transactionFee || 0),
        netProfit: Number(updates.netProfit || matchedOrder.netProfit || 0),
        costDiscrepancy,
        discrepancyAmount: Math.round(discrepancyAmount * 100) / 100,
        needsShipping,
        needsCost,
      };
    }
  }

  // Set status based on approval type
  const newStatus =
    approvalType === "tracking_only" ? "tracking_approved" :
    approvalType === "cost_only" ? "cost_approved" :
    "approved";

  await db
    .update(emailLogs)
    .set({ status: newStatus })
    .where(eq(emailLogs.id, logId));

  return NextResponse.json({
    success: true,
    approvalType,
    updatedOrder,
    costDiscrepancy,
    discrepancyAmount: Math.round(discrepancyAmount * 100) / 100,
    needsShipping,
    needsCost,
  });
}
