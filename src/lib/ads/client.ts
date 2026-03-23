/**
 * Ad Platform Client — unified interface for fetching daily spend from
 * Google Ads, Meta (Facebook), TikTok, Bing (Microsoft), Snapchat, and Amazon Ads.
 *
 * Each platform has its own OAuth flow and reporting API.  This module normalises
 * the data into a common CampaignSpend shape that the Inngest sync job persists.
 */

export type AdPlatformType =
  | "google"
  | "meta"
  | "tiktok"
  | "bing"
  | "snapchat"
  | "amazon";

export interface CampaignSpend {
  campaignId: string;
  campaignName: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenueAttributed?: number;
}

/**
 * Fetch daily ad spend for a date range from a given platform.
 */
export async function fetchAdSpend(
  platform: AdPlatformType,
  accessToken: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  switch (platform) {
    case "google":
      return fetchGoogleAds(accessToken, accountId, startDate, endDate);
    case "meta":
      return fetchMetaAds(accessToken, accountId, startDate, endDate);
    case "tiktok":
      return fetchTikTokAds(accessToken, accountId, startDate, endDate);
    case "bing":
      return fetchBingAds(accessToken, accountId, startDate, endDate);
    case "snapchat":
      return fetchSnapchatAds(accessToken, accountId, startDate, endDate);
    case "amazon":
      return fetchAmazonAds(accessToken, accountId, startDate, endDate);
  }
}

// ─── Date helper ────────────────────────────────────────────────────────────

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Google Ads (REST v17) ──────────────────────────────────────────────────

async function fetchGoogleAds(
  accessToken: string,
  customerId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken) throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN not set");

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.conversions,
      metrics.conversions_value
    FROM campaign
    WHERE segments.date BETWEEN '${fmtDate(startDate)}' AND '${fmtDate(endDate)}'
    ORDER BY campaign.id
  `;

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": devToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    throw new Error(`Google Ads API error: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as Array<{
    results: Array<{
      campaign: { id: string; name: string };
      metrics: {
        costMicros: string;
        impressions: string;
        clicks: string;
        conversions: number;
        conversionsValue: number;
      };
    }>;
  }>;

  const campaigns: CampaignSpend[] = [];
  for (const batch of data) {
    for (const row of batch.results) {
      campaigns.push({
        campaignId: row.campaign.id,
        campaignName: row.campaign.name,
        spend: parseInt(row.metrics.costMicros, 10) / 1_000_000,
        impressions: parseInt(row.metrics.impressions, 10),
        clicks: parseInt(row.metrics.clicks, 10),
        conversions: Math.round(row.metrics.conversions),
        revenueAttributed: row.metrics.conversionsValue,
      });
    }
  }
  return campaigns;
}

// ─── Meta (Facebook) Marketing API v21.0 ────────────────────────────────────

