export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserSettings } from "@/lib/data/queries";
import { db } from "@/lib/db";
import { customCostRules, stores } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const data = await getUserSettings(authResult.userId);
  return NextResponse.json(data);
}

// Add a custom cost rule
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();

  // Verify store belongs to user
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(
      and(eq(stores.id, body.storeId), eq(stores.userId, authResult.userId))
    )
    .limit(1);

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const [rule] = await db
    .insert(customCostRules)
    .values({
      storeId: body.storeId,
      name: body.name,
      type: body.type,
      amount: body.amount,
      appliesTo: body.appliesTo ?? "all",
    })
    .returning();

  return NextResponse.json({ rule });
}

// Delete a custom cost rule
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { ruleId } = await req.json();
  await db.delete(customCostRules).where(eq(customCostRules.id, ruleId));

  return NextResponse.json({ success: true });
}
