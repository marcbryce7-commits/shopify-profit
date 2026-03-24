export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeShopifyCode, ShopifyClient } from "@/lib/shopify/client";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";

function getBaseUrl(req: NextRequest): string {
  // Use env vars first, fall back to request headers
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.AUTH_URL) return process.env.AUTH_URL;
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost";
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
  const shop = searchParams.get("shop");

  // Verify state
  const savedState = req.cookies.get("shopify_oauth_state")?.value;
  const savedShop = req.cookies.get("shopify_oauth_shop")?.value;

  if (!code || !state || !shop || state !== savedState || shop !== savedShop) {
    return NextResponse.redirect(`${base}/stores?error=invalid_oauth`);
  }

  try {
    // Exchange code for access token
    const { access_token } = await exchangeShopifyCode(shop, code);

    // Get shop info
    const client = new ShopifyClient(shop, access_token);
    const { shop: shopInfo } = await client.getShopInfo();

    // Save store to database
    await db.insert(stores).values({
      userId: session.user.id,
      shopifyDomain: shop,
      shopifyAccessToken: encrypt(access_token),
      name: shopInfo.name,
      status: "active",
    });

    // Clear OAuth cookies
    const response = NextResponse.redirect(`${base}/stores?success=connected`);
    response.cookies.delete("shopify_oauth_state");
    response.cookies.delete("shopify_oauth_shop");

    return response;
  } catch (error) {
    console.error("Shopify OAuth callback error:", error);
    return NextResponse.redirect(`${base}/stores?error=connection_failed`);
  }
}
