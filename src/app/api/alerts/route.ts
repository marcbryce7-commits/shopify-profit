export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getAlerts } from "@/lib/data/queries";
import { db } from "@/lib/db";
import { alertSettings, costAlerts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const storeId = req.nextUrl.searchParams.get("storeId") ?? undefined;
  const data = await getAlerts(authResult.userId, storeId);

  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();

  // Upsert alert settings
  const existing = await db
    .select({ id: alertSettings.id })
    .from(alertSettings)
    .where(eq(alertSettings.userId, authResult.userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(alertSettings)
      .set({
        shippingPercentThreshold: body.shippingPercentThreshold,
        shippingDollarThreshold: body.shippingDollarThreshold,
        cogsPercentThreshold: body.cogsPercentThreshold,
        cogsDollarThreshold: body.cogsDollarThreshold,
        enableInApp: body.enableInApp,
        enableEmail: body.enableEmail,
        enableSms: body.enableSms,
        alertEmail: body.alertEmail,
        alertPhone: body.alertPhone,
        updatedAt: new Date(),
      })
      .where(eq(alertSettings.userId, authResult.userId));
  } else {
    await db.insert(alertSettings).values({
      userId: authResult.userId,
      ...body,
    });
  }

  return NextResponse.json({ success: true });
}

// Dismiss/resolve an alert
export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { alertId, action } = await req.json();
  if (!alertId || !["resolved", "dismissed"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await db
    .update(costAlerts)
    .set({
      status: action,
      resolvedAt: new Date(),
    })
    .where(eq(costAlerts.id, alertId));

  return NextResponse.json({ success: true });
}
