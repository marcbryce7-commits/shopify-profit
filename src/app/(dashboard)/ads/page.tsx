"use client";

import { DollarSign, MousePointerClick, Eye, TrendingUp, RefreshCw } from "lucide-react";
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
  meta: { logo: "f", color: "#1877F2", displayName: "Meta (Facebook)" },
  tiktok: { logo: "T", color: "#000000", displayName: "TikTok Ads" },
  microsoft: { logo: "B", color: "#00BCF2", displayName: "Microsoft (Bing)" },
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
          <Skeleton className="h-9 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-56" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdsPage() {
  const { data, loading, error, refetch } = useApi<AdsData>("/api/ads");

  if (loading) return <AdsSkeleton />;

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-red-600">Failed to load ads data: {error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ad Spend</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track ad spend across all platforms
          </p>
        </div>
        <Button onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync All
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Spend
            </CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Clicks
            </CardTitle>
            <MousePointerClick className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClicks)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Impressions
            </CardTitle>
            <Eye className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalImpressions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Blended ROAS
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blendedRoas.toFixed(1)}x</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Connections</CardTitle>
          <CardDescription>
            Connect your ad platforms to track spend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platformGrid.map((platform) => (
              <div
                key={platform.key}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold text-white"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.logo}
                  </div>
                  <div>
                    <div className="font-medium">{platform.name}</div>
                    <div className="text-xs text-zinc-500">
                      {platform.connected
                        ? platform.account
                        : "Not connected"}
                    </div>
                  </div>
                </div>
                <Button
                  variant={platform.connected ? "outline" : "default"}
                  size="sm"
                >
                  {platform.connected ? "Manage" : "Connect"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spend by Platform</CardTitle>
          <CardDescription>Breakdown across connected platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {platformBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={platformBreakdown.map((pb) => ({
                  platform: getPlatformInfo(pb.platform).displayName,
                  spend: pb.totalSpend,
                  revenue: pb.totalRevenue,
                }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <XAxis dataKey="platform" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Bar dataKey="spend" fill="#ef4444" name="Spend" />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-zinc-500">
              No platform data available. Connect a platform to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                      Platform
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                      Campaign
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Spend
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Impressions
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Clicks
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Conversions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => {
                    const info = getPlatformInfo(campaign.platform);
                    return (
                      <tr
                        key={`${campaign.platform}-${campaign.campaignId}`}
                        className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-6 w-6 rounded"
                              style={{ backgroundColor: info.color }}
                            />
                            <span className="text-sm">{info.displayName}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm">{campaign.campaignName}</td>
                        <td className="py-3 text-right text-sm">
                          {formatCurrency(campaign.totalSpend)}
                        </td>
                        <td className="py-3 text-right text-sm">
                          {formatNumber(campaign.totalImpressions)}
                        </td>
                        <td className="py-3 text-right text-sm">
                          {formatNumber(campaign.totalClicks)}
                        </td>
                        <td className="py-3 text-right text-sm">
                          {formatNumber(campaign.totalConversions)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-zinc-500">
              No campaign data available. Connect a platform to see campaigns.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
