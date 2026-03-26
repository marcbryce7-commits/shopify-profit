import { db } from "@/lib/db";
import {
  connectedEmails,
  emailLogs,
  orders,
  shippingCostUpdates,
  stores,
} from "@/lib/db/schema";
import { decrypt, encrypt } from "@/lib/crypto";
import { eq, and, inArray } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ExtractedInvoice {
  invoiceNumber: string | null;
  supplierName: string | null;
  productCost: number | null;
  shippingCost: number | null;
  grandTotal: number | null;
  totalAmount: number | null; // kept for backward compat — equals shippingCost or grandTotal
  trackingNumber: string | null;
  orderReference: string | null;
  amountContext: string | null;
  emailLink: string | null;
  emailSubject: string;
  emailSnippet: string;
}

interface ScanResults {
  scanned: number;
  matched: number;
  pending: number;
  skipped: number;
  errors: number;
}

// ─── Pattern-based extraction ───────────────────────────────────────────────

function extractFromText(text: string): Omit<ExtractedInvoice, "emailLink" | "emailSubject" | "emailSnippet"> {
  // Tracking numbers
  const upsMatch = text.match(/\b(1Z[A-Z0-9]{16})\b/i);
  const uspsMatch = text.match(/\b(9[2-5]\d{19,21})\b/);
  const fedexMatch = text.match(/\b(\d{12,22})\b/);
  const trackingNumber = upsMatch?.[1] || uspsMatch?.[1] || fedexMatch?.[1] || null;

  // Dollar amounts — prefer shipping-specific amounts over grand total
  const amountMatches = text.match(/\$[\d,]+\.\d{2}/g);
  let totalAmount: number | null = null;
  let amountContext: string | null = null;
  if (amountMatches) {
    // First, look for amounts near shipping keywords
    const shippingKeywords = /shipping|freight|postage|delivery|carrier/i;
    for (const amtStr of amountMatches) {
      const idx = text.indexOf(amtStr);
      if (idx >= 0) {
        const nearby = text.substring(Math.max(0, idx - 60), idx + amtStr.length + 20);
        if (shippingKeywords.test(nearby)) {
          totalAmount = parseFloat(amtStr.replace(/[$,]/g, ""));
          const start = Math.max(0, idx - 80);
          const end = Math.min(text.length, idx + amtStr.length + 80);
          amountContext = text.substring(start, end).replace(/\s+/g, " ").trim();
          break;
        }
      }
    }
    // Fallback to largest amount if no shipping-specific one found
    if (!totalAmount) {
      const amounts = amountMatches.map((a) => parseFloat(a.replace(/[$,]/g, "")));
      totalAmount = Math.max(...amounts);
      const amountStr = amountMatches[amounts.indexOf(totalAmount)];
      const idx = text.indexOf(amountStr);
      if (idx >= 0) {
        const start = Math.max(0, idx - 80);
        const end = Math.min(text.length, idx + amountStr.length + 80);
        amountContext = text.substring(start, end).replace(/\s+/g, " ").trim();
      }
    }
  }

  // Invoice numbers
  const invoiceMatch = text.match(
    /(?:invoice|inv|invoice\s*#|inv\s*#|invoice\s*number)[:\s]*([A-Z0-9-]+)/i
  );
  const invoiceNumber = invoiceMatch?.[1] || null;

  // Order references
  const orderMatch = text.match(
    /(?:order|ord|order\s*#|po\s*#|reference|PO)[:\s]*#?(\w{2,20})/i
  );
  const orderReference = orderMatch?.[1] || null;

  // Supplier name from common carriers
  let supplierName: string | null = null;
  const textLower = text.toLowerCase();
  if (textLower.includes("fedex") || textLower.includes("federal express")) supplierName = "FedEx";
  else if (textLower.includes("ups") || textLower.includes("united parcel")) supplierName = "UPS";
  else if (textLower.includes("usps") || textLower.includes("united states postal")) supplierName = "USPS";
  else if (textLower.includes("dhl")) supplierName = "DHL";

  return { invoiceNumber, supplierName, productCost: null, shippingCost: totalAmount, grandTotal: null, totalAmount, trackingNumber, orderReference, amountContext };
}

// ─── ProfitPilot AI PDF extraction ──────────────────────────────────────────────────

async function extractFromPdfWithAI(pdfBase64: string): Promise<Omit<ExtractedInvoice, "emailLink" | "emailSubject" | "emailSnippet">> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: 'Extract cost data from this supplier invoice PDF. Return ONLY valid JSON with: invoice_number (string|null), supplier_name (string|null), product_cost (number|null — subtotal of product line items BEFORE shipping), shipping_cost (number|null — the shipping/freight line item amount only), grand_total (number|null — the overall invoice total including everything), tracking_number (string|null), order_reference (string|null — look for PO Number, Order #, or Reference fields), amount_context (string|null — the key lines showing product subtotal, shipping, and grand total). If not found, set null.' },
            { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
          ],
        }],
      }),
    }
  );

  if (!response.ok) {
    console.error("ProfitPilot AI API error:", await response.text());
    throw new Error("ProfitPilot AI API call failed");
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { invoiceNumber: null, supplierName: null, productCost: null, shippingCost: null, grandTotal: null, totalAmount: null, trackingNumber: null, orderReference: null, amountContext: null };

  try {
    const p = JSON.parse(jsonMatch[0]);
    const productCost = typeof p.product_cost === "number" ? p.product_cost : null;
    const shippingCost = typeof p.shipping_cost === "number" ? p.shipping_cost : null;
    const grandTotal = typeof p.grand_total === "number" ? p.grand_total : null;
    return {
      invoiceNumber: p.invoice_number || null,
      supplierName: p.supplier_name || null,
      productCost,
      shippingCost,
      grandTotal,
      totalAmount: shippingCost || grandTotal || null,
      trackingNumber: p.tracking_number || null,
      orderReference: p.order_reference || null,
      amountContext: p.amount_context || null,
    };
  } catch {
    return { invoiceNumber: null, supplierName: null, productCost: null, shippingCost: null, grandTotal: null, totalAmount: null, trackingNumber: null, orderReference: null, amountContext: null };
  }
}

