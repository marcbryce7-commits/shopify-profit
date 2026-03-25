"use client";

import { DollarSign, MousePointerClick, Eye, TrendingUp, RefreshCw, Calendar, Loader2 } from "lucide-react";
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

interface PlatformBreakdown {
  platform: string;
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  totalRevenue: number;
}

interface Campaign {
  platform: string;
  campaignId: string;
  campaignName: string;
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
}

interface Connection {
  platform: string;
  accountName: string;
  lastSyncAt: string;
}

interface AdsData {
  totalSpend: number;
  totalClicks: number;
  totalImpressions: number;
  blendedRoas: number;
  platformBreakdown: PlatformBreakdown[];
  campaigns: Campaign[];
  connections: Connection[];
}

const PLATFORM_META: Record<string, { logo: string; color: string; displayName: string }> = {
  google: { logo: "G", color: "#4285F4", displayName: "Google Ads" },
  meta: { logo: "f", color: "#0668E1", displayName: "Meta (Facebook)" },
  tiktok: { logo: "T", color: "#EE1D52", displayName: "TikTok Ads" },
  microsoft: { logo: "B", color: "#00A4EF", displayName: "Microsoft (Bing)" },
  snapchat: { logo: "S", color: "#FFFC00", displayName: "Snapchat Ads" },
  amazon: { logo: "A", color: "#FF9900", displayName: "Amazon Ads" },
};

const ALL_PLATFORMS = ["google", "meta", "tiktok", "microsoft", "snapchat", "amazon"];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function getPlatformInfo(platform: string) {
  const key = platform.toLowerCase();
  return PLATFORM_META[key] ?? { logo: platform[0]?.toUpperCase() ?? "?", color: "#6b7280", displayName: platform };
}

function AdsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-40 bg-surface-container" />
          <Skeleton className="mt-2 h-4 w-64 bg-surface-container" />
        </div>
        <Skeleton className="h-10 w-28 bg-surface-container" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-container-low p-5">
            <Skeleton className="h-4 w-24 bg-surface-container" />
            <Skeleton className="mt-3 h-8 w-28 bg-surface-container" />
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-surface-container-low p-6">
        <Skeleton className="h-6 w-44 bg-surface-container" />
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg bg-surface-container" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdsPage() {
  const { data, loading, error, refetch } = useApi<AdsData>("/api/ads");

  if (loading) return <AdsSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md rounded-xl bg-surface-container-low p-6 text-center">
          <p className="text-sm text-error">Failed to load ads data: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { totalSpend, totalClicks, totalImpressions, blendedRoas, platformBreakdown, campaigns, connections } = data;

  // Build the connected platform set from connections
  const connectedPlatforms = new Set(connections.map((c) => c.platform.toLowerCase()));

  // Build the platform connections grid, merging connected + all known platforms
  const platformGrid = ALL_PLATFORMS.map((key) => {
    const info = getPlatformInfo(key);
    const connection = connections.find((c) => c.platform.toLowerCase() === key);
    return {
      key,
      name: info.displayName,
      logo: info.logo,
      color: info.color,
      connected: !!connection,
      account: connection?.accountName ?? null,
      lastSyncAt: connection?.lastSyncAt ?? null,
    };
  });

  // Build spend chart data from platform breakdown
  const spendChartData = platformBreakdown.length > 0
    ? [
        platformBreakdown.reduce<Record<string, string | number>>(
          (acc, pb) => {
            acc[pb.platform.toLowerCase()] = pb.totalSpend;
            return acc;
          },
          { date: "Total" }
        ),
      ]
    : [];

  // Compute per-campaign ROAS where possible
  const campaignsWithRoas = campaigns.map((c) => {
    const pb = platformBreakdown.find((p) => p.platform.toLowerCase() === c.platform.toLowerCase());
    const platformRevenue = pb?.totalRevenue ?? 0;
    const platformSpend = pb?.totalSpend ?? 0;
    const roas = c.totalSpend > 0 && platformSpend > 0
      ? (platformRevenue / platformSpend) * (c.totalSpend / platformSpend)
        ? platformRevenue / platformSpend
        : 0
      : 0;
    return { ...c, roas };
  });

  // Efficiency score (blended ROAS as percentage of a 5x target)
  const efficiencyPct = Math.min((blendedRoas / 5) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface">Ad Spend</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Track ad spend across all platforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
            <Calendar className="h-4 w-4" />
            Date Filter
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Sync All
          </button>
        </div>
      </div>

      {/* 4 Summary Cards with Progress Bars */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Total Spend</span>
            <DollarSign className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-2xl font-bold text-on-surface">{formatCurrency(totalSpend)}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest/50">
            <div className="h-full rounded-full bg-error" style={{ width: "70%" }} />
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Total Clicks</span>
            <MousePointerClick className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-2xl font-bold text-on-surface">{formatNumber(totalClicks)}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest/50">
            <div className="h-full rounded-full bg-primary" style={{ width: "55%" }} />
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Total Impressions</span>
            <Eye className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-2xl font-bold text-on-surface">{formatNumber(totalImpressions)}</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest/50">
            <div className="h-full rounded-full bg-primary" style={{ width: "80%" }} />
          </div>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Blended ROAS</span>
            <TrendingUp className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-2xl font-bold text-on-surface">{blendedRoas.toFixed(1)}x</div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container-highest/50">
            <div className="h-full rounded-full bg-tertiary-dim" style={{ width: `${efficiencyPct}%` }} />
          </div>
        </div>
      </div>

      {/* Platform Connections: 6 cards with brand border */}
      <div className="rounded-xl bg-surface-container-low p-6">
        <h2 className="text-lg font-bold text-on-surface">Platform Connections</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Connect your ad platforms to track spend</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {platformGrid.map((platform) => (
            <div
              key={platform.key}
              className="flex items-center justify-between rounded-lg border-l-4 bg-surface-container p-4"
              style={{ borderLeftColor: platform.color }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.logo}
                </div>
                <div>
                  <div className="text-sm font-medium text-on-surface">{platform.name}</div>
                  <div className="text-xs text-on-surface-variant">
                    {platform.connected ? platform.account : "Not connected"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {platform.connected ? (
                  <span className="inline-flex items-center rounded-full bg-tertiary-dim/15 px-2.5 py-0.5 text-[11px] font-semibold text-tertiary-dim">
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-outline-variant/20 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                    Disconnected
                  </span>
                )}
                <button
                  onClick={() => {
                    if (!platform.connected) {
                      const routes: Record<string, string> = {
                        google: "/api/ads/google/auth",
                        meta: "/api/ads/meta/auth",
                      };
                      const route = routes[platform.key];
                      if (route) {
                        window.location.href = route;
                      } else {
                        alert(`${platform.name} integration coming soon`);
                      }
                    }
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    platform.connected
                      ? "border border-outline-variant/10 bg-surface-container-low text-on-surface hover:bg-surface-container-high/50"
                      : "bg-primary text-on-primary hover:bg-primary/90"
                  }`}
                >
                  {platform.connected ? "Manage" : "Connect"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked bar chart (2/3) + Efficiency Score (1/3) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl bg-surface-container-low p-6">
          <h2 className="text-lg font-bold text-on-surface">Spend by Platform</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Breakdown across connected platforms</p>
          <div className="mt-4">
            {platformBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={platformBreakdown.map((pb) => ({
                    platform: getPlatformInfo(pb.platform).displayName,
                    spend: pb.totalSpend,
                    revenue: pb.totalRevenue,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#47474e" strokeOpacity={0.3} />
                  <XAxis dataKey="platform" tick={{ fill: "#acaab1", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#acaab1", fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: "#19191d", border: "1px solid #47474e", borderRadius: "8px", color: "#e7e4ec" }}
                    labelStyle={{ color: "#e7e4ec" }}
                  />
                  <Legend wrapperStyle={{ color: "#acaab1" }} />
                  <Bar dataKey="spend" fill="#ee7d77" name="Spend" stackId="a" />
                  <Bar dataKey="revenue" fill="#73f08c" name="Revenue" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-on-surface-variant">
                No platform data available. Connect a platform to get started.
              </div>
            )}
          </div>
        </div>

        {/* Efficiency Score Circle */}
        <div className="rounded-xl bg-surface-container-low p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold text-on-surface">Efficiency Score</h2>
          <p className="mt-1 text-sm text-on-surface-variant">ROAS vs 5x target</p>
          <div className="relative mt-6 flex h-40 w-40 items-center justify-center">
            <svg className="absolute inset-0" viewBox="0 0 160 160">
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke="#25252b"
                strokeWidth="12"
              />
              <circle
                cx="80"
                cy="80"
                r="68"
                fill="none"
                stroke={efficiencyPct >= 80 ? "#73f08c" : efficiencyPct >= 50 ? "#4285F4" : "#ee7d77"}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${efficiencyPct * 4.27} 427`}
                transform="rotate(-90 80 80)"
              />
            </svg>
            <div className="text-center">
              <span className="text-3xl font-extrabold text-on-surface">{efficiencyPct.toFixed(0)}%</span>
              <p className="text-xs text-on-surface-variant">{blendedRoas.toFixed(1)}x ROAS</p>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="overflow-hidden rounded-xl bg-surface-container-low">
        <div className="border-b border-outline-variant/5 px-6 py-5">
          <h2 className="text-lg font-bold text-on-surface">Campaign Performance</h2>
        </div>
        {campaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Campaign Name
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Spend
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    CTR
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Conv Rate
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    ROAS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {campaignsWithRoas.map((campaign) => {
                  const info = getPlatformInfo(campaign.platform);
                  const ctr = campaign.totalImpressions > 0
                    ? ((campaign.totalClicks / campaign.totalImpressions) * 100).toFixed(2)
                    : "0.00";
                  const convRate = campaign.totalClicks > 0
                    ? ((campaign.totalConversions / campaign.totalClicks) * 100).toFixed(2)
                    : "0.00";
                  return (
                    <tr
                      key={`${campaign.platform}-${campaign.campaignId}`}
                      className="transition-colors hover:bg-surface-container-high/30"
                    >
                      <td className="px-4 py-3.5 text-sm font-medium text-on-surface">
                        {campaign.campaignName}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-tertiary-dim/15 px-2.5 py-0.5 text-[11px] font-semibold text-tertiary-dim">
                          Active
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-5 w-5 rounded"
                            style={{ backgroundColor: info.color }}
                          />
                          <span className="text-sm text-on-surface">{info.displayName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-on-surface">
                        {formatCurrency(campaign.totalSpend)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                        {ctr}%
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                        {convRate}%
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-semibold text-on-surface">
                        {campaign.roas.toFixed(1)}x
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-on-surface-variant">
            No campaign data available. Connect a platform to see campaigns.
          </div>
        )}
      </div>
    </div>
  );
}
