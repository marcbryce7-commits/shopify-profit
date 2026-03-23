import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteContent } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";

/**
 * GET /api/content?section=landing
 * Public — no auth required. Returns { [key]: value } map.
 */
export async function GET(req: NextRequest) {
  const section = req.nextUrl.searchParams.get("section");

  const rows = section
    ? await db
        .select({ key: siteContent.key, value: siteContent.value })
        .from(siteContent)
        .where(eq(siteContent.section, section))
    : await db
        .select({ key: siteContent.key, value: siteContent.value })
        .from(siteContent);

  // Return as a flat { key: value } map
  const result: Record<string, string> = {};
  for (const row of rows) {
    result[row.key] = row.value;
  }

  return NextResponse.json(result);
}

/**
 * PUT /api/content
 * Auth required. Accepts { items: [{ key, value }] } for bulk upsert.
 */
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const items: { key: string; value: string; section?: string }[] =
    body.items ?? (body.key ? [body] : []);

  if (items.length === 0) {
    return NextResponse.json({ error: "No items provided" }, { status: 400 });
  }

  for (const item of items) {
    // Derive section from key prefix if not provided
    const section = item.section ?? item.key.split(".")[0] ?? "global";

    // Upsert: update if exists, insert if not
    const existing = await db
      .select({ id: siteContent.id })
      .from(siteContent)
      .where(eq(siteContent.key, item.key))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(siteContent)
        .set({
          value: item.value,
          userId: authResult.userId,
          updatedAt: new Date(),
        })
        .where(eq(siteContent.key, item.key));
    } else {
      await db.insert(siteContent).values({
        key: item.key,
        value: item.value,
        section,
        userId: authResult.userId,
      });
    }
  }

  return NextResponse.json({ success: true, updated: items.length });
}
