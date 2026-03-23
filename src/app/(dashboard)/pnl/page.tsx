"use client";

import { Download, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
          <Skeleton className="h-9 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[500px] w-full" />
          </CardContent>
        </Card>
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
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-red-600">Failed to load P&L data: {error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { report, trend } = data;

  // Build chart data from the last two months in trend (if available)
  const chartData = (() => {
    if (trend.length < 2) return [];
    const current = trend[trend.length - 1];
    const previous = trend[trend.length - 2];
    return [
      { category: "Revenue", current: current.revenue, previous: previous.revenue },
      { category: "Profit", current: current.profit, previous: previous.profit },
      { category: "Orders", current: current.orderCount, previous: previous.orderCount },
    ];
  })();

  const currentMonth = trend.length > 0 ? trend[trend.length - 1].month : "Current";
  const previousMonth = trend.length > 1 ? trend[trend.length - 2].month : "Previous";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profit & Loss Report</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monthly breakdown of revenue, costs, and net profit
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {currentMonth}
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>P&L Statement</CardTitle>
            <CardDescription>{currentMonth}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Gross Revenue</span>
              <span className="font-semibold">{formatCurrency(report.grossRevenue)}</span>
            </div>
            <div className="flex items-center justify-between text-red-600">
              <span>Refunds & Returns</span>
              <span className="font-semibold">-{formatCurrency(report.refunds)}</span>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Net Revenue</span>
              <span>{formatCurrency(report.netRevenue)}</span>
            </div>

            <div className="pt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Cost of Goods
              </div>
              <div className="flex items-center justify-between text-red-600">
                <span>COGS (Product Cost)</span>
                <span className="font-semibold">-{formatCurrency(report.cogs)}</span>
              </div>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Gross Profit</span>
              <span>{formatCurrency(report.grossProfit)}</span>
            </div>

            <div className="pt-4">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Operating Expenses
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-red-600">
                  <span>Shipping Costs</span>
                  <span>-{formatCurrency(report.shipping)}</span>
                </div>
                <div className="flex items-center justify-between text-red-600">
                  <span>Transaction Fees</span>
                  <span>-{formatCurrency(report.transactionFees)}</span>
                </div>
                <div className="flex items-center justify-between text-red-600">
                  <span>Ad Spend</span>
                  <span>-{formatCurrency(report.adSpend)}</span>
                </div>
                <div className="flex items-center justify-between text-red-600">
                  <span>Custom Costs</span>
                  <span>-{formatCurrency(report.customCosts)}</span>
                </div>
              </div>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total Operating Expenses</span>
              <span className="font-semibold text-red-600">
                -{formatCurrency(report.totalOperatingExpenses)}
              </span>
            </div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex items-center justify-between text-lg font-bold text-green-600">
              <span>Net Profit</span>
              <span>{formatCurrency(report.netProfit)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Profit Margin</span>
              <span className="font-medium">{report.profitMargin.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Order Count</span>
              <span className="font-medium">{report.orderCount.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
            <CardDescription>
              {currentMonth} vs {previousMonth}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-zinc-200 dark:stroke-zinc-800"
                  />
                  <XAxis dataKey="category" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#2563eb" name={currentMonth} />
                  <Bar dataKey="previous" fill="#a1a1aa" name={previousMonth} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[500px] items-center justify-center text-sm text-zinc-500">
                Not enough trend data for comparison
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
