import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import {
  getDashboardMetrics,
  getProfitTrend,
  getStoreBreakdown,
  getRecentOrders,
} from "@/lib/data/queries";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = req.nextUrl;
  const storeId = searchParams.get("storeId") ?? undefined;

  const [metrics, trend, breakdown, recentOrders] = await Promise.all([
    getDashboardMetrics(authResult.userId, storeId),
    getProfitTrend(authResult.userId, storeId),
    getStoreBreakdown(authResult.userId),
    getRecentOrders(authResult.userId),
  ]);

  return NextResponse.json({ metrics, trend, breakdown, recentOrders });
}