async function fetchMetaAds(
  accessToken: string,
  adAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  const timeRange = JSON.stringify({
    since: fmtDate(startDate),
    until: fmtDate(endDate),
  });

  const params = new URLSearchParams({
    access_token: accessToken,
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions",
    time_range: timeRange,
    level: "campaign",
    limit: "500",
  });

  const res = await fetch(
    `https://graph.facebook.com/v21.0/act_${adAccountId}/insights?${params}`
  );

  if (!res.ok) {
    throw new Error(`Meta Ads API error: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as {
    data: Array<{
      campaign_id: string;
      campaign_name: string;
      spend: string;
      impressions: string;
      clicks: string;
      actions?: Array<{ action_type: string; value: string }>;
    }>;
  };

  return body.data.map((row) => {
    const purchases =
      row.actions?.find((a) => a.action_type === "purchase")?.value ?? "0";
    return {
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      spend: parseFloat(row.spend),
      impressions: parseInt(row.impressions, 10),
      clicks: parseInt(row.clicks, 10),
      conversions: parseInt(purchases, 10),
    };
  });
}

// ─── TikTok Business API v1.3 ───────────────────────────────────────────────

async function fetchTikTokAds(
  accessToken: string,
  advertiserId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  const params = new URLSearchParams({
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: '["campaign_id"]',
    metrics:
      '["spend","impressions","clicks","conversion","complete_payment_roas"]',
    start_date: fmtDate(startDate),
    end_date: fmtDate(endDate),
    page_size: "500",
  });

  const res = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?${params}`,
    {
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`TikTok Ads API error: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as {
    data: {
      list: Array<{
        dimensions: { campaign_id: string };
        metrics: {
          campaign_name: string;
          spend: string;
          impressions: string;
          clicks: string;
          conversion: string;
          complete_payment_roas: string;
        };
      }>;
    };
  };

  return (body.data?.list ?? []).map((row) => ({
    campaignId: row.dimensions.campaign_id,
    campaignName: row.metrics.campaign_name ?? row.dimensions.campaign_id,
    spend: parseFloat(row.metrics.spend),
    impressions: parseInt(row.metrics.impressions, 10),
    clicks: parseInt(row.metrics.clicks, 10),
    conversions: parseInt(row.metrics.conversion, 10),
  }));
}

// ─── Microsoft Advertising (Bing) Reporting API ─────────────────────────────

async function fetchBingAds(
  accessToken: string,
  accountId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  // Bing uses SOAP-based reporting, but for simplicity we use the REST
  // Campaign Management endpoint to get campaigns, then the Reporting
  // endpoint for performance.  The v13 REST beta is available.

  const reportRequest = {
    ReportName: "ProfitPilotCampaignReport",
    Format: "Json",
    Aggregation: "Summary",
    Columns: [
      "CampaignId",
      "CampaignName",
      "Spend",
      "Impressions",
      "Clicks",
      "Conversions",
      "Revenue",
    ],
    Scope: { AccountIds: [accountId] },
    Time: {
      CustomDateRangeStart: {
        Day: startDate.getDate(),
        Month: startDate.getMonth() + 1,
        Year: startDate.getFullYear(),
      },
      CustomDateRangeEnd: {
        Day: endDate.getDate(),
        Month: endDate.getMonth() + 1,
        Year: endDate.getFullYear(),
      },
    },
  };

  // Submit report
  const submitRes = await fetch(
    "https://reporting.api.bingads.microsoft.com/Reporting/v13/GenerateReport",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        DeveloperToken: process.env.BING_DEVELOPER_TOKEN ?? "",
        AccountId: accountId,
      },
      body: JSON.stringify({
        ReportRequest: {
          ...reportRequest,
          Type: "CampaignPerformanceReport",
        },
      }),
    }
  );

  if (!submitRes.ok) {
    throw new Error(
      `Bing Ads API error: ${submitRes.status} ${await submitRes.text()}`
    );
  }

  const submitBody = (await submitRes.json()) as {
    ReportRows?: Array<{
      CampaignId: string;
      CampaignName: string;
      Spend: string;
      Impressions: string;
      Clicks: string;
      Conversions: string;
      Revenue: string;
    }>;
  };

  return (submitBody.ReportRows ?? []).map((row) => ({
    campaignId: row.CampaignId,
    campaignName: row.CampaignName,
    spend: parseFloat(row.Spend),
    impressions: parseInt(row.Impressions, 10),
    clicks: parseInt(row.Clicks, 10),
    conversions: parseInt(row.Conversions, 10),
    revenueAttributed: parseFloat(row.Revenue),
  }));
}

// ─── Snapchat Marketing API v1 ──────────────────────────────────────────────

async function fetchSnapchatAds(
  accessToken: string,
  adAccountId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  // Get campaigns first
  const campaignsRes = await fetch(
    `https://adsapi.snapchat.com/v1/adaccounts/${adAccountId}/campaigns`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!campaignsRes.ok) {
    throw new Error(
      `Snapchat Ads API error: ${campaignsRes.status} ${await campaignsRes.text()}`
    );
  }

  const campaignsBody = (await campaignsRes.json()) as {
    campaigns: Array<{
      campaign: { id: string; name: string };
    }>;
  };

  const results: CampaignSpend[] = [];

  for (const c of campaignsBody.campaigns ?? []) {
    const statsParams = new URLSearchParams({
      granularity: "TOTAL",
      start_time: startDate.toISOString(),
      end_time: new Date(
        endDate.getTime() + 24 * 60 * 60 * 1000
      ).toISOString(),
      fields:
        "spend,impressions,swipes,conversion_purchases,conversion_purchases_value",
    });

    const statsRes = await fetch(
      `https://adsapi.snapchat.com/v1/campaigns/${c.campaign.id}/stats?${statsParams}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!statsRes.ok) continue;

    const statsBody = (await statsRes.json()) as {
      timeseries_stats: Array<{
        timeseries_stat: {
          stats: {
            spend: string;
            impressions: string;
            swipes: string;
            conversion_purchases: string;
            conversion_purchases_value: string;
          };
        };
      }>;
    };

    const stat =
      statsBody.timeseries_stats?.[0]?.timeseries_stat?.stats;
    if (stat) {
      results.push({
        campaignId: c.campaign.id,
        campaignName: c.campaign.name,
        spend: parseInt(stat.spend, 10) / 1_000_000, // Snapchat reports in micro-currency
        impressions: parseInt(stat.impressions, 10),
        clicks: parseInt(stat.swipes, 10),
        conversions: parseInt(stat.conversion_purchases ?? "0", 10),
        revenueAttributed: stat.conversion_purchases_value
          ? parseInt(stat.conversion_purchases_value, 10) / 1_000_000
          : undefined,
      });
    }
  }

  return results;
}

// ─── Amazon Ads API v3 ──────────────────────────────────────────────────────

async function fetchAmazonAds(
  accessToken: string,
  profileId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSpend[]> {
  // Request a Sponsored Products campaign report
  const reportRes = await fetch(
    `https://advertising-api.amazon.com/v3/reports`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Amazon-Advertising-API-ClientId":
          process.env.AMAZON_ADS_CLIENT_ID ?? "",
        "Amazon-Advertising-API-Scope": profileId,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reportDate: fmtDate(startDate),
        campaignType: "sponsoredProducts",
        groupBy: ["campaign"],
        columns: [
          "campaignId",
          "campaignName",
          "cost",
          "impressions",
          "clicks",
          "purchases14d",
          "sales14d",
        ],
        startDate: fmtDate(startDate),
        endDate: fmtDate(endDate),
      }),
    }
  );

  if (!reportRes.ok) {
    throw new Error(
      `Amazon Ads API error: ${reportRes.status} ${await reportRes.text()}`
    );
  }

  const reportBody = (await reportRes.json()) as {
    reportId: string;
    url?: string;
  };

  // Poll for report completion (max 30s)
  let reportUrl = reportBody.url;
  if (!reportUrl) {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      const statusRes = await fetch(
        `https://advertising-api.amazon.com/v3/reports/${reportBody.reportId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Amazon-Advertising-API-ClientId":
              process.env.AMAZON_ADS_CLIENT_ID ?? "",
            "Amazon-Advertising-API-Scope": profileId,
          },
        }
      );
      const statusBody = (await statusRes.json()) as {
        status: string;
        url?: string;
      };
      if (statusBody.status === "COMPLETED" && statusBody.url) {
        reportUrl = statusBody.url;
        break;
      }
      if (statusBody.status === "FAILURE") {
        throw new Error("Amazon Ads report generation failed");
      }
    }
  }

  if (!reportUrl) {
    throw new Error("Amazon Ads report timed out");
  }

  // Download report
  const dataRes = await fetch(reportUrl);
  const rows = (await dataRes.json()) as Array<{
    campaignId: string;
    campaignName: string;
    cost: number;
    impressions: number;
    clicks: number;
    purchases14d: number;
    sales14d: number;
  }>;

  return rows.map((row) => ({
    campaignId: String(row.campaignId),
    campaignName: row.campaignName,
    spend: row.cost,
    impressions: row.impressions,
    clicks: row.clicks,
    conversions: row.purchases14d,
    revenueAttributed: row.sales14d,
  }));
}

// ─── OAuth Token Refresh ────────────────────────────────────────────────────

export interface TokenRefreshResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export async function refreshAdToken(
  platform: AdPlatformType,
  refreshToken: string
): Promise<TokenRefreshResult> {
  switch (platform) {
    case "google": {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_ADS_CLIENT_ID ?? "",
          client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? "",
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
      };
      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    }

    case "meta": {
      const params = new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID ?? "",
        client_secret: process.env.META_APP_SECRET ?? "",
        fb_exchange_token: refreshToken,
      });
      const res = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?${params}`
      );
      const data = (await res.json()) as {
        access_token: string;
        expires_in: number;
      };
      return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    }

    case "tiktok": {
      const res = await fetch(
        "https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_id: process.env.TIKTOK_APP_ID,
            secret: process.env.TIKTOK_APP_SECRET,
            auth_code: refreshToken,
            grant_type: "refresh_token",
          }),
        }
      );
      const data = (await res.json()) as {
        data: { access_token: string; expires_in: number };
      };
      return {
        accessToken: data.data.access_token,
        expiresAt: new Date(Date.now() + data.data.expires_in * 1000),
      };
    }

    case "bing": {
      const res = await fetch(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.BING_CLIENT_ID ?? "",
            client_secret: process.env.BING_CLIENT_SECRET ?? "",
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        }
      );
      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    }

    case "snapchat": {
      const res = await fetch("https://accounts.snapchat.com/login/oauth2/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.SNAPCHAT_CLIENT_ID ?? "",
          client_secret: process.env.SNAPCHAT_CLIENT_SECRET ?? "",
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    }

    case "amazon": {
      const res = await fetch("https://api.amazon.com/auth/o2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AMAZON_ADS_CLIENT_ID ?? "",
          client_secret: process.env.AMAZON_ADS_CLIENT_SECRET ?? "",
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });
      const data = (await res.json()) as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
      };
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
      };
    }
  }
}
