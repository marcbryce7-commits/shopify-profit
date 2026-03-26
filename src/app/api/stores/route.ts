export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getUserStores, getRecentSyncs } from "@/lib/data/queries";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const [userStores, recentSyncs] = await Promise.all([
    getUserStores(authResult.userId),
    getRecentSyncs(authResult.userId),
  ]);

  return NextResponse.json({ stores: userStores, recentSyncs });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { storeId, poPrefix, ignoredSenders } = await req.json();
  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (poPrefix !== undefined) updateData.poPrefix = poPrefix || null;
  if (ignoredSenders !== undefined) updateData.ignoredSenders = ignoredSenders || null;

  await db
    .update(stores)
    .set(updateData)
    .where(and(eq(stores.id, storeId), eq(stores.userId, authResult.userId)));

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { storeId } = await req.json();
  if (!storeId) {
    return NextResponse.json({ error: "storeId required" }, { status: 400 });
  }

  await db
    .delete(stores)
    .where(and(eq(stores.id, storeId), eq(stores.userId, authResult.userId)));

  return NextResponse.json({ success: true });
}