// ─── Token refresh helpers ──────────────────────────────────────────────────

async function refreshGmailToken(account: { id: string; refreshToken: string | null }): Promise<string | null> {
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
  await db.update(connectedEmails).set({
    accessToken: encrypt(tokens.access_token),
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  }).where(eq(connectedEmails.id, account.id));
  return tokens.access_token;
}

async function refreshOutlookToken(account: { id: string; refreshToken: string | null }): Promise<string | null> {
  if (!account.refreshToken) return null;
  const refreshToken = decrypt(account.refreshToken);
  const body = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: "openid email Mail.Read offline_access",
  });
  const response = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) return null;
  const tokens = await response.json();
  await db.update(connectedEmails).set({
    accessToken: encrypt(tokens.access_token),
    refreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : undefined,
    expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
  }).where(eq(connectedEmails.id, account.id));
  return tokens.access_token;
}

// ─── Build search queries from orders ───────────────────────────────────────

function buildSearchTerms(
  userOrders: { id: string; orderNumber: string; customerName: string | null; customerEmail: string | null }[],
  poPrefix: string | null
): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();
  for (const order of userOrders) {
    const num = order.orderNumber.replace("#", "");
    // Add the full order number (e.g. RECOUT824989)
    if (!seen.has(num)) { terms.push(num); seen.add(num); }
    // Add just the numeric part if order already has a prefix
    if (poPrefix && num.toUpperCase().startsWith(poPrefix.toUpperCase())) {
      const justNum = num.substring(poPrefix.length);
      if (justNum && !seen.has(justNum)) { terms.push(justNum); seen.add(justNum); }
    } else if (poPrefix) {
      // Add prefix + number only if order doesn't already have it
      const po = `${poPrefix}${num}`;
      if (!seen.has(po)) { terms.push(po); seen.add(po); }
    }
    // Customer name (3+ chars to avoid false positives)
    if (order.customerName && order.customerName.length > 2 && !seen.has(order.customerName)) {
      terms.push(order.customerName);
      seen.add(order.customerName);
    }
  }
  return terms;
}

// ─── Gmail scanning (order-driven) ─────────────────────────────────────────

