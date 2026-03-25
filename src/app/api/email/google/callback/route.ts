import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { connectedEmails } from "@/lib/db/schema";
import { encrypt } from "@/lib/crypto";
import { eq, and } from "drizzle-orm";

const getBaseUrl = () =>
  process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_email_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(
      new URL("/shipping?error=invalid_oauth", req.url)
    );
  }

  // Clear state cookie
  cookieStore.delete("google_email_oauth_state");

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${getBaseUrl()}/api/email/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Get user email from Gmail profile
    const profileResponse = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/profile",
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (!profileResponse.ok) {
      throw new Error("Failed to fetch Gmail profile");
    }

    const profile = await profileResponse.json();
    const emailAddress = profile.emailAddress;

    // Encrypt tokens
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token
      ? encrypt(refresh_token)
      : null;

    // Calculate expiry
    const expiresAt = new Date(Date.now() + expires_in * 1000);

    // Check if email already connected for this user
    const existing = await db
      .select()
      .from(connectedEmails)
      .where(
        and(
          eq(connectedEmails.userId, session.user.id),
          eq(connectedEmails.emailAddress, emailAddress)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      await db
        .update(connectedEmails)
        .set({
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          expiresAt,
          active: true,
        })
        .where(eq(connectedEmails.id, existing[0].id));
    } else {
      // Insert new record
      await db.insert(connectedEmails).values({
        userId: session.user.id,
        provider: "gmail",
        emailAddress,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        active: true,
      });
    }

    return NextResponse.redirect(
      new URL("/shipping?success=gmail_connected", req.url)
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/shipping?error=connection_failed", req.url)
    );
  }
}
