import {
  pgTable,
  uuid,
  text,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const storeStatusEnum = pgEnum("store_status", [
  "active",
  "disconnected",
]);

export const syncTypeEnum = pgEnum("sync_type", [
  "orders",
  "products",
  "ads",
  "agent",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "running",
  "completed",
  "failed",
]);

export const shippingSourceEnum = pgEnum("shipping_source", [
  "email",
  "manual",
  "fedex",
  "csv",
]);

export const emailLogStatusEnum = pgEnum("email_log_status", [
  "pending",
  "matched",
  "skipped",
  "error",
]);

export const customCostTypeEnum = pgEnum("custom_cost_type", [
  "per_order",
  "percent_revenue",
  "fixed_monthly",
]);

export const adPlatformEnum = pgEnum("ad_platform", [
  "google",
  "meta",
  "tiktok",
  "bing",
  "snapchat",
  "amazon",
]);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Auth.js required tables
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// ─── Stores ──────────────────────────────────────────────────────────────────

export const stores = pgTable("stores", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shopifyDomain: text("shopify_domain").notNull(),
  shopifyAccessToken: text("shopify_access_token").notNull(), // encrypted
  name: text("name").notNull(),
  status: storeStatusEnum("status").default("active").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Orders ──────────────────────────────────────────────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    shopifyOrderId: text("shopify_order_id").notNull(),
    orderNumber: text("order_number").notNull(),
    orderDate: timestamp("order_date").notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    totalTax: decimal("total_tax", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    shippingCharged: decimal("shipping_charged", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    actualShippingCost: decimal("actual_shipping_cost", {
      precision: 12,
      scale: 2,
    }),
    transactionFee: decimal("transaction_fee", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    totalCogs: decimal("total_cogs", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    customCostsTotal: decimal("custom_costs_total", {
      precision: 12,
      scale: 2,
    })
      .default("0")
      .notNull(),
    netProfit: decimal("net_profit", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    customerEmail: text("customer_email"),
    customerName: text("customer_name"),
    financialStatus: text("financial_status"),
    fulfillmentStatus: text("fulfillment_status"),
    // Tax breakdown for tax portal
    taxLines: jsonb("tax_lines"), // [{title, rate, price, province}]
    shippingProvince: text("shipping_province"),
    shippingCountry: text("shipping_country"),
    rawData: jsonb("raw_data"),
    syncedAt: timestamp("synced_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("orders_store_shopify_idx").on(t.storeId, t.shopifyOrderId),
    index("orders_store_date_idx").on(t.storeId, t.orderDate),
  ]
);

// ─── Order Line Items ────────────────────────────────────────────────────────

export const orderLineItems = pgTable("order_line_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  shopifyLineItemId: text("shopify_line_item_id").notNull(),
  productId: text("product_id"),
  variantId: text("variant_id"),
  title: text("title").notNull(),
  sku: text("sku"),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  lineCogs: decimal("line_cogs", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  price: decimal("price", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
});

// ─── Shipping Cost Updates ───────────────────────────────────────────────────

export const shippingCostUpdates = pgTable("shipping_cost_updates", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  source: shippingSourceEnum("source").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  invoiceNumber: text("invoice_number"),
  supplierName: text("supplier_name"),
  emailLogId: uuid("email_log_id").references(() => emailLogs.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Ad Spend ────────────────────────────────────────────────────────────────

export const adSpendDaily = pgTable(
  "ad_spend_daily",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    platform: adPlatformEnum("platform").notNull(),
    campaignId: text("campaign_id"),
    campaignName: text("campaign_name"),
    date: timestamp("date").notNull(),
    spend: decimal("spend", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),
    conversions: integer("conversions").default(0),
    revenueAttributed: decimal("revenue_attributed", {
      precision: 12,
      scale: 2,
    }),
  },
  (t) => [
    index("ad_spend_store_date_idx").on(t.storeId, t.date),
    index("ad_spend_platform_idx").on(t.storeId, t.platform),
  ]
);

// ─── Ad Platform Connections ─────────────────────────────────────────────────

export const adPlatformConnections = pgTable("ad_platform_connections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  platform: adPlatformEnum("platform").notNull(),
  accessToken: text("access_token").notNull(), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  accountId: text("account_id"),
  accountName: text("account_name"),
  lastSyncAt: timestamp("last_sync_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Custom Cost Rules ───────────────────────────────────────────────────────

export const customCostRules = pgTable("custom_cost_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id")
    .notNull()
    .references(() => stores.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: customCostTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  appliesTo: text("applies_to").default("all").notNull(), // "all" or specific SKU
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Connected Email Accounts ────────────────────────────────────────────────

export const emailProviderEnum = pgEnum("email_provider", [
  "gmail",
  "outlook",
  "imap",
]);

export const connectedEmails = pgTable(
  "connected_emails",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: emailProviderEnum("provider").notNull(),
    emailAddress: text("email_address").notNull(),
    label: text("label"), // user-friendly name like "FedEx Invoices" or "Store A Shipping"
    accessToken: text("access_token").notNull(), // encrypted
    refreshToken: text("refresh_token"), // encrypted
    expiresAt: timestamp("expires_at"),
    // Optional: link to specific store(s) — null means scan for all stores
    storeId: uuid("store_id").references(() => stores.id, { onDelete: "set null" }),
    active: boolean("active").default(true).notNull(),
    lastScannedAt: timestamp("last_scanned_at"),
    scanKeywords: text("scan_keywords"), // comma-separated custom keywords like "FedEx,UPS,DHL"
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("connected_emails_user_idx").on(t.userId),
  ]
);

// ─── Email Logs ──────────────────────────────────────────────────────────────

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  connectedEmailId: uuid("connected_email_id")
    .references(() => connectedEmails.id, { onDelete: "set null" }),
  emailSubject: text("email_subject"),
  sender: text("sender"),
  receivedAt: timestamp("received_at"),
  processedAt: timestamp("processed_at"),
  status: emailLogStatusEnum("status").default("pending").notNull(),
  extractedData: jsonb("extracted_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Customers ───────────────────────────────────────────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    shopifyCustomerId: text("shopify_customer_id"),
    email: text("email"),
    name: text("name"),
    firstOrderDate: timestamp("first_order_date"),
    lastOrderDate: timestamp("last_order_date"),
    totalOrders: integer("total_orders").default(0).notNull(),
    totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    totalCogs: decimal("total_cogs", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    ltvNetProfit: decimal("ltv_net_profit", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
  },
  (t) => [
    index("customers_store_idx").on(t.storeId),
    index("customers_email_idx").on(t.storeId, t.email),
  ]
);

// ─── Tax Records (for tax portal) ───────────────────────────────────────────

export const taxRecords = pgTable(
  "tax_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id),
    state: text("state").notNull(), // US state code
    jurisdiction: text("jurisdiction"), // city/county
    taxableAmount: decimal("taxable_amount", { precision: 12, scale: 2 })
      .notNull(),
    taxCollected: decimal("tax_collected", { precision: 12, scale: 2 })
      .notNull(),
    taxRate: decimal("tax_rate", { precision: 8, scale: 6 }),
    orderDate: timestamp("order_date").notNull(),
    period: text("period").notNull(), // "2026-03" format for monthly grouping
  },
  (t) => [
    index("tax_records_state_idx").on(t.storeId, t.state, t.period),
  ]
);

export const nexusTracking = pgTable("nexus_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  state: text("state").notNull(),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 })
    .default("0")
    .notNull(),
  totalTransactions: integer("total_transactions").default(0).notNull(),
  revenueThreshold: decimal("revenue_threshold", { precision: 12, scale: 2 })
    .default("100000")
    .notNull(),
  transactionThreshold: integer("transaction_threshold").default(200).notNull(),
  hasNexus: boolean("has_nexus").default(false).notNull(),
  registeredForTax: boolean("registered_for_tax").default(false).notNull(),
  taxjarEnabled: boolean("taxjar_enabled").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Sync Logs ───────────────────────────────────────────────────────────────

export const syncLogs = pgTable("sync_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeId: uuid("store_id").references(() => stores.id, {
    onDelete: "cascade",
  }),
  type: syncTypeEnum("type").notNull(),
  status: syncStatusEnum("status").default("running").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  ordersSynced: integer("orders_synced").default(0),
  errors: jsonb("errors"),
});

// ─── Cost Alerts ─────────────────────────────────────────────────────────────

export const costAlertSeverityEnum = pgEnum("cost_alert_severity", [
  "low",
  "medium",
  "high",
]);

export const costAlertStatusEnum = pgEnum("cost_alert_status", [
  "active",
  "resolved",
  "dismissed",
]);

export const costAlerts = pgTable(
  "cost_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").references(() => orders.id),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "shipping_discrepancy" | "cogs_discrepancy"
    severity: costAlertSeverityEnum("severity").default("medium").notNull(),
    status: costAlertStatusEnum("status").default("active").notNull(),
    expectedCost: decimal("expected_cost", { precision: 12, scale: 2 }).notNull(),
    actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).notNull(),
    difference: decimal("difference", { precision: 12, scale: 2 }).notNull(),
    percentOver: decimal("percent_over", { precision: 8, scale: 2 }).notNull(),
    message: text("message").notNull(),
    notifiedEmail: boolean("notified_email").default(false).notNull(),
    notifiedSms: boolean("notified_sms").default(false).notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("cost_alerts_store_status_idx").on(t.storeId, t.status),
  ]
);

// ─── Alert Settings ──────────────────────────────────────────────────────────

export const alertSettings = pgTable("alert_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  shippingPercentThreshold: decimal("shipping_percent_threshold", {
    precision: 5,
    scale: 2,
  })
    .default("20")
    .notNull(),
  shippingDollarThreshold: decimal("shipping_dollar_threshold", {
    precision: 12,
    scale: 2,
  })
    .default("10")
    .notNull(),
  cogsPercentThreshold: decimal("cogs_percent_threshold", {
    precision: 5,
    scale: 2,
  })
    .default("15")
    .notNull(),
  cogsDollarThreshold: decimal("cogs_dollar_threshold", {
    precision: 12,
    scale: 2,
  })
    .default("25")
    .notNull(),
  enableInApp: boolean("enable_in_app").default(true).notNull(),
  enableEmail: boolean("enable_email").default(false).notNull(),
  enableSms: boolean("enable_sms").default(false).notNull(),
  alertEmail: text("alert_email"),
  alertPhone: text("alert_phone"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── FedEx Lookups ───────────────────────────────────────────────────────────

export const fedexLookups = pgTable("fedex_lookups", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => orders.id),
  trackingNumber: text("tracking_number").notNull(),
  status: text("status"),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }),
  actualBilled: decimal("actual_billed", { precision: 12, scale: 2 }),
  source: text("source"), // "api" | "csv" | "email"
  lookedUpAt: timestamp("looked_up_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  stores: many(stores),
  connectedEmails: many(connectedEmails),
  emailLogs: many(emailLogs),
  adPlatformConnections: many(adPlatformConnections),
}));

export const connectedEmailsRelations = relations(
  connectedEmails,
  ({ one, many }) => ({
    user: one(users, {
      fields: [connectedEmails.userId],
      references: [users.id],
    }),
    store: one(stores, {
      fields: [connectedEmails.storeId],
      references: [stores.id],
    }),
    emailLogs: many(emailLogs),
  })
);

export const storesRelations = relations(stores, ({ one, many }) => ({
  user: one(users, { fields: [stores.userId], references: [users.id] }),
  orders: many(orders),
  adSpend: many(adSpendDaily),
  customCostRules: many(customCostRules),
  customers: many(customers),
  taxRecords: many(taxRecords),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  store: one(stores, { fields: [orders.storeId], references: [stores.id] }),
  lineItems: many(orderLineItems),
  shippingUpdates: many(shippingCostUpdates),
}));

export const orderLineItemsRelations = relations(
  orderLineItems,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderLineItems.orderId],
      references: [orders.id],
    }),
  })
);
