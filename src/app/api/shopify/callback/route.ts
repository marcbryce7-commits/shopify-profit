export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeShopifyCode, ShopifyClient } from "@/lib/shopify/client";
import { encrypt } from "@/lib/crypto";
import { db } from "@/lib/db";
import { stores } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const shop = searchParams.get("shop");

  // Verify state
  const savedState = req.cookies.get("shopify_oauth_state")?.value;
  const savedShop = req.cookies.get("shopify_oauth_shop")?.value;

  if (!code || !state || !shop || state !== savedState || shop !== savedShop) {
    return NextResponse.redirect(
      new URL("/stores?error=invalid_oauth", req.url)
    );
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
    const response = NextResponse.redirect(
      new URL("/stores?success=connected", req.url)
    );
    response.cookies.delete("shopify_oauth_state");
    response.cookies.delete("shopify_oauth_shop");

    return response;
  } catch (error) {
    console.error("Shopify OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/stores?error=connection_failed", req.url)
    );
  }
}
