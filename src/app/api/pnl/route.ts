export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getPnlReport, getProfitTrend } from "@/lib/data/queries";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = req.nextUrl;
  const storeId = searchParams.get("storeId") ?? undefined;
  const startDate = searchParams.get("startDate")
    ? new Date(searchParams.get("startDate")!)
    : undefined;
  const endDate = searchParams.get("endDate")
    ? new Date(searchParams.get("endDate")!)
    : undefined;

  const [report, trend] = await Promise.all([
    getPnlReport(authResult.userId, storeId, startDate, endDate),
    getProfitTrend(authResult.userId, storeId),
  ]);

  return NextResponse.json({ report, trend });
}
