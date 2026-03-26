export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { emailLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { logId } = await req.json();
  if (!logId) {
    return NextResponse.json({ error: "logId required" }, { status: 400 });
  }

  await db
    .update(emailLogs)
    .set({ status: "rejected" })
    .where(and(eq(emailLogs.id, logId), eq(emailLogs.userId, authResult.userId)));

  return NextResponse.json({ success: true });
}
