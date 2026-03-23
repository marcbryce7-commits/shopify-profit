import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getCustomerAnalytics } from "@/lib/data/queries";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const storeId = req.nextUrl.searchParams.get("storeId") ?? undefined;
  const data = await getCustomerAnalytics(authResult.userId, storeId);

  return NextResponse.json(data);
}
