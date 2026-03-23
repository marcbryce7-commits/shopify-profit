/**
 * Server-side data queries used by dashboard pages and API routes.
 * All functions require a userId and optionally a storeId filter.
 */

import { db } from "@/lib/db";
import {
  stores,
  orders,
  orderLineItems,
  customers,
  adSpendDaily,
  adPlatformConnections,
  costAlerts,
  alertSettings,
  customCostRules,
  syncLogs,
  taxRecords,
  nexusTracking,
  connectedEmails,
  emailLogs,
  shippingCostUpdates,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte, count, asc, inArray } from "drizzle-orm";

// ─── Stores ─────────────────────────────────────────────────────────────────

export async function getUserStores(userId: string) {
  return db
    .select()
    .from(stores)
    .where(eq(stores.userId, userId))
    .orderBy(desc(stores.createdAt));
}

// ─── Dashboard Overview Metrics ─────────────────────────────────────────────

export async function getDashboardMetrics(
  userId: string,
  storeId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId
    ? [storeId]
    : userStores.map((s) => s.id);

  if (storeIds.length === 0) {
    return {
      totalRevenue: 0,
      totalCogs: 0,
      totalShipping: 0,
      totalFees: 0,
      totalAdSpend: 0,
      totalCustomCosts: 0,
      netProfit: 0,
      orderCount: 0,
      activeAlerts: 0,
    };
  }

  const dateFilter = [];
  if (startDate) dateFilter.push(gte(orders.orderDate, startDate));
  if (endDate) dateFilter.push(lte(orders.orderDate, endDate));

  const [metrics] = await db
    .select({
      totalRevenue: sql<string>`COALESCE(SUM(${orders.subtotal}), 0)`,
      totalCogs: sql<string>`COALESCE(SUM(${orders.totalCogs}), 0)`,
      totalShipping: sql<string>`COALESCE(SUM(COALESCE(${orders.actualShippingCost}, ${orders.shippingCharged})), 0)`,
      totalFees: sql<string>`COALESCE(SUM(${orders.transactionFee}), 0)`,
      totalCustomCosts: sql<string>`COALESCE(SUM(${orders.customCostsTotal}), 0)`,
      netProfit: sql<string>`COALESCE(SUM(${orders.netProfit}), 0)`,
      orderCount: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(
        inArray(orders.storeId, storeIds),
        ...dateFilter
      )
    );

  // Ad spend
  const [adMetrics] = await db
    .select({
      totalAdSpend: sql<string>`COALESCE(SUM(${adSpendDaily.spend}), 0)`,
    })
    .from(adSpendDaily)
    .where(
      and(
        inArray(adSpendDaily.storeId, storeIds),
        ...(startDate ? [gte(adSpendDaily.date, startDate)] : []),
        ...(endDate ? [lte(adSpendDaily.date, endDate)] : [])
      )
    );

  // Active alerts
  const [alertCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(costAlerts)
    .where(
      and(
        inArray(costAlerts.storeId, storeIds),
        eq(costAlerts.status, "active")
      )
    );

  return {
    totalRevenue: parseFloat(metrics.totalRevenue),
    totalCogs: parseFloat(metrics.totalCogs),
    totalShipping: parseFloat(metrics.totalShipping),
    totalFees: parseFloat(metrics.totalFees),
    totalAdSpend: parseFloat(adMetrics.totalAdSpend),
    totalCustomCosts: parseFloat(metrics.totalCustomCosts),
    netProfit: parseFloat(metrics.netProfit),
    orderCount: metrics.orderCount,
    activeAlerts: alertCount.count,
  };
}

// ─── Revenue/Profit Trend (monthly) ─────────────────────────────────────────

export async function getProfitTrend(
  userId: string,
  storeId?: string,
  months: number = 12
) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);
  if (storeIds.length === 0) return [];

  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      month: sql<string>`TO_CHAR(${orders.orderDate}, 'YYYY-MM')`,
      revenue: sql<string>`COALESCE(SUM(${orders.subtotal}), 0)`,
      profit: sql<string>`COALESCE(SUM(${orders.netProfit}), 0)`,
      orderCount: sql<number>`COUNT(*)::int`,
    })
    .from(orders)
    .where(
      and(inArray(orders.storeId, storeIds), gte(orders.orderDate, since))
    )
    .groupBy(sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${orders.orderDate}, 'YYYY-MM')`);
}

// ─── Store Breakdown ────────────────────────────────────────────────────────

export async function getStoreBreakdown(userId: string) {
  return db
    .select({
      storeId: stores.id,
      storeName: stores.name,
      revenue: sql<string>`COALESCE(SUM(${orders.subtotal}), 0)`,
      profit: sql<string>`COALESCE(SUM(${orders.netProfit}), 0)`,
      orderCount: sql<number>`COUNT(${orders.id})::int`,
    })
    .from(stores)
    .leftJoin(orders, eq(orders.storeId, stores.id))
    .where(eq(stores.userId, userId))
    .groupBy(stores.id, stores.name);
}

// ─── Orders (paginated) ─────────────────────────────────────────────────────

export async function getOrders(
  userId: string,
  opts: {
    storeId?: string;
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const { storeId, search, status, page = 1, limit = 25 } = opts;
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);
  if (storeIds.length === 0) return { orders: [], total: 0 };

  const conditions = [inArray(orders.storeId, storeIds)];
  if (search) {
    conditions.push(
      sql`(${orders.orderNumber} ILIKE ${"%" + search + "%"} OR ${orders.customerName} ILIKE ${"%" + search + "%"} OR ${orders.customerEmail} ILIKE ${"%" + search + "%"})`
    );
  }
  if (status) {
    conditions.push(eq(orders.financialStatus, status));
  }

  const [totalResult] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(orders)
    .where(and(...conditions));

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.orderDate))
    .limit(limit)
    .offset((page - 1) * limit);

  return { orders: rows, total: totalResult.count };
}

// ─── Products Analytics ─────────────────────────────────────────────────────

export async function getProductAnalytics(userId: string, storeId?: string) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);
  if (storeIds.length === 0) return [];

  return db
    .select({
      title: orderLineItems.title,
      sku: orderLineItems.sku,
      unitsSold: sql<number>`SUM(${orderLineItems.quantity})::int`,
      revenue: sql<string>`SUM(${orderLineItems.price} * ${orderLineItems.quantity})`,
      cogs: sql<string>`SUM(${orderLineItems.lineCogs})`,
      profit: sql<string>`SUM(${orderLineItems.price} * ${orderLineItems.quantity} - ${orderLineItems.lineCogs})`,
    })
    .from(orderLineItems)
    .innerJoin(orders, eq(orders.id, orderLineItems.orderId))
    .where(inArray(orders.storeId, storeIds))
    .groupBy(orderLineItems.title, orderLineItems.sku)
    .orderBy(desc(sql`SUM(${orderLineItems.price} * ${orderLineItems.quantity} - ${orderLineItems.lineCogs})`));
}

// ─── Customer LTV ───────────────────────────────────────────────────────────

export async function getCustomerAnalytics(userId: string, storeId?: string) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);
  if (storeIds.length === 0)
    return {
      customers: [],
      totalCustomers: 0,
      averageLtv: 0,
      repeatRate: 0,
      avgOrdersPerCustomer: 0,
    };

  const rows = await db
    .select()
    .from(customers)
    .where(inArray(customers.storeId, storeIds))
    .orderBy(desc(customers.ltvNetProfit));

  const totalCustomers = rows.length;
  const avgLtv =
    totalCustomers > 0
      ? rows.reduce((sum, c) => sum + parseFloat(c.ltvNetProfit), 0) /
        totalCustomers
      : 0;
  const repeatCustomers = rows.filter((c) => c.totalOrders > 1).length;
  const repeatRate = totalCustomers > 0 ? (repeatCustomers / totalCustomers) * 100 : 0;
  const avgOrders =
    totalCustomers > 0
      ? rows.reduce((sum, c) => sum + c.totalOrders, 0) / totalCustomers
      : 0;

  return {
    customers: rows,
    totalCustomers,
    averageLtv: avgLtv,
    repeatRate,
    avgOrdersPerCustomer: avgOrders,
  };
}

// ─── P&L ────────────────────────────────────────────────────────────────────

export async function getPnlReport(
  userId: string,
  storeId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const metrics = await getDashboardMetrics(userId, storeId, startDate, endDate);
  const grossProfit = metrics.totalRevenue - metrics.totalCogs;

  return {
    grossRevenue: metrics.totalRevenue,
    refunds: 0, // TODO: track refunds from Shopify
    netRevenue: metrics.totalRevenue,
    cogs: metrics.totalCogs,
    grossProfit,
    shipping: metrics.totalShipping,
    transactionFees: metrics.totalFees,
    adSpend: metrics.totalAdSpend,
    customCosts: metrics.totalCustomCosts,
    totalOperatingExpenses:
      metrics.totalShipping +
      metrics.totalFees +
      metrics.totalAdSpend +
      metrics.totalCustomCosts,
    netProfit: metrics.netProfit,
    profitMargin:
      metrics.totalRevenue > 0
        ? (metrics.netProfit / metrics.totalRevenue) * 100
        : 0,
    orderCount: metrics.orderCount,
  };
}

// ─── Ads ────────────────────────────────────────────────────────────────────

export async function getAdAnalytics(userId: string, storeId?: string) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);

  // Platform breakdown
  const platformBreakdown =
    storeIds.length > 0
      ? await db
          .select({
            platform: adSpendDaily.platform,
            totalSpend: sql<string>`COALESCE(SUM(${adSpendDaily.spend}), 0)`,
            totalClicks: sql<number>`COALESCE(SUM(${adSpendDaily.clicks}), 0)::int`,
            totalImpressions: sql<number>`COALESCE(SUM(${adSpendDaily.impressions}), 0)::int`,
            totalConversions: sql<number>`COALESCE(SUM(${adSpendDaily.conversions}), 0)::int`,
            totalRevenue: sql<string>`COALESCE(SUM(${adSpendDaily.revenueAttributed}), 0)`,
          })
          .from(adSpendDaily)
          .where(inArray(adSpendDaily.storeId, storeIds))
          .groupBy(adSpendDaily.platform)
      : [];

  // Campaign details
  const campaigns =
    storeIds.length > 0
      ? await db
          .select({
            platform: adSpendDaily.platform,
            campaignId: adSpendDaily.campaignId,
            campaignName: adSpendDaily.campaignName,
            totalSpend: sql<string>`COALESCE(SUM(${adSpendDaily.spend}), 0)`,
            totalClicks: sql<number>`COALESCE(SUM(${adSpendDaily.clicks}), 0)::int`,
            totalImpressions: sql<number>`COALESCE(SUM(${adSpendDaily.impressions}), 0)::int`,
            totalConversions: sql<number>`COALESCE(SUM(${adSpendDaily.conversions}), 0)::int`,
          })
          .from(adSpendDaily)
          .where(inArray(adSpendDaily.storeId, storeIds))
          .groupBy(
            adSpendDaily.platform,
            adSpendDaily.campaignId,
            adSpendDaily.campaignName
          )
          .orderBy(desc(sql`SUM(${adSpendDaily.spend})`))
          .limit(50)
      : [];

  // Connected platforms
  const connections = await db
    .select({
      platform: adPlatformConnections.platform,
      accountName: adPlatformConnections.accountName,
      lastSyncAt: adPlatformConnections.lastSyncAt,
    })
    .from(adPlatformConnections)
    .where(eq(adPlatformConnections.userId, userId));

  const totalSpend = platformBreakdown.reduce(
    (sum, p) => sum + parseFloat(p.totalSpend),
    0
  );
  const totalClicks = platformBreakdown.reduce(
    (sum, p) => sum + p.totalClicks,
    0
  );
  const totalImpressions = platformBreakdown.reduce(
    (sum, p) => sum + p.totalImpressions,
    0
  );
  const totalRevenue = platformBreakdown.reduce(
    (sum, p) => sum + parseFloat(p.totalRevenue),
    0
  );

  return {
    totalSpend,
    totalClicks,
    totalImpressions,
    blendedRoas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
    platformBreakdown,
    campaigns,
    connections,
  };
}

// ─── Shipping / Email Agent ─────────────────────────────────────────────────

export async function getShippingAgentData(userId: string) {
  const pendingReview = await db
    .select()
    .from(emailLogs)
    .where(
      and(eq(emailLogs.userId, userId), eq(emailLogs.status, "pending"))
    )
    .orderBy(desc(emailLogs.createdAt))
    .limit(50);

  const recentHistory = await db
    .select()
    .from(emailLogs)
    .where(
      and(
        eq(emailLogs.userId, userId),
        sql`${emailLogs.status} != 'pending'`
      )
    )
    .orderBy(desc(emailLogs.processedAt))
    .limit(50);

  const connectedAccounts = await db
    .select()
    .from(connectedEmails)
    .where(eq(connectedEmails.userId, userId));

  return { pendingReview, recentHistory, connectedAccounts };
}

// ─── Tax ────────────────────────────────────────────────────────────────────

export async function getTaxData(userId: string, storeId?: string) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);

  const nexus = await db
    .select()
    .from(nexusTracking)
    .where(eq(nexusTracking.userId, userId))
    .orderBy(desc(nexusTracking.totalRevenue));

  const taxByState =
    storeIds.length > 0
      ? await db
          .select({
            state: taxRecords.state,
            totalTaxable: sql<string>`COALESCE(SUM(${taxRecords.taxableAmount}), 0)`,
            totalCollected: sql<string>`COALESCE(SUM(${taxRecords.taxCollected}), 0)`,
          })
          .from(taxRecords)
          .where(inArray(taxRecords.storeId, storeIds))
          .groupBy(taxRecords.state)
          .orderBy(desc(sql`SUM(${taxRecords.taxCollected})`))
      : [];

  const totalTaxCollected = taxByState.reduce(
    (sum, r) => sum + parseFloat(r.totalCollected),
    0
  );
  const statesWithNexus = nexus.filter((n) => n.hasNexus).length;

  return {
    totalTaxCollected,
    statesWithNexus,
    nexus,
    taxByState,
  };
}

// ─── Alerts ─────────────────────────────────────────────────────────────────

export async function getAlerts(userId: string, storeId?: string) {
  const userStores = await getUserStores(userId);
  const storeIds = storeId ? [storeId] : userStores.map((s) => s.id);
  if (storeIds.length === 0) return { alerts: [], settings: null };

  const alerts = await db
    .select()
    .from(costAlerts)
    .where(inArray(costAlerts.storeId, storeIds))
    .orderBy(desc(costAlerts.createdAt))
    .limit(100);

  const [settings] = await db
    .select()
    .from(alertSettings)
    .where(eq(alertSettings.userId, userId))
    .limit(1);

  return { alerts, settings };
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getUserSettings(userId: string) {
  const [settings] = await db
    .select()
    .from(alertSettings)
    .where(eq(alertSettings.userId, userId))
    .limit(1);

  const costRules = await db
    .select()
    .from(customCostRules)
    .innerJoin(stores, eq(stores.id, customCostRules.storeId))
    .where(eq(stores.userId, userId));

  const emailAccounts = await db
    .select({
      id: connectedEmails.id,
      provider: connectedEmails.provider,
      emailAddress: connectedEmails.emailAddress,
      label: connectedEmails.label,
      active: connectedEmails.active,
      lastScannedAt: connectedEmails.lastScannedAt,
    })
    .from(connectedEmails)
    .where(eq(connectedEmails.userId, userId));

  return { alertSettings: settings, costRules, emailAccounts };
}

// ─── Recent Orders (for dashboard) ──────────────────────────────────────────

export async function getRecentOrders(userId: string, limit: number = 10) {
  const userStores = await getUserStores(userId);
  const storeIds = userStores.map((s) => s.id);
  if (storeIds.length === 0) return [];

  return db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      orderDate: orders.orderDate,
      customerName: orders.customerName,
      subtotal: orders.subtotal,
      netProfit: orders.netProfit,
      financialStatus: orders.financialStatus,
      fulfillmentStatus: orders.fulfillmentStatus,
    })
    .from(orders)
    .where(inArray(orders.storeId, storeIds))
    .orderBy(desc(orders.orderDate))
    .limit(limit);
}

// ─── Sync Logs ──────────────────────────────────────────────────────────────

export async function getRecentSyncs(userId: string) {
  const userStores = await getUserStores(userId);
  const storeIds = userStores.map((s) => s.id);
  if (storeIds.length === 0) return [];

  return db
    .select()
    .from(syncLogs)
    .where(inArray(syncLogs.storeId, storeIds))
    .orderBy(desc(syncLogs.startedAt))
    .limit(20);
}
