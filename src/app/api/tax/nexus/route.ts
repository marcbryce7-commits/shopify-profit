import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { nexusTracking } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/tax/nexus — Toggle TaxJar filing or registration for a state.
 */
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { state, field, value } = await req.json();

  if (!state || !field || !["taxjarEnabled", "registeredForTax"].includes(field)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await db
    .update(nexusTracking)
    .set({ [field]: value, updatedAt: new Date() })
    .where(
      and(
        eq(nexusTracking.userId, authResult.userId),
        eq(nexusTracking.state, state)
      )
    );

  return NextResponse.json({ success: true });
}
