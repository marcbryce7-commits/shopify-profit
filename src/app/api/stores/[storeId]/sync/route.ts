import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { inngest } from "@/lib/inngest";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { storeId } = await params;

  // Verify store belongs to user
  const [store] = await db
    .select({ id: stores.id })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.userId, authResult.userId)))
    .limit(1);

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  await inngest.send({
    name: "shopify/orders.sync",
    data: { storeId },
  });

  return NextResponse.json({ success: true, message: "Sync triggered" });
}
