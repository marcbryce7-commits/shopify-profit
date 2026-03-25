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
    return NextResponse.redirect(`${getBaseUrl()}/login`);
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Verify state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("outlook_oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    console.error("Outlook OAuth state mismatch", {
      hasCode: !!code,
      hasState: !!state,
      stateMatch: state === savedState,
    });
    return NextResponse.redirect(
      `${getBaseUrl()}/shipping?error=invalid_oauth`
    );
  }

  // Clear state cookie
  cookieStore.delete("outlook_oauth_state");

  try {
    // Exchange code for tokens
    const tokenBody = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${getBaseUrl()}/api/email/outlook/callback`,
      scope: "openid email Mail.Read offline_access",
    });

    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenBody.toString(),
      }
    );

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in, id_token } = tokens;

    // Extract email from id_token JWT payload (avoids Graph API permission issues)
    let emailAddress = "";
    if (id_token) {
      try {
        const payload = JSON.parse(Buffer.from(id_token.split(".")[1], "base64").toString());
        emailAddress = payload.email || payload.preferred_username || payload.upn || "";
      } catch {}
    }

    // Fallback to Graph API if no email in token
    if (!emailAddress) {
      const profileResponse = await fetch(
        "https://graph.microsoft.com/v1.0/me",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        emailAddress = profile.mail || profile.userPrincipalName || "";
      }
    }

    if (!emailAddress) {
      throw new Error("Could not determine email address");
    }

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
        provider: "outlook",
        emailAddress,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        expiresAt,
        active: true,
      });
    }

    return NextResponse.redirect(
      `${getBaseUrl()}/shipping?success=outlook_connected`
    );
  } catch (error) {
    console.error("Outlook OAuth callback error:", error);
    return NextResponse.redirect(
      `${getBaseUrl()}/shipping?error=connection_failed`
    );
  }
}
