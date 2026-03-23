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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Area,
  AreaChart,
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

const STORE_COLORS = ["#2563eb", "#16a34a", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const fmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

function fmtCompact(n: number) {
  return fmt.format(n);
}

function statusVariant(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "authorized") return "success" as const;
  if (s === "pending" || s === "partially_paid") return "warning" as const;
  if (s === "refunded" || s === "voided") return "destructive" as const;
  return "secondary" as const;
}

// ---------- Sub-components ----------

function MetricCard({
  icon: Icon,
  title,
  value,
  description,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  description: string;
  accent?: string;
}) {
  return (
    <Card className={accent}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-1 h-7 w-28" />
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="flex items-center justify-center" style={{ height }}>
      <div className="flex flex-col items-center gap-2 text-zinc-400">
        <Skeleton className="h-full w-full" style={{ height, minWidth: 200 }} />
      </div>
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
      ? ((metrics.netProfit / metrics.totalRevenue) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time profit tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-red-500">Failed to load data</span>
          )}
          <Button onClick={refetch} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Sync Now
          </Button>
        </div>
      </div>

      {/* Metric Cards Row 1 */}
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
            <MetricCard
              icon={DollarSign}
              title="Total Revenue"
              value={fmtCompact(metrics.totalRevenue)}
              description={`from ${metrics.orderCount.toLocaleString()} orders`}
            />
            <MetricCard
              icon={Package}
              title="Total COGS"
              value={fmtCompact(metrics.totalCogs)}
              description="cost of goods sold"
            />
            <MetricCard
              icon={Truck}
              title="Shipping Costs"
              value={fmtCompact(metrics.totalShipping)}
              description="shipping & fulfillment"
            />
            <MetricCard
              icon={CreditCard}
              title="Transaction Fees"
              value={fmtCompact(metrics.totalFees)}
              description="payment processing"
            />
          </>
        ) : (
          <div className="col-span-full text-center text-sm text-zinc-500">
            No metric data available.
          </div>
        )}
      </div>

      {/* Metric Cards Row 2 */}
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
            <MetricCard
              icon={Megaphone}
              title="Ad Spend"
              value={fmtCompact(metrics.totalAdSpend)}
              description="across all platforms"
            />
            <MetricCard
              icon={ShoppingCart}
              title="Custom Costs"
              value={fmtCompact(metrics.totalCustomCosts)}
              description="user-defined cost rules"
            />
            <MetricCard
              icon={TrendingUp}
              title="Net Profit"
              value={fmtCompact(metrics.netProfit)}
              description={`margin: ${margin}%`}
              accent="border-l-4 border-l-green-600"
            />
            <MetricCard
              icon={AlertTriangle}
              title="Cost Alerts"
              value={String(metrics.activeAlerts)}
              description={`${metrics.activeAlerts} discrepancies found`}
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue & Profit Trend</CardTitle>
                <CardDescription>
                  {trend.length > 0
                    ? `Last ${trend.length} months`
                    : "No trend data"}
                </CardDescription>
              </div>
              <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  Daily
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 bg-white px-2 text-xs dark:bg-zinc-900"
                >
                  Weekly
                </Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  Monthly
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : trendChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
                No trend data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="overview-revenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="overview-profit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                  />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    fillOpacity={1}
                    fill="url(#overview-revenue)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#16a34a"
                    fillOpacity={1}
                    fill="url(#overview-profit)"
                    name="Net Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Revenue by Store</CardTitle>
            <CardDescription>
              {totalStoreRevenue > 0
                ? `Total: ${fmtCompact(totalStoreRevenue)}`
                : "No store data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton />
            ) : storeChartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-sm text-zinc-400">
                No store breakdown data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={storeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {storeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Button variant="ghost" size="sm">
              View all orders
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <Skeleton className="mb-1 h-4 w-16" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Skeleton className="mb-1 h-4 w-16" />
                        <Skeleton className="h-3 w-14" />
                      </div>
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-zinc-400">
                No recent orders.
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-medium">#{order.orderNumber}</div>
                        <div className="text-xs text-zinc-500">
                          {new Date(order.orderDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {order.customerName ? ` \u00b7 ${order.customerName}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm">{fmtCompact(order.subtotal)}</div>
                        <div className="text-xs font-semibold text-green-600">
                          +{fmtCompact(order.netProfit)}
                        </div>
                      </div>
                      <Badge variant={statusVariant(order.financialStatus)}>
                        {order.financialStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Shipping Cost Variance</CardTitle>
              <Badge variant="outline">Charged vs. Actual</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <ChartSkeleton height={250} />
            ) : trend.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-sm text-zinc-400">
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
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                  />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="charged" fill="#2563eb" name="Charged" />
                  <Bar dataKey="actual" fill="#ef4444" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
