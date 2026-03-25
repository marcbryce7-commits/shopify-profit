import { db } from "@/lib/db";
import {
  connectedEmails,
  emailLogs,
  orders,
  shippingCostUpdates,
} from "@/lib/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import { eq, and, ilike } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExtractedInvoice {
  invoiceNumber: string | null;
  supplierName: string | null;
  totalAmount: number | null;
  trackingNumber: string | null;
  orderReference: string | null;
}

interface ScanResults {
  scanned: number;
  matched: number;
  pending: number;
  skipped: number;
  errors: number;
}

// ─── Pattern-based extraction ───────────────────────────────────────────────

function extractFromText(text: string): ExtractedInvoice {
  // Tracking numbers
  const fedexMatch = text.match(/\b(\d{12,22})\b/);
  const upsMatch = text.match(/\b(1Z[A-Z0-9]{16})\b/i);
  const uspsMatch = text.match(/\b(9[2-5]\d{19,21})\b/);
  const trackingNumber =
    upsMatch?.[1] || uspsMatch?.[1] || fedexMatch?.[1] || null;

  // Dollar amounts — find the largest as likely total
  const amountMatches = text.match(/\$[\d,]+\.\d{2}/g);
  let totalAmount: number | null = null;
  if (amountMatches) {
    const amounts = amountMatches.map((a) =>
      parseFloat(a.replace(/[$,]/g, ""))
    );
    totalAmount = Math.max(...amounts);
  }

  // Invoice numbers
  const invoiceMatch = text.match(
    /(?:invoice|inv|invoice\s*#|inv\s*#|invoice\s*number)[:\s]*([A-Z0-9-]+)/i
  );
  const invoiceNumber = invoiceMatch?.[1] || null;

  // Order references
  const orderMatch = text.match(
    /(?:order|ord|order\s*#|po\s*#|reference)[:\s]*#?(\d{3,10})/i
  );
  const orderReference = orderMatch?.[1] || null;

  // Supplier name from common carriers
  let supplierName: string | null = null;
  const textLower = text.toLowerCase();
  if (textLower.includes("fedex") || textLower.includes("federal express"))
    supplierName = "FedEx";
  else if (textLower.includes("ups") || textLower.includes("united parcel"))
    supplierName = "UPS";
  else if (
    textLower.includes("usps") ||
    textLower.includes("united states postal")
  )
    supplierName = "USPS";
  else if (textLower.includes("dhl")) supplierName = "DHL";

  return {
    invoiceNumber,
    supplierName,
    totalAmount,
    trackingNumber,
    orderReference,
  };
}

// ─── Gemini PDF extraction ──────────────────────────────────────────────────

async function extractFromPdfWithGemini(
  pdfBase64: string
): Promise<ExtractedInvoice> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Extract shipping invoice data from this PDF. Return ONLY valid JSON with these fields: invoice_number (string or null), supplier_name (string or null), total_amount (number or null), tracking_number (string or null), order_reference (string or null). If a field is not found, set to null.',
              },
              {
                inline_data: {
                  mime_type: "application/pdf",
                  data: pdfBase64,
                },
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Gemini API error:", err);
    throw new Error("Gemini API call failed");
  }

  const result = await response.json();
  const text =
    result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  // Extract JSON from response (may be wrapped in ```json blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      invoiceNumber: null,
      supplierName: null,
      totalAmount: null,
      trackingNumber: null,
      orderReference: null,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      invoiceNumber: parsed.invoice_number || null,
      supplierName: parsed.supplier_name || null,
      totalAmount:
        typeof parsed.total_amount === "number" ? parsed.total_amount : null,
      trackingNumber: parsed.tracking_number || null,
      orderReference: parsed.order_reference || null,
    };
  } catch {
    return {
      invoiceNumber: null,
      supplierName: null,
      totalAmount: null,
      trackingNumber: null,
      orderReference: null,
    };
  }
}

// ─── Token refresh helpers ──────────────────────────────────────────────────

async function refreshGmailToken(account: {
  id: string;
  refreshToken: string | null;
}): Promise<string | null> {
  if (!account.refreshToken) return null;

  const refreshToken = decrypt(account.refreshToken);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) return null;

  const tokens = await response.json();
  const newAccessToken = tokens.access_token;
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db
    .update(connectedEmails)
    .set({
      accessToken: encrypt(newAccessToken),
      expiresAt,
    })
    .where(eq(connectedEmails.id, account.id));

  return newAccessToken;
}

