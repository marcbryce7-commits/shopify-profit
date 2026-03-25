export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { adPlatformConnections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform) {
    return NextResponse.json(
      { error: "Missing platform query parameter" },
      { status: 400 }
    );
  }

  // Look up the user's ad platform connection for the requested platform
  const [connection] = await db
    .select()
    .from(adPlatformConnections)
    .where(
      and(
        eq(adPlatformConnections.userId, authResult.userId),
        eq(adPlatformConnections.platform, platform as "google" | "meta" | "tiktok" | "bing" | "snapchat" | "amazon")
      )
    )
    .limit(1);

  if (!connection) {
    return NextResponse.json(
      { error: "Not connected to this platform" },
      { status: 400 }
    );
  }

  const accessToken = decrypt(connection.accessToken);

  try {
    let campaigns: { id: string; name: string; status: string }[] = [];

    if (platform === "meta") {
      const accountId = connection.accountId;
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${accountId}/campaigns?fields=id,name,status,daily_budget,lifetime_budget&access_token=${accessToken}`
      );
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: `Meta API error: ${err}` },
          { status: 502 }
        );
      }
      const data = await res.json();
      campaigns = (data.data ?? []).map(
        (c: { id: string; name: string; status: string }) => ({
          id: c.id,
          name: c.name,
          status: c.status,
        })
      );
    } else if (platform === "google") {
      const customerId = connection.accountId;
      const res = await fetch(
        `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? "",
          },
          body: JSON.stringify({
            query:
              "SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.name",
          }),
        }
      );
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: `Google Ads API error: ${err}` },
          { status: 502 }
        );
      }
      const data = await res.json();
      // Google Ads searchStream returns an array of result batches
      const results = Array.isArray(data) ? data : [data];
      for (const batch of results) {
        for (const row of batch.results ?? []) {
          campaigns.push({
            id: String(row.campaign.id),
            name: row.campaign.name,
            status: row.campaign.status,
          });
        }
      }
    } else {
      return NextResponse.json(
        { error: `Platform "${platform}" campaign listing is not yet supported` },
        { status: 400 }
      );
    }

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error("Failed to fetch campaigns:", err);
    return NextResponse.json(
      { error: "Failed to fetch campaigns from platform" },
      { status: 500 }
    );
  }
}
