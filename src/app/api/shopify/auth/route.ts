import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getShopifyAuthUrl } from "@/lib/shopify/client";
import { randomBytes } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json(
      { error: "Missing shop parameter (e.g., mystore.myshopify.com)" },
      { status: 400 }
    );
  }

  // Validate shop domain format
  if (!/^[a-zA-Z0-9-]+\.myshopify\.com$/.test(shop)) {
    return NextResponse.json(
      { error: "Invalid shop domain. Must be like: mystore.myshopify.com" },
      { status: 400 }
    );
  }

  // Generate state for CSRF protection
  const state = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(getShopifyAuthUrl(shop, state));
  response.cookies.set("shopify_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
  });
  response.cookies.set("shopify_oauth_shop", shop, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
  });

  return response;
}
