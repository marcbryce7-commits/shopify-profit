export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getTaxData } from "@/lib/data/queries";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const storeId = req.nextUrl.searchParams.get("storeId") ?? undefined;
  const data = await getTaxData(authResult.userId, storeId);

  return NextResponse.json(data);
}
