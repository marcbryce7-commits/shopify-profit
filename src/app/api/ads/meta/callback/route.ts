export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { adPlatformConnections } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const base = getBaseUrl(req);

  if (!session?.user) {
    return NextResponse.redirect(`${base}/login`);
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Verify state
  const savedState = req.cookies.get("meta_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${base}/ads?error=invalid_oauth`);
  }

  try {
    // Exchange code for short-lived token
    const tokenParams = new URLSearchParams({
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      code,
      redirect_uri: `${base}/api/ads/meta/callback`,
    });

    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${tokenParams.toString()}`
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Meta token exchange failed:", err);
      return NextResponse.redirect(`${base}/ads?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;

    // Exchange for long-lived token
    const longLivedParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      fb_exchange_token: shortLivedToken,
    });

    const longLivedRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${longLivedParams.toString()}`
    );

    if (!longLivedRes.ok) {
      const err = await longLivedRes.text();
      console.error("Meta long-lived token exchange failed:", err);
      return NextResponse.redirect(`${base}/ads?error=token_exchange_failed`);
    }

    const longLivedData = await longLivedRes.json();
    const accessToken = longLivedData.access_token;

    // Get ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v21.0/me/adaccounts?fields=name,account_id&access_token=${accessToken}`
    );

    let accountId = "unknown";
    let accountName = "Meta Ads Account";

    if (adAccountsRes.ok) {
      const adAccountsData = await adAccountsRes.json();
      if (adAccountsData.data?.length > 0) {
        accountId = adAccountsData.data[0].account_id;
        accountName = adAccountsData.data[0].name || accountId;
      }
    }

    // Upsert: select then insert or update
    const encryptedAccessToken = encrypt(accessToken);

    const [existing] = await db
      .select({ id: adPlatformConnections.id })
      .from(adPlatformConnections)
      .where(
        and(
          eq(adPlatformConnections.userId, session.user.id),
          eq(adPlatformConnections.platform, "meta")
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(adPlatformConnections)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: null,
          accountId,
          accountName,
          lastSyncAt: new Date(),
        })
        .where(eq(adPlatformConnections.id, existing.id));
    } else {
      await db.insert(adPlatformConnections).values({
        userId: session.user.id,
        platform: "meta",
        accessToken: encryptedAccessToken,
        refreshToken: null,
        accountId,
        accountName,
      });
    }

    // Clear OAuth cookie and redirect
    const response = NextResponse.redirect(
      `${base}/ads?success=meta_connected`
    );
    response.cookies.delete("meta_oauth_state");
    return response;
  } catch (error) {
    console.error("Meta Ads OAuth callback error:", error);
    return NextResponse.redirect(`${base}/ads?error=connection_failed`);
  }
}
