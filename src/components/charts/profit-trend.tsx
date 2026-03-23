"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Placeholder data — will be replaced with real data from API
const data = [
  { month: "Jan", revenue: 0, profit: 0, cogs: 0 },
  { month: "Feb", revenue: 0, profit: 0, cogs: 0 },
  { month: "Mar", revenue: 0, profit: 0, cogs: 0 },
  { month: "Apr", revenue: 0, profit: 0, cogs: 0 },
  { month: "May", revenue: 0, profit: 0, cogs: 0 },
  { month: "Jun", revenue: 0, profit: 0, cogs: 0 },
];

export function ProfitTrendChart() {
  const hasData = data.some((d) => d.revenue > 0);

  if (!hasData) {
    return (
      <div className="flex h-[300px] items-center justify-center text-muted-foreground">
        No data yet — sync your Shopify stores to see trends
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) => [`$${value.toFixed(2)}`]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--chart-1))"
          fillOpacity={1}
          fill="url(#colorRevenue)"
          name="Revenue"
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="hsl(var(--chart-2))"
          fillOpacity={1}
          fill="url(#colorProfit)"
          name="Net Profit"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