async function refreshOutlookToken(account: {
  id: string;
  refreshToken: string | null;
}): Promise<string | null> {
  if (!account.refreshToken) return null;

  const refreshToken = decrypt(account.refreshToken);
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: "openid email Mail.Read offline_access",
  });

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }
  );

  if (!response.ok) return null;

  const tokens = await response.json();
  const newAccessToken = tokens.access_token;
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  await db
    .update(connectedEmails)
    .set({
      accessToken: encrypt(newAccessToken),
      refreshToken: tokens.refresh_token
        ? encrypt(tokens.refresh_token)
        : undefined,
      expiresAt,
    })
    .where(eq(connectedEmails.id, account.id));

  return newAccessToken;
}

// ─── Gmail scanning ─────────────────────────────────────────────────────────

async function scanGmail(
  account: {
    id: string;
    accessToken: string;
    refreshToken: string | null;
    userId: string;
  },
  userOrders: { id: string; orderNumber: string }[]
): Promise<{ scanned: number; matched: number; pending: number; skipped: number }> {
  let accessToken = decrypt(account.accessToken);
  const results = { scanned: 0, matched: 0, pending: 0, skipped: 0 };

  // Search for shipping-related emails from last 7 days
  const query = encodeURIComponent(
    '(fedex OR ups OR usps OR dhl OR shipping OR invoice OR freight OR tracking) newer_than:30d'
  );

  let listResponse = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // Token refresh on 401
  if (listResponse.status === 401) {
    console.log("Gmail token expired, refreshing...");
    const newToken = await refreshGmailToken(account);
    if (!newToken) {
      console.error("Failed to refresh Gmail token for", account.id);
      return results;
    }
    accessToken = newToken;
    listResponse = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  if (!listResponse.ok) {
    console.error("Gmail list failed:", listResponse.status);
    return results;
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];
  console.log(`Found ${messages.length} shipping-related emails in Gmail`);

  for (const msg of messages) {
    try {
      results.scanned++;

      // Get full message
      const msgResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (!msgResponse.ok) continue;
      const msgData = await msgResponse.json();

      const headers = msgData.payload?.headers || [];
      const subject =
        headers.find((h: { name: string }) => h.name === "Subject")?.value || "";
      const sender =
        headers.find((h: { name: string }) => h.name === "From")?.value || "";
      const dateStr =
        headers.find((h: { name: string }) => h.name === "Date")?.value || "";

      // Extract body text
      let bodyText = "";
      const parts = msgData.payload?.parts || [msgData.payload];
      for (const part of parts) {
        if (part?.mimeType === "text/plain" && part?.body?.data) {
          bodyText += Buffer.from(part.body.data, "base64url").toString();
        }
      }

      // Try pattern extraction from body
      let extracted = extractFromText(bodyText + " " + subject);

      // Check for PDF attachments and use Gemini
      const attachmentParts = (msgData.payload?.parts || []).filter(
        (p: { mimeType: string }) => p.mimeType === "application/pdf"
      );

      for (const att of attachmentParts) {
        if (att.body?.attachmentId) {
          try {
            const attResponse = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${att.body.attachmentId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (attResponse.ok) {
              const attData = await attResponse.json();
              // Gmail uses URL-safe base64, convert to standard
              const pdfBase64 = attData.data
                .replace(/-/g, "+")
                .replace(/_/g, "/");
              const pdfExtracted = await extractFromPdfWithGemini(pdfBase64);
              // Merge: prefer PDF data over email body data
              extracted = {
                invoiceNumber:
                  pdfExtracted.invoiceNumber || extracted.invoiceNumber,
                supplierName:
                  pdfExtracted.supplierName || extracted.supplierName,
                totalAmount:
                  pdfExtracted.totalAmount || extracted.totalAmount,
                trackingNumber:
                  pdfExtracted.trackingNumber || extracted.trackingNumber,
                orderReference:
                  pdfExtracted.orderReference || extracted.orderReference,
              };
            }
          } catch (e) {
            console.error("PDF extraction failed:", e);
          }
        }
      }

      // Check if we got any useful data
      const hasData =
        extracted.totalAmount || extracted.trackingNumber || extracted.invoiceNumber;

      if (!hasData) {
        // Log as skipped
        await db.insert(emailLogs).values({
          userId: account.userId,
          connectedEmailId: account.id,
          emailSubject: subject,
          sender,
          receivedAt: dateStr ? new Date(dateStr) : new Date(),
          processedAt: new Date(),
          status: "skipped",
          extractedData: extracted,
        });
        results.skipped++;
        continue;
      }

      // Try to match to an order
      let matchedOrderId: string | null = null;
      if (extracted.orderReference) {
        const match = userOrders.find(
          (o) =>
            o.orderNumber === extracted.orderReference ||
            o.orderNumber === `#${extracted.orderReference}`
        );
        if (match) matchedOrderId = match.id;
      }

      // Also try matching by tracking number in subject/body
      if (!matchedOrderId) {
        // Check if any order number appears in the email
        for (const order of userOrders) {
          const num = order.orderNumber.replace("#", "");
          if (bodyText.includes(num) || subject.includes(num)) {
            matchedOrderId = order.id;
            break;
          }
        }
      }

      const status = matchedOrderId ? "matched" : "pending";

      // Create email log
      await db.insert(emailLogs).values({
        userId: account.userId,
        connectedEmailId: account.id,
        emailSubject: subject,
        sender,
        receivedAt: dateStr ? new Date(dateStr) : new Date(),
        processedAt: new Date(),
        status,
        extractedData: {
          invoice: extracted.invoiceNumber,
          supplier: extracted.supplierName,
          amount: extracted.totalAmount,
          order: extracted.orderReference,
          tracking: extracted.trackingNumber,
          confidence: matchedOrderId ? 85 : 50,
        },
      });

      // If matched, create shipping cost update
      if (matchedOrderId && extracted.totalAmount) {
        await db.insert(shippingCostUpdates).values({
          orderId: matchedOrderId,
          source: "email",
          amount: String(extracted.totalAmount),
          invoiceNumber: extracted.invoiceNumber,
          supplierName: extracted.supplierName,
        });

        // Update order's actual shipping cost
        await db
          .update(orders)
          .set({ actualShippingCost: String(extracted.totalAmount) })
          .where(eq(orders.id, matchedOrderId));

        results.matched++;
      } else {
        results.pending++;
      }
    } catch (e) {
      console.error("Error processing Gmail message:", e);
    }
  }

  // Update last scanned timestamp
  await db
    .update(connectedEmails)
    .set({ lastScannedAt: new Date() })
    .where(eq(connectedEmails.id, account.id));

  return results;
}

// ─── Outlook scanning ───────────────────────────────────────────────────────

async function scanOutlook(
  account: {
    id: string;
    accessToken: string;
    refreshToken: string | null;
    userId: string;
  },
  userOrders: { id: string; orderNumber: string }[]
): Promise<{ scanned: number; matched: number; pending: number; skipped: number }> {
  let accessToken = decrypt(account.accessToken);
  const results = { scanned: 0, matched: 0, pending: 0, skipped: 0 };

  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Microsoft Graph can't combine $filter and $search — use $search only
  const outlookUrl = `https://graph.microsoft.com/v1.0/me/messages?$search="fedex OR ups OR usps OR dhl OR shipping OR invoice OR freight"&$top=50&$select=id,subject,from,receivedDateTime,body,hasAttachments&$orderby=receivedDateTime desc`;

  let listResponse = await fetch(outlookUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Token refresh on 401
  if (listResponse.status === 401) {
    console.log("Outlook token expired, refreshing...");
    const newToken = await refreshOutlookToken(account);
    if (!newToken) {
      console.error("Failed to refresh Outlook token for", account.id);
      return results;
    }
    accessToken = newToken;
    listResponse = await fetch(outlookUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  if (!listResponse.ok) {
    const errBody = await listResponse.text();
    console.error("Outlook list failed:", listResponse.status, errBody);
  }

  if (!listResponse.ok) {
    console.error("Outlook list failed:", listResponse.status);
    return results;
  }

  const listData = await listResponse.json();
  const messages = listData.value || [];
  console.log(`Found ${messages.length} shipping-related emails in Outlook`);

  for (const msg of messages) {
    try {
      results.scanned++;

      const subject = msg.subject || "";
      const sender = msg.from?.emailAddress?.address || "";
      const bodyText = msg.body?.content || "";
      const receivedAt = msg.receivedDateTime
        ? new Date(msg.receivedDateTime)
        : new Date();

      // Pattern extraction from body
      let extracted = extractFromText(bodyText + " " + subject);

      // Check for PDF attachments
      if (msg.hasAttachments) {
        try {
          const attResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/messages/${msg.id}/attachments`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (attResponse.ok) {
            const attData = await attResponse.json();
            const pdfAttachments = (attData.value || []).filter(
              (a: { contentType: string }) =>
                a.contentType === "application/pdf"
            );
            for (const att of pdfAttachments) {
              if (att.contentBytes) {
                try {
                  const pdfExtracted = await extractFromPdfWithGemini(
                    att.contentBytes
                  );
                  extracted = {
                    invoiceNumber:
                      pdfExtracted.invoiceNumber || extracted.invoiceNumber,
                    supplierName:
                      pdfExtracted.supplierName || extracted.supplierName,
                    totalAmount:
                      pdfExtracted.totalAmount || extracted.totalAmount,
                    trackingNumber:
                      pdfExtracted.trackingNumber || extracted.trackingNumber,
                    orderReference:
                      pdfExtracted.orderReference || extracted.orderReference,
                  };
                } catch (e) {
                  console.error("PDF extraction failed:", e);
                }
              }
            }
          }
        } catch (e) {
          console.error("Outlook attachments fetch failed:", e);
        }
      }

      const hasData =
        extracted.totalAmount || extracted.trackingNumber || extracted.invoiceNumber;

      if (!hasData) {
        await db.insert(emailLogs).values({
          userId: account.userId,
          connectedEmailId: account.id,
          emailSubject: subject,
          sender,
          receivedAt,
          processedAt: new Date(),
          status: "skipped",
          extractedData: extracted,
        });
        results.skipped++;
        continue;
      }

      // Match to order
      let matchedOrderId: string | null = null;
      if (extracted.orderReference) {
        const match = userOrders.find(
          (o) =>
            o.orderNumber === extracted.orderReference ||
            o.orderNumber === `#${extracted.orderReference}`
        );
        if (match) matchedOrderId = match.id;
      }

      if (!matchedOrderId) {
        for (const order of userOrders) {
          const num = order.orderNumber.replace("#", "");
          if (bodyText.includes(num) || subject.includes(num)) {
            matchedOrderId = order.id;
            break;
          }
        }
      }

      const status = matchedOrderId ? "matched" : "pending";

      await db.insert(emailLogs).values({
        userId: account.userId,
        connectedEmailId: account.id,
        emailSubject: subject,
        sender,
        receivedAt,
        processedAt: new Date(),
        status,
        extractedData: {
          invoice: extracted.invoiceNumber,
          supplier: extracted.supplierName,
          amount: extracted.totalAmount,
          order: extracted.orderReference,
          tracking: extracted.trackingNumber,
          confidence: matchedOrderId ? 85 : 50,
        },
      });

      if (matchedOrderId && extracted.totalAmount) {
        await db.insert(shippingCostUpdates).values({
          orderId: matchedOrderId,
          source: "email",
          amount: String(extracted.totalAmount),
          invoiceNumber: extracted.invoiceNumber,
          supplierName: extracted.supplierName,
        });

        await db
          .update(orders)
          .set({ actualShippingCost: String(extracted.totalAmount) })
          .where(eq(orders.id, matchedOrderId));

        results.matched++;
      } else {
        results.pending++;
      }
    } catch (e) {
      console.error("Error processing Outlook message:", e);
    }
  }

  await db
    .update(connectedEmails)
    .set({ lastScannedAt: new Date() })
    .where(eq(connectedEmails.id, account.id));

  return results;
}

// ─── Main scan function ─────────────────────────────────────────────────────

export async function scanEmails(userId: string): Promise<ScanResults> {
  console.log("Starting email scan for user:", userId);

  const totals: ScanResults = {
    scanned: 0,
    matched: 0,
    pending: 0,
    skipped: 0,
    errors: 0,
  };

  // Get all active connected emails
  const accounts = await db
    .select()
    .from(connectedEmails)
    .where(
      and(eq(connectedEmails.userId, userId), eq(connectedEmails.active, true))
    );

  if (accounts.length === 0) {
    console.log("No active email accounts found");
    return totals;
  }

  // Get all user orders for matching
  const userStoreOrders = await db
    .select({ id: orders.id, orderNumber: orders.orderNumber })
    .from(orders);

  console.log(
    `Scanning ${accounts.length} accounts against ${userStoreOrders.length} orders`
  );

  for (const account of accounts) {
    try {
      console.log(`Scanning ${account.provider}: ${account.emailAddress}`);

      let results;
      if (account.provider === "gmail") {
        results = await scanGmail(
          {
            id: account.id,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            userId: account.userId,
          },
          userStoreOrders
        );
      } else if (account.provider === "outlook") {
        results = await scanOutlook(
          {
            id: account.id,
            accessToken: account.accessToken,
            refreshToken: account.refreshToken,
            userId: account.userId,
          },
          userStoreOrders
        );
      } else {
        console.log(`Unsupported provider: ${account.provider}`);
        continue;
      }

      totals.scanned += results.scanned;
      totals.matched += results.matched;
      totals.pending += results.pending;
      totals.skipped += results.skipped;

      console.log(
        `${account.emailAddress}: scanned=${results.scanned} matched=${results.matched} pending=${results.pending} skipped=${results.skipped}`
      );
    } catch (e) {
      console.error(`Error scanning ${account.emailAddress}:`, e);
      totals.errors++;
    }
  }

  console.log("Scan complete:", totals);
  return totals;
}
