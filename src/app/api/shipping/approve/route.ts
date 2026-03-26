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
  const amount = Number(ext?.amount ?? 0);
  const orderRef = ext?.order as string | null;
  const invoiceNumber = ext?.invoice as string | null;
  const supplier = ext?.supplier as string | null;

  // Find the matched order
  if (orderRef) {
    const [matchedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderRef))
      .limit(1);

    if (matchedOrder && amount > 0) {
      // Update actual shipping cost on the order
      await db
        .update(orders)
        .set({ actualShippingCost: String(amount) })
        .where(eq(orders.id, matchedOrder.id));

      // Create shipping cost update record
      await db.insert(shippingCostUpdates).values({
        orderId: matchedOrder.id,
        source: "email",
        amount: String(amount),
        invoiceNumber,
        supplierName: supplier,
        approvedAt: new Date(),
      });
    }
  }

  // Mark as approved (move to history)
  await db
    .update(emailLogs)
    .set({ status: "approved" })
    .where(eq(emailLogs.id, logId));

  return NextResponse.json({ success: true });
}
