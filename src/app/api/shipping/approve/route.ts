export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { emailLogs, orders, shippingCostUpdates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { logId } = await req.json();
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

  // Extract the three cost fields from AI extraction
  const productCost = Number(ext?.productCost ?? 0);
  const shippingCost = Number(ext?.shippingCost ?? ext?.amount ?? 0);
  const grandTotal = Number(ext?.grandTotal ?? 0);
  const tracking = ext?.tracking as string | null;

  // Check for math discrepancy: product + shipping should ≈ grandTotal (allowing for tax)
  let costDiscrepancy = false;
  let discrepancyAmount = 0;
  if (productCost > 0 && shippingCost > 0 && grandTotal > 0) {
    const expectedSubtotal = productCost + shippingCost;
    discrepancyAmount = grandTotal - expectedSubtotal;
    // Flag if the difference isn't explainable by tax (> 15% of subtotal)
    if (discrepancyAmount > expectedSubtotal * 0.15) {
      costDiscrepancy = true;
    }
  }

  // Find the matched order
  let updatedOrder = null;
  if (orderRef) {
    const [matchedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderRef))
      .limit(1);

    if (matchedOrder) {
      const updates: Record<string, string> = {};

      // Store actual shipping cost from invoice
      if (shippingCost > 0) {
        updates.actualShippingCost = String(shippingCost);
      }

      // Update COGS with actual product cost from invoice (overrides Shopify estimate)
      if (productCost > 0) {
        updates.totalCogs = String(productCost);
      }

      // Recalculate net profit with real numbers
      const revenue = Number(matchedOrder.subtotal || 0);
      const shipCharged = Number(matchedOrder.shippingCharged || 0);
      const totalRevenue = revenue + shipCharged;
      const actualCogs = productCost > 0 ? productCost : Number(matchedOrder.totalCogs || 0);
      const actualShip = shippingCost > 0 ? shippingCost : Number(matchedOrder.actualShippingCost || matchedOrder.shippingCharged || 0);
      const txnFee = Number(matchedOrder.transactionFee || 0);
      const customCosts = Number(matchedOrder.customCostsTotal || 0);

      const netProfit = totalRevenue - actualCogs - actualShip - txnFee - customCosts;
      updates.netProfit = String(Math.round(netProfit * 100) / 100);

      if (Object.keys(updates).length > 0) {
        await db
          .update(orders)
          .set(updates)
          .where(eq(orders.id, matchedOrder.id));
      }

      // Create shipping cost update record
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

      updatedOrder = {
        orderNumber: matchedOrder.orderNumber,
        revenue: totalRevenue,
        cogs: actualCogs,
        shippingCost: actualShip,
        txnFee,
        netProfit,
        costDiscrepancy,
        discrepancyAmount: Math.round(discrepancyAmount * 100) / 100,
      };
    }
  }

  // Mark as approved (move to history)
  await db
    .update(emailLogs)
    .set({ status: "approved" })
    .where(eq(emailLogs.id, logId));

  return NextResponse.json({
    success: true,
    updatedOrder,
    costDiscrepancy,
    discrepancyAmount: Math.round(discrepancyAmount * 100) / 100,
  });
}
