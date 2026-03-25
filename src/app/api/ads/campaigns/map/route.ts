export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { adCampaignStoreMap } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET ?storeId=xxx — return all campaign mappings for the store
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const storeId = req.nextUrl.searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json(
      { error: "Missing storeId query parameter" },
      { status: 400 }
    );
  }

  const mappings = await db
    .select()
    .from(adCampaignStoreMap)
    .where(
      and(
        eq(adCampaignStoreMap.userId, authResult.userId),
        eq(adCampaignStoreMap.storeId, storeId)
      )
    );

  return NextResponse.json({ mappings });
}

// POST — replace campaign mappings for a user+store+platform
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { storeId, platform, campaigns } = body as {
    storeId: string;
    platform: string;
    campaigns: { campaignId: string; campaignName?: string }[];
  };

  if (!storeId || !platform || !Array.isArray(campaigns)) {
    return NextResponse.json(
      { error: "Missing required fields: storeId, platform, campaigns" },
      { status: 400 }
    );
  }

  // Delete existing mappings for this user+store+platform
  await db
    .delete(adCampaignStoreMap)
    .where(
      and(
        eq(adCampaignStoreMap.userId, authResult.userId),
        eq(adCampaignStoreMap.storeId, storeId),
        eq(
          adCampaignStoreMap.platform,
          platform as "google" | "meta" | "tiktok" | "bing" | "snapchat" | "amazon"
        )
      )
    );

  // Insert new mappings
  if (campaigns.length > 0) {
    await db.insert(adCampaignStoreMap).values(
      campaigns.map((c) => ({
        userId: authResult.userId,
        storeId,
        platform: platform as "google" | "meta" | "tiktok" | "bing" | "snapchat" | "amazon",
        campaignId: c.campaignId,
        campaignName: c.campaignName ?? null,
      }))
    );
  }

  return NextResponse.json({ success: true });
}

// DELETE — remove a specific mapping by id or by storeId+platform+campaignId
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const body = await req.json();
  const { mappingId, storeId, platform, campaignId } = body as {
    mappingId?: string;
    storeId?: string;
    platform?: string;
    campaignId?: string;
  };

  if (mappingId) {
    await db
      .delete(adCampaignStoreMap)
      .where(
        and(
          eq(adCampaignStoreMap.id, mappingId),
          eq(adCampaignStoreMap.userId, authResult.userId)
        )
      );
  } else if (storeId && platform && campaignId) {
    await db
      .delete(adCampaignStoreMap)
      .where(
        and(
          eq(adCampaignStoreMap.userId, authResult.userId),
          eq(adCampaignStoreMap.storeId, storeId),
          eq(
            adCampaignStoreMap.platform,
            platform as "google" | "meta" | "tiktok" | "bing" | "snapchat" | "amazon"
          ),
          eq(adCampaignStoreMap.campaignId, campaignId)
        )
      );
  } else {
    return NextResponse.json(
      { error: "Provide either mappingId or storeId+platform+campaignId" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
