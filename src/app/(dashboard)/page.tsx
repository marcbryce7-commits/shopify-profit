"use client";

import {
  DollarSign,
  Package,
  Truck,
  CreditCard,
  Megaphone,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApi } from "@/hooks/use-api";

// ---------- Types ----------

interface DashboardMetrics {
  totalRevenue: number;
  totalCogs: number;
  totalShipping: number;
  totalFees: number;
  totalAdSpend: number;
  totalCustomCosts: number;
  netProfit: number;
  orderCount: number;
  activeAlerts: number;
}

interface TrendPoint {
  month: string;
  revenue: number;
  profit: number;
  orderCount: number;
}

interface StoreBreakdownEntry {
  storeId: string;
  storeName: string;
  revenue: number;
  profit: number;
  orderCount: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  subtotal: number;
  netProfit: number;
  financialStatus: string;
  fulfillmentStatus: string;
}

interface DashboardData {
  metrics: DashboardMetrics;
  trend: TrendPoint[];
  breakdown: StoreBreakdownEntry[];
  recentOrders: RecentOrder[];
}

// ---------- Helpers ----------

const STORE_COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function fmtCompact(n: number) {
  return fmt.format(n);
}

function statusColor(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "authorized") return "text-tertiary-dim";
  if (s === "pending" || s === "partially_paid") return "text-[#f59e0b]";
  if (s === "refunded" || s === "voided") return "text-error";
  return "text-on-surface-variant";
}

// ---------- Sub-components ----------

function MetricCardSkeleton() {
  return (
    <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
      <Skeleton className="h-3 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <Skeleton className="h-full w-full rounded-lg" style={{ height, minWidth: 200 }} />
    </div>
  );
}

// ---------- Page ----------

