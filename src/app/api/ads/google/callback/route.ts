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
  const savedState = req.cookies.get("google_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${base}/ads?error=invalid_oauth`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        redirect_uri: `${base}/api/ads/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token exchange failed:", err);
      return NextResponse.redirect(`${base}/ads?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const { access_token, refresh_token } = tokenData;

    // Get accessible customer accounts
    const customersRes = await fetch(
      "https://googleads.googleapis.com/v17/customers:listAccessibleCustomers",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        },
      }
    );

    let accountId = "unknown";
    let accountName = "Google Ads Account";

    if (customersRes.ok) {
      const customersData = await customersRes.json();
      // resourceNames look like "customers/1234567890"
      if (customersData.resourceNames?.length > 0) {
        accountId = customersData.resourceNames[0].replace("customers/", "");
        accountName = accountId;
      }
    }

    // Upsert: select then insert or update
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token
      ? encrypt(refresh_token)
      : null;

    const [existing] = await db
      .select({ id: adPlatformConnections.id })
      .from(adPlatformConnections)
      .where(
        and(
          eq(adPlatformConnections.userId, session.user.id),
          eq(adPlatformConnections.platform, "google")
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(adPlatformConnections)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          accountId,
          accountName,
          lastSyncAt: new Date(),
        })
        .where(eq(adPlatformConnections.id, existing.id));
    } else {
      await db.insert(adPlatformConnections).values({
        userId: session.user.id,
        platform: "google",
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accountId,
        accountName,
      });
    }

    // Clear OAuth cookie and redirect
    const response = NextResponse.redirect(
      `${base}/ads?success=google_connected`
    );
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (error) {
    console.error("Google Ads OAuth callback error:", error);
    return NextResponse.redirect(`${base}/ads?error=connection_failed`);
  }
}
