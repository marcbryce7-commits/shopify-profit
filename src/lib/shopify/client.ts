const SHOPIFY_SCOPES = [
  "read_orders",
  "read_products",
  "read_inventory",
  "read_fulfillments",
  "write_fulfillments",
  "read_shipping",
  "read_customers",
].join(",");

export function getShopifyAuthUrl(shop: string, state: string): string {
  const clientId = process.env.SHOPIFY_CLIENT_ID!;
  const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://shopify-profit-production.up.railway.app";
  const redirectUri = `${baseUrl}/api/shopify/callback`;

  return (
    `https://${shop}/admin/oauth/authorize?` +
    `client_id=${clientId}` +
    `&scope=${SHOPIFY_SCOPES}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}`
  );
}

export async function exchangeShopifyCode(
  shop: string,
  code: string
): Promise<{ access_token: string }> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID!,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET!,
      code,
    }),
  });

  if (!res.ok) {
    throw new Error(`Shopify token exchange failed: ${res.statusText}`);
  }

  return res.json();
}

export class ShopifyClient {
  private domain: string;
  private accessToken: string;

  constructor(domain: string, accessToken: string) {
    this.domain = domain;
    this.accessToken = accessToken;
  }

  async graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const res = await fetch(
      `https://${this.domain}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": this.accessToken,
        },
        body: JSON.stringify({ query, variables }),
      }
    );

    if (!res.ok) {
      throw new Error(`Shopify GraphQL error: ${res.statusText}`);
    }

    const data = await res.json();
    // Only throw if there's no data at all — partial errors (like missing scopes) are OK
    if (data.errors && !data.data) {
      throw new Error(`Shopify GraphQL errors: ${JSON.stringify(data.errors)}`);
    }
    if (data.errors) {
      console.warn("Shopify GraphQL partial errors (non-fatal):", data.errors.length, "errors");
    }

    return data.data;
  }

  async getShopInfo() {
    return this.graphql<{ shop: { name: string; myshopifyDomain: string } }>(`
      {
        shop {
          name
          myshopifyDomain
        }
      }
    `);
  }

  async getFulfillmentOrders(shopifyOrderId: string) {
    return this.graphql<{
      order: {
        fulfillmentOrders: {
          edges: Array<{
            node: {
              id: string;
              status: string;
              lineItems: {
                edges: Array<{
                  node: {
                    id: string;
                    remainingQuantity: number;
                  };
                }>;
              };
            };
          }>;
        };
      };
    }>(`
      query GetFulfillmentOrders($orderId: ID!) {
        order(id: $orderId) {
          fulfillmentOrders(first: 10) {
            edges {
              node {
                id
                status
                lineItems(first: 50) {
                  edges {
                    node {
                      id
                      remainingQuantity
                    }
                  }
                }
              }
            }
          }
        }
      }
    `, { orderId: shopifyOrderId });
  }

  async createFulfillment(input: {
    fulfillmentOrderId: string;
    trackingNumber: string;
    trackingCompany: string;
    notifyCustomer: boolean;
    lineItemsByFulfillmentOrder?: Array<{
      fulfillmentOrderId: string;
      fulfillmentOrderLineItems: Array<{ id: string; quantity: number }>;
    }>;
  }) {
    return this.graphql<{
      fulfillmentCreateV2: {
        fulfillment: {
          id: string;
          status: string;
          trackingInfo: Array<{ number: string; company: string; url: string }>;
        } | null;
        userErrors: Array<{ field: string[]; message: string }>;
      };
    }>(`
      mutation FulfillmentCreateV2($fulfillment: FulfillmentV2Input!) {
        fulfillmentCreateV2(fulfillment: $fulfillment) {
          fulfillment {
            id
            status
            trackingInfo {
              number
              company
              url
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `, {
      fulfillment: {
        lineItemsByFulfillmentOrder: input.lineItemsByFulfillmentOrder || [{
          fulfillmentOrderId: input.fulfillmentOrderId,
        }],
        notifyCustomer: input.notifyCustomer,
        trackingInfo: {
          number: input.trackingNumber,
          company: input.trackingCompany,
        },
      },
    });
  }

  async getOrders(cursor?: string, updatedAtMin?: string) {
    const query = updatedAtMin
      ? `updated_at:>'${updatedAtMin}'`
      : "";

    return this.graphql<{
      orders: {
        edges: Array<{
          node: Record<string, unknown>;
          cursor: string;
        }>;
        pageInfo: { hasNextPage: boolean };
      };
    }>(`
      query GetOrders($first: Int!, $after: String, $query: String) {
        orders(first: $first, after: $after, query: $query, sortKey: UPDATED_AT) {
          edges {
            node {
              id
              name
              createdAt
              updatedAt
              displayFinancialStatus
              displayFulfillmentStatus
              subtotalPriceSet { shopMoney { amount currencyCode } }
              totalTaxSet { shopMoney { amount currencyCode } }
              totalShippingPriceSet { shopMoney { amount currencyCode } }
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { id email firstName lastName }
              shippingAddress { province provinceCode country countryCode }
              taxLines { title rate priceSet { shopMoney { amount } } }
              lineItems(first: 50) {
                edges {
                  node {
                    id
                    title
                    sku
                    quantity
                    originalUnitPriceSet { shopMoney { amount } }
                    product { id }
                    variant { id inventoryItem { unitCost { amount } } }
                  }
                }
              }
              transactions {
                gateway
                fees { amount { amount } type }
              }
            }
            cursor
          }
          pageInfo { hasNextPage }
        }
      }
    `, {
      first: 50,
      after: cursor || null,
      query: query || null,
    });
  }
}
