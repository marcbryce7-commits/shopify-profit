import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const getBaseUrl = () =>
  process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Generate state for CSRF protection
  const state = randomBytes(32).toString("hex");

  // Set state cookie
  const cookieStore = await cookies();
  cookieStore.set("outlook_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // Build Microsoft OAuth URL
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${getBaseUrl()}/api/email/outlook/callback`,
    response_mode: "query",
    scope: "openid email Mail.Read offline_access",
    state,
  });

  const microsoftAuthUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

  return NextResponse.redirect(microsoftAuthUrl);
}
