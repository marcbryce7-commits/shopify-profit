export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getOrders } from "@/lib/data/queries";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = req.nextUrl;

  const result = await getOrders(authResult.userId, {
    storeId: searchParams.get("storeId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: parseInt(searchParams.get("page") ?? "1", 10),
    limit: parseInt(searchParams.get("limit") ?? "25", 10),
  });

  return NextResponse.json(result);
}