async function scanGmail(
  account: { id: string; accessToken: string; refreshToken: string | null; userId: string },
  userOrders: { id: string; orderNumber: string; customerName: string | null; customerEmail: string | null }[],
  poPrefix: string | null,
  ignoredSenders: string[]
): Promise<{ scanned: number; matched: number; pending: number; skipped: number }> {
  let accessToken = decrypt(account.accessToken);
  const results = { scanned: 0, matched: 0, pending: 0, skipped: 0 };

  // Build search: use order numbers and PO prefix
  const searchTerms = buildSearchTerms(userOrders.slice(0, 50), poPrefix); // Limit to recent 50 orders
  // Also include generic shipping keywords
  const orderQuery = searchTerms.map((t) => `"${t}"`).join(" OR ");
  const fullQuery = `(${orderQuery} OR fedex OR ups OR usps OR "shipping invoice") newer_than:365d`;
  const query = encodeURIComponent(fullQuery);

  console.log("Gmail search query (first 200 chars):", fullQuery.substring(0, 200));

  let listResponse = await fetch(
    `https://www.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=200`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (listResponse.status === 401) {
    const newToken = await refreshGmailToken(account);
    if (!newToken) return results;
    accessToken = newToken;
    listResponse = await fetch(
      `https://www.googleapis.com/gmail/v1/users/me/messages?q=${query}&maxResults=200`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  if (!listResponse.ok) {
    console.error("Gmail list failed:", listResponse.status);
    return results;
  }

  const listData = await listResponse.json();
  const messages = listData.messages || [];
  console.log(`Found ${messages.length} emails in Gmail`);

  for (const msg of messages) {
    try {
      results.scanned++;
      const msgResponse = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgResponse.ok) continue;
      const msgData = await msgResponse.json();

      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: { name: string }) => h.name === "Subject")?.value || "";
      const sender = headers.find((h: { name: string }) => h.name === "From")?.value || "";
      const dateStr = headers.find((h: { name: string }) => h.name === "Date")?.value || "";

      // Check ignore list
      const senderEmail = sender.match(/<([^>]+)>/)?.[1]?.toLowerCase() || sender.toLowerCase();
      if (ignoredSenders.some((ignored) => senderEmail.includes(ignored))) {
        results.skipped++;
        continue;
      }

      // Email link for Gmail
      const emailLink = `https://mail.google.com/mail/u/0/#inbox/${msg.id}`;

      // Extract body text
      let bodyText = "";
      const parts = msgData.payload?.parts || [msgData.payload];
      for (const part of parts) {
        if (part?.mimeType === "text/plain" && part?.body?.data) {
          bodyText += Buffer.from(part.body.data, "base64url").toString();
        }
      }

      const snippet = (bodyText || msgData.snippet || "").substring(0, 200);

      // Pattern extraction
      let extracted = extractFromText(bodyText + " " + subject);

      // PDF attachments → ProfitPilot AI (search recursively through all message parts)
      function findPdfParts(parts: any[]): any[] {
        const pdfs: any[] = [];
        for (const p of parts) {
          if (p.mimeType === "application/pdf") pdfs.push(p);
          if (p.parts) pdfs.push(...findPdfParts(p.parts));
        }
        return pdfs;
      }
      const attachmentParts = findPdfParts(msgData.payload?.parts || []);
      console.log(`  Email "${subject.substring(0, 50)}" has ${attachmentParts.length} PDF attachments`);
      for (const att of attachmentParts) {
        if (att.body?.attachmentId) {
          try {
            const attResponse = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/messages/${msg.id}/attachments/${att.body.attachmentId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (attResponse.ok) {
              const attData = await attResponse.json();
              const pdfBase64 = attData.data.replace(/-/g, "+").replace(/_/g, "/");
              console.log(`  Parsing PDF attachment with ProfitPilot AI (${Math.round(pdfBase64.length / 1024)}KB)...`);
              const pdfExtracted = await extractFromPdfWithAI(pdfBase64);
              console.log("  ProfitPilot AI result:", JSON.stringify(pdfExtracted));
              extracted = {
                invoiceNumber: pdfExtracted.invoiceNumber || extracted.invoiceNumber,
                supplierName: pdfExtracted.supplierName || extracted.supplierName,
                productCost: pdfExtracted.productCost || extracted.productCost,
                shippingCost: pdfExtracted.shippingCost || extracted.shippingCost,
                grandTotal: pdfExtracted.grandTotal || extracted.grandTotal,
                totalAmount: pdfExtracted.totalAmount || extracted.totalAmount,
                trackingNumber: pdfExtracted.trackingNumber || extracted.trackingNumber,
                orderReference: pdfExtracted.orderReference || extracted.orderReference,
                amountContext: pdfExtracted.amountContext || extracted.amountContext,
              };
            }
          } catch (e) {
            console.error("PDF extraction failed:", e);
          }
        }
      }

      // Match to order by: 1) PO/order number, 2) customer name, 3) customer email
      let matchedOrderId: string | null = null;
      let matchedOrderNumber: string | null = null;
      let matchMethod: string | null = null;
      const searchContent = (bodyText + " " + subject).toLowerCase();
      for (const order of userOrders) {
        const num = order.orderNumber.replace("#", "");
        const poNum = poPrefix ? `${poPrefix}${num}`.toLowerCase() : null;

        // 1) PO number (prefix+number) or just order number
        if (
          (poNum && searchContent.includes(poNum)) ||
          searchContent.includes(num.toLowerCase()) ||
          extracted.orderReference === num ||
          extracted.orderReference === order.orderNumber
        ) {
          matchedOrderId = order.id;
          matchedOrderNumber = order.orderNumber;
          matchMethod = poNum && searchContent.includes(poNum) ? `PO: ${poPrefix}${num}` : `Order #${num}`;
          break;
        }

        // 2) Customer name (must be 3+ chars to avoid false positives)
        if (order.customerName && order.customerName.length >= 3 && searchContent.includes(order.customerName.toLowerCase())) {
          matchedOrderId = order.id;
          matchedOrderNumber = order.orderNumber;
          matchMethod = `Customer: ${order.customerName}`;
          break;
        }

        // 3) Customer email
        if (order.customerEmail && searchContent.includes(order.customerEmail.toLowerCase())) {
          matchedOrderId = order.id;
          matchedOrderNumber = order.orderNumber;
          matchMethod = `Email: ${order.customerEmail}`;
          break;
        }
      }

      // ONLY ingest if we matched an actual order/PO number — skip everything else
      if (!matchedOrderId) {
        results.skipped++;
        continue;
      }

      await db.insert(emailLogs).values({
        userId: account.userId,
        connectedEmailId: account.id,
        emailSubject: subject,
        sender,
        receivedAt: dateStr ? new Date(dateStr) : new Date(),
        processedAt: new Date(),
        status: "matched",
        extractedData: {
          invoice: extracted.invoiceNumber,
          supplier: extracted.supplierName,
          productCost: extracted.productCost,
          shippingCost: extracted.shippingCost,
          grandTotal: extracted.grandTotal,
          amount: extracted.totalAmount,
          order: matchedOrderNumber || extracted.orderReference,
          tracking: extracted.trackingNumber,
          confidence: 90,
          matchMethod,
          amountContext: extracted.amountContext,
          emailLink,
          snippet,
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
        await db.update(orders).set({ actualShippingCost: String(extracted.totalAmount) }).where(eq(orders.id, matchedOrderId));
        results.matched++;
      } else {
        results.pending++;
      }
    } catch (e) {
      console.error("Error processing Gmail message:", e);
    }
  }

  await db.update(connectedEmails).set({ lastScannedAt: new Date() }).where(eq(connectedEmails.id, account.id));
  return results;
}

// ─── Outlook scanning (order-driven) ────────────────────────────────────────

async function scanOutlook(
  account: { id: string; accessToken: string; refreshToken: string | null; userId: string },
  userOrders: { id: string; orderNumber: string; customerName: string | null; customerEmail: string | null }[],
  poPrefix: string | null,
  ignoredSenders: string[]
): Promise<{ scanned: number; matched: number; pending: number; skipped: number }> {
  let accessToken = decrypt(account.accessToken);
  const results = { scanned: 0, matched: 0, pending: 0, skipped: 0 };

  // Build search terms — use just a few key terms for Outlook (has query length limits)
  const searchTerms = buildSearchTerms(userOrders.slice(0, 15), poPrefix);
  // Outlook $search: simple keywords joined by OR, no nested quotes
  const keyTerms = searchTerms.slice(0, 10);
  const fullSearch = keyTerms.join(" OR ");

  console.log("Outlook search (first 200 chars):", fullSearch.substring(0, 200));

  const outlookUrl = `https://graph.microsoft.com/v1.0/me/messages?$search=%22${encodeURIComponent(fullSearch)}%22&$top=200&$select=id,subject,from,receivedDateTime,body,hasAttachments,webLink`;

  let listResponse = await fetch(outlookUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listResponse.status === 401) {
    const newToken = await refreshOutlookToken(account);
    if (!newToken) return results;
    accessToken = newToken;
    listResponse = await fetch(outlookUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  if (!listResponse.ok) {
    const errBody = await listResponse.text();
    console.error("Outlook list failed:", listResponse.status, errBody);
    return results;
  }

  const listData = await listResponse.json();
  const messages = listData.value || [];
  console.log(`Found ${messages.length} emails in Outlook`);

  for (const msg of messages) {
    try {
      results.scanned++;

      const subject = msg.subject || "";
      const sender = msg.from?.emailAddress?.address || "";

      // Check ignore list
      if (ignoredSenders.some((ignored) => sender.toLowerCase().includes(ignored))) {
        results.skipped++;
        continue;
      }

      const bodyText = msg.body?.content || "";
      const receivedAt = msg.receivedDateTime ? new Date(msg.receivedDateTime) : new Date();
      const emailLink = msg.webLink || null;
      const snippet = bodyText.replace(/<[^>]*>/g, "").substring(0, 200);

      let extracted = extractFromText(bodyText + " " + subject);

      // PDF attachments
      if (msg.hasAttachments) {
        try {
          const attResponse = await fetch(
            `https://graph.microsoft.com/v1.0/me/messages/${msg.id}/attachments`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (attResponse.ok) {
            const attData = await attResponse.json();
            for (const att of (attData.value || []).filter((a: { contentType: string }) => a.contentType === "application/pdf")) {
              if (att.contentBytes) {
                try {
                  const pdfExtracted = await extractFromPdfWithAI(att.contentBytes);
                  extracted = {
                    invoiceNumber: pdfExtracted.invoiceNumber || extracted.invoiceNumber,
                    supplierName: pdfExtracted.supplierName || extracted.supplierName,
                    productCost: pdfExtracted.productCost || extracted.productCost,
                    shippingCost: pdfExtracted.shippingCost || extracted.shippingCost,
                    grandTotal: pdfExtracted.grandTotal || extracted.grandTotal,
                    totalAmount: pdfExtracted.totalAmount || extracted.totalAmount,
                    trackingNumber: pdfExtracted.trackingNumber || extracted.trackingNumber,
                    orderReference: pdfExtracted.orderReference || extracted.orderReference,
                    amountContext: pdfExtracted.amountContext || extracted.amountContext,
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

      // Match to order by: 1) PO/order number, 2) customer name, 3) customer email
      let matchedOrderId: string | null = null;
      let matchedOrderNumber: string | null = null;
      let matchMethod: string | null = null;
      const searchContent = (bodyText + " " + subject).toLowerCase();
      for (const order of userOrders) {
        const num = order.orderNumber.replace("#", "");
        const poNum = poPrefix ? `${poPrefix}${num}`.toLowerCase() : null;

        if (
          (poNum && searchContent.includes(poNum)) ||
          searchContent.includes(num.toLowerCase()) ||
          extracted.orderReference === num ||
          extracted.orderReference === order.orderNumber
        ) {
          matchedOrderId = order.id;
          matchedOrderNumber = order.orderNumber;
          matchMethod = poNum && searchContent.includes(poNum) ? `PO: ${poPrefix}${num}` : `Order #${num}`;
          break;
        }

        if (order.customerName && order.customerName.length >= 3 && searchContent.includes(order.customerName.toLowerCase())) {
          matchedOrderId = order.id;
          matchedOrderNumber = order.orderNumber;
          matchMethod = `Customer: ${order.customerName}`;
          break;
        }

        if (order.customerEmail && searchContent.includes(order.customerEmail.toLowerCase())) {
          matchedOrderId = order.id;
          matchedOrderNumber = order.orderNumber;
          matchMethod = `Email: ${order.customerEmail}`;
          break;
        }
      }

      // ONLY ingest if we matched an actual order/PO number
      if (!matchedOrderId) {
        results.skipped++;
        continue;
      }

      await db.insert(emailLogs).values({
        userId: account.userId,
        connectedEmailId: account.id,
        emailSubject: subject,
        sender,
        receivedAt,
        processedAt: new Date(),
        status: "matched",
        extractedData: {
          invoice: extracted.invoiceNumber,
          supplier: extracted.supplierName,
          productCost: extracted.productCost,
          shippingCost: extracted.shippingCost,
          grandTotal: extracted.grandTotal,
          amount: extracted.totalAmount,
          order: matchedOrderNumber || extracted.orderReference,
          tracking: extracted.trackingNumber,
          confidence: 90,
          matchMethod,
          amountContext: extracted.amountContext,
          emailLink,
          snippet,
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
        await db.update(orders).set({ actualShippingCost: String(extracted.totalAmount) }).where(eq(orders.id, matchedOrderId));
        results.matched++;
      } else {
        results.pending++;
      }
    } catch (e) {
      console.error("Error processing Outlook message:", e);
    }
  }

  await db.update(connectedEmails).set({ lastScannedAt: new Date() }).where(eq(connectedEmails.id, account.id));
  return results;
}

// ─── Main scan function ─────────────────────────────────────────────────────

export async function scanEmails(userId: string): Promise<ScanResults> {
  console.log("Starting email scan for user:", userId);

  const totals: ScanResults = { scanned: 0, matched: 0, pending: 0, skipped: 0, errors: 0 };

  // Get active email accounts
  const accounts = await db.select().from(connectedEmails)
    .where(and(eq(connectedEmails.userId, userId), eq(connectedEmails.active, true)));

  if (accounts.length === 0) {
    console.log("No active email accounts found");
    return totals;
  }

  // Get user's stores with PO prefix
  const userStores = await db.select().from(stores).where(eq(stores.userId, userId));
  const poPrefix = userStores[0]?.poPrefix || null;
  const ignoredSenders = (userStores[0]?.ignoredSenders || "")
    .split(",")
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean);
  console.log("PO prefix:", poPrefix || "(none set)");
  console.log("Ignored senders:", ignoredSenders.length > 0 ? ignoredSenders.join(", ") : "(none)");

  // Get user's orders for matching
  const storeIds = userStores.map((s) => s.id);
  const userOrders = storeIds.length > 0
    ? await db.select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        customerEmail: orders.customerEmail,
      }).from(orders)
        .where(inArray(orders.storeId, storeIds))
    : [];

  // Get already-approved order numbers — skip these during scan
  const approvedLogs = await db.select({ extractedData: emailLogs.extractedData })
    .from(emailLogs)
    .where(and(eq(emailLogs.userId, userId), eq(emailLogs.status, "approved")));
  const approvedOrderNumbers = new Set(
    approvedLogs
      .map((l) => (l.extractedData as Record<string, unknown> | null)?.order as string | null)
      .filter(Boolean)
  );
  console.log(`Already approved POs: ${approvedOrderNumbers.size} (${[...approvedOrderNumbers].slice(0, 5).join(", ")}${approvedOrderNumbers.size > 5 ? "..." : ""})`);

  // Filter out orders that already have approved invoices
  const pendingOrders = userOrders.filter((o) => !approvedOrderNumbers.has(o.orderNumber));
  console.log(`Scanning ${accounts.length} accounts against ${pendingOrders.length} orders (${userOrders.length - pendingOrders.length} already approved)`);

  if (pendingOrders.length === 0) {
    console.log("All orders have approved invoices — nothing to scan");
    return totals;
  }

  for (const account of accounts) {
    try {
      console.log(`Scanning ${account.provider}: ${account.emailAddress}`);
      let accountResults;

      if (account.provider === "gmail") {
        accountResults = await scanGmail(
          { id: account.id, accessToken: account.accessToken, refreshToken: account.refreshToken, userId: account.userId },
          pendingOrders, poPrefix, ignoredSenders
        );
      } else if (account.provider === "outlook") {
        accountResults = await scanOutlook(
          { id: account.id, accessToken: account.accessToken, refreshToken: account.refreshToken, userId: account.userId },
          pendingOrders, poPrefix, ignoredSenders
        );
      } else {
        continue;
      }

      totals.scanned += accountResults.scanned;
      totals.matched += accountResults.matched;
      totals.pending += accountResults.pending;
      totals.skipped += accountResults.skipped;

      console.log(`${account.emailAddress}: scanned=${accountResults.scanned} matched=${accountResults.matched} pending=${accountResults.pending} skipped=${accountResults.skipped}`);
    } catch (e) {
      console.error(`Error scanning ${account.emailAddress}:`, e);
      totals.errors++;
    }
  }

  console.log("Scan complete:", totals);
  return totals;
}