export default function OverviewPage() {
  const { data, loading, error, refetch } = useApi<DashboardData>("/api/dashboard");

  const metrics = data?.metrics;
  const trend = data?.trend ?? [];
  const breakdown = data?.breakdown ?? [];
  const recentOrders = data?.recentOrders ?? [];

  // Derive chart data from trend
  const trendChartData = trend.map((t) => ({
    date: t.month,
    revenue: t.revenue,
    profit: t.profit,
  }));

  // Derive pie data from breakdown
  const storeChartData = breakdown.map((b, i) => ({
    name: b.storeName,
    value: b.revenue,
    color: STORE_COLORS[i % STORE_COLORS.length],
  }));

  const totalStoreRevenue = breakdown.reduce((sum, b) => sum + b.revenue, 0);

  // Margin calculation
  const margin =
    metrics && metrics.totalRevenue > 0
      ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(2)
      : "0.00";

  // COGS percentage
  const cogsPercent =
    metrics && metrics.totalRevenue > 0
      ? ((metrics.totalCogs / metrics.totalRevenue) * 100).toFixed(0)
      : "0";

  // ROAS calculation
  const roas =
    metrics && metrics.totalAdSpend > 0
      ? (metrics.totalRevenue / metrics.totalAdSpend).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Dashboard</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time profit tracking across all stores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-error">Failed to load data</span>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[#c6c6c7] to-[#454747] text-on-primary hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sync Data
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-outline-variant/20 text-on-surface-variant hover:bg-surface-container transition-colors">
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Metric Row 1 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : metrics ? (
          <>
            {/* Revenue */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Revenue
                </span>
                <DollarSign className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="text-2xl font-bold text-on-surface">
                {fmtCompact(metrics.totalRevenue)}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-tertiary-dim/15 text-tertiary-dim">
                  +12.4%
                </span>
                <span className="text-xs text-on-surface-variant">
                  from {metrics.orderCount.toLocaleString()} orders
                </span>
              </div>
            </div>

            {/* COGS */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  COGS
                </span>
                <Package className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="text-2xl font-bold text-on-surface">
                {fmtCompact(metrics.totalCogs)}
              </div>
              <div className="mt-1">
                <span className="text-xs text-on-surface-variant">
                  Target {cogsPercent}%
                </span>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Shipping
                </span>
                <Truck className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="text-2xl font-bold text-on-surface">
                {fmtCompact(metrics.totalShipping)}
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-error/15 text-error">
                  +4.2%
                </span>
              </div>
            </div>

            {/* Platform Fees */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Platform Fees
                </span>
                <CreditCard className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="text-2xl font-bold text-on-surface">
                {fmtCompact(metrics.totalFees)}
              </div>
              <div className="mt-1">
                <span className="text-xs text-on-surface-variant">
                  payment processing
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="col-span-full text-center text-sm text-on-surface-variant py-8">
            No metric data available.
          </div>
        )}
      </div>

      {/* Metric Row 2 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : metrics ? (
          <>
            {/* Ad Spend */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Ad Spend
                </span>
                <Megaphone className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="text-2xl font-bold text-on-surface">
                {fmtCompact(metrics.totalAdSpend)}
              </div>
              <div className="mt-1">
                <span className="text-xs text-on-surface-variant">
                  ROAS {roas}x
                </span>
              </div>
            </div>

            {/* Custom Costs */}
            <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Custom Costs
                </span>
                <ShoppingCart className="h-4 w-4 text-on-surface-variant" />
              </div>
              <div className="text-2xl font-bold text-on-surface">
                {fmtCompact(metrics.totalCustomCosts)}
              </div>
              <div className="mt-1">
                <span className="text-xs text-on-surface-variant">
                  user-defined cost rules
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-[#82ff99]/10 p-6 rounded-xl border border-[#73f08c]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Net Profit
                </span>
                <TrendingUp className="h-4 w-4 text-[#73f08c]" />
              </div>
              <div className="text-3xl font-extrabold text-[#73f08c]">
                {fmtCompact(metrics.netProfit)}
              </div>
              <div className="mt-1">
                <span className="text-xs text-tertiary-dim">
                  {margin}% Net Margin
                </span>
              </div>
            </div>

            {/* Cost Alerts */}
            <div className="bg-[#7f2927]/10 p-6 rounded-xl border border-[#bb5551]/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  Cost Alerts
                </span>
                <AlertTriangle className="h-4 w-4 text-[#ee7d77]" />
              </div>
              <div className="text-2xl font-bold text-[#ee7d77]">
                {metrics.activeAlerts} Critical
              </div>
              <div className="mt-1">
                <span className="text-xs text-on-surface-variant">
                  {metrics.activeAlerts} discrepancies found
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue vs Profit Trend - 2/3 width */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-xl border border-outline-variant/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-on-surface">
                Revenue vs Profit Trend
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {trend.length > 0 ? `Last ${trend.length} periods` : "No trend data"}
              </p>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : trendChartData.length === 0 ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-on-surface-variant">
              No trend data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#47474e" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#acaab1", fontSize: 12 }}
                  axisLine={{ stroke: "#47474e" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#acaab1", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#19191d",
                    border: "1px solid #47474e",
                    borderRadius: "8px",
                    color: "#e7e4ec",
                  }}
                />
                <Legend
                  wrapperStyle={{ color: "#acaab1", fontSize: 12 }}
                />
                <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#73f08c" name="Profit" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Store - 1/3 width */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-6">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-on-surface">
              Revenue by Store
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {totalStoreRevenue > 0
                ? `Total: ${fmtCompact(totalStoreRevenue)}`
                : "No store data"}
            </p>
          </div>
          {loading ? (
            <ChartSkeleton height={200} />
          ) : storeChartData.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-sm text-on-surface-variant">
              No store breakdown data available yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={storeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {storeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#19191d",
                      border: "1px solid #47474e",
                      borderRadius: "8px",
                      color: "#e7e4ec",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {storeChartData.map((store) => (
                  <div key={store.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: store.color }}
                      />
                      <span className="text-on-surface-variant text-xs">{store.name}</span>
                    </div>
                    <span className="text-on-surface text-xs font-medium">
                      {fmtCompact(store.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders Table */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-on-surface">Recent Orders</h2>
            <button className="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
              View all orders
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-on-surface-variant">
              No recent orders.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider pb-3">
                      Order ID
                    </th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider pb-3">
                      Customer
                    </th>
                    <th className="text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider pb-3">
                      Platform
                    </th>
                    <th className="text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider pb-3">
                      Amount
                    </th>
                    <th className="text-right text-xs font-semibold text-on-surface-variant uppercase tracking-wider pb-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-outline-variant/5 last:border-0"
                    >
                      <td className="py-3 text-sm font-medium text-on-surface">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 text-sm text-on-surface-variant">
                        {order.customerName || "Guest"}
                      </td>
                      <td className="py-3 text-sm text-on-surface-variant">
                        {order.fulfillmentStatus || "Shopify"}
                      </td>
                      <td className="py-3 text-sm text-on-surface text-right">
                        {fmtCompact(order.subtotal)}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(order.financialStatus)}`}
                        >
                          {order.financialStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Shipping Variance Chart */}
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-on-surface">
                Shipping Variance
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Charged vs. Actual
              </p>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton height={250} />
          ) : trend.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-on-surface-variant">
              No shipping variance data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={trend.map((t) => ({
                  month: t.month,
                  charged: t.revenue,
                  actual: t.profit,
                }))}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#47474e" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#acaab1", fontSize: 12 }}
                  axisLine={{ stroke: "#47474e" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#acaab1", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#19191d",
                    border: "1px solid #47474e",
                    borderRadius: "8px",
                    color: "#e7e4ec",
                  }}
                />
                <Legend wrapperStyle={{ color: "#acaab1", fontSize: 12 }} />
                <Bar dataKey="charged" fill="#6366f1" name="Charged" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#ee7d77" name="Actual" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
