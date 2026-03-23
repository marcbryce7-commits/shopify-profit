"use client";

import { Download, Calendar, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface PnLReport {
  grossRevenue: number;
  refunds: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  shipping: number;
  transactionFees: number;
  adSpend: number;
  customCosts: number;
  totalOperatingExpenses: number;
  netProfit: number;
  profitMargin: number;
  orderCount: number;
}

interface TrendItem {
  month: string;
  revenue: number;
  profit: number;
  orderCount: number;
}

interface PnLData {
  report: PnLReport;
  trend: TrendItem[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function PnLSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-64 animate-pulse rounded-lg bg-surface-container" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded-lg bg-surface-container" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-36 animate-pulse rounded-lg bg-surface-container" />
          <div className="h-10 w-24 animate-pulse rounded-lg bg-surface-container" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="h-[600px] animate-pulse rounded-xl bg-surface-container-low" />
        </div>
        <div className="lg:col-span-5">
          <div className="h-[600px] animate-pulse rounded-xl bg-surface-container-low" />
        </div>
      </div>
    </div>
  );
}

export default function PnLPage() {
  const { data, loading, error } = useApi<PnLData>("/api/pnl");

  if (loading) return <PnLSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md rounded-xl border border-outline-variant/5 bg-surface-container-low p-6 text-center">
          <p className="text-sm text-error">Failed to load P&L data: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-outline-variant/5 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { report, trend } = data;

  const chartData = trend.map((item) => ({
    month: item.month,
    Revenue: item.revenue,
    Profit: item.profit,
  }));

  const currentMonth = trend.length > 0 ? trend[trend.length - 1].month : "Current";

  const operatingMargin =
    report.netRevenue !== 0
      ? ((report.netProfit / report.netRevenue) * 100).toFixed(1)
      : "0.0";

  const cacRatio =
    report.adSpend !== 0
      ? (report.netRevenue / report.adSpend).toFixed(1)
      : "N/A";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface">Profit & Loss Report</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Monthly breakdown of revenue, costs, and net profit
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/5 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high">
            <Calendar className="h-4 w-4" />
            {currentMonth}
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* 2-Column Layout: 7/5 split */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: P&L Statement */}
        <div className="lg:col-span-7">
          <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-on-surface">P&L Statement</h2>
              <p className="text-sm text-on-surface-variant">{currentMonth}</p>
            </div>

            <div className="space-y-4">
              {/* Revenue Section */}
              <div className="text-sm font-bold uppercase tracking-widest text-outline">Revenue</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Gross Revenue</span>
                  <span className="text-sm font-semibold text-on-surface">{formatCurrency(report.grossRevenue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Refunds & Returns</span>
                  <span className="text-sm font-semibold text-error">-{formatCurrency(report.refunds)}</span>
                </div>
              </div>
              <div className="h-px bg-outline-variant/5" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">Net Revenue</span>
                <span className="text-base font-bold text-on-surface">{formatCurrency(report.netRevenue)}</span>
              </div>

              {/* COGS Section */}
              <div className="pt-4 text-sm font-bold uppercase tracking-widest text-outline">Cost of Goods</div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-on-surface-variant">COGS (Product Cost)</span>
                <span className="text-sm font-semibold text-error">-{formatCurrency(report.cogs)}</span>
              </div>
              <div className="h-px bg-outline-variant/5" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-on-surface">Gross Profit</span>
                <span className="text-base font-bold text-on-surface">{formatCurrency(report.grossProfit)}</span>
              </div>

              {/* Operating Expenses Section */}
              <div className="pt-4 text-sm font-bold uppercase tracking-widest text-outline">Operating Expenses</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Shipping Costs</span>
                  <span className="text-sm text-error">-{formatCurrency(report.shipping)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Transaction Fees</span>
                  <span className="text-sm text-error">-{formatCurrency(report.transactionFees)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Ad Spend</span>
                  <span className="text-sm text-error">-{formatCurrency(report.adSpend)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-on-surface-variant">Custom Costs</span>
                  <span className="text-sm text-error">-{formatCurrency(report.customCosts)}</span>
                </div>
              </div>
              <div className="h-px bg-outline-variant/5" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-on-surface">Total Operating Expenses</span>
                <span className="text-sm font-semibold text-error">-{formatCurrency(report.totalOperatingExpenses)}</span>
              </div>

              {/* Net Profit */}
              <div className="h-px bg-outline-variant/5" />
              <div className="pt-2 text-sm font-bold uppercase tracking-widest text-outline">Net Profit</div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-on-surface">Net Profit</span>
                <span className="text-3xl font-black text-[#82ff99]">{formatCurrency(report.netProfit)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-outline">Profit Margin</span>
                <span className="text-sm font-medium text-on-surface-variant">{report.profitMargin.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-outline">Order Count</span>
                <span className="text-sm font-medium text-on-surface-variant">{report.orderCount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chart + Summary Stats */}
        <div className="space-y-4 lg:col-span-5">
          {/* Profit Trend Chart */}
          <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-on-surface">Profit Trend</h2>
              <p className="text-sm text-on-surface-variant">Revenue vs Profit by month</p>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#75757c" strokeOpacity={0.15} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#acaab1", fontSize: 12 }}
                    axisLine={{ stroke: "#75757c", strokeOpacity: 0.2 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#acaab1", fontSize: 12 }}
                    axisLine={{ stroke: "#75757c", strokeOpacity: 0.2 }}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#2b2930",
                      border: "1px solid rgba(117, 117, 124, 0.2)",
                      borderRadius: "8px",
                      color: "#e7e4ec",
                    }}
                    formatter={(value: number) => [formatCurrency(value)]}
                  />
                  <Bar dataKey="Revenue" fill="#6b6a70" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Profit" fill="#73f08c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm text-outline">
                Not enough trend data for chart
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
              <span className="text-sm font-medium text-on-surface-variant">Operating Margin</span>
              <div className="mt-2 text-2xl font-bold text-on-surface">{operatingMargin}%</div>
            </div>
            <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
              <span className="text-sm font-medium text-on-surface-variant">CAC Ratio</span>
              <div className="mt-2 text-2xl font-bold text-on-surface">{cacRatio}x</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
