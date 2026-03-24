export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getShippingAgentData } from "@/lib/data/queries";
import { inngest } from "@/lib/inngest";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const data = await getShippingAgentData(authResult.userId);
  return NextResponse.json(data);
}

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  await inngest.send({
    name: "agent/shipping.scan",
    data: { userId: authResult.userId },
  });

  return NextResponse.json({ success: true, message: "Scan triggered" });
}
