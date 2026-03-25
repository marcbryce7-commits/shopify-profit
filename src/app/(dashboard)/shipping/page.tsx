"use client";

import { useState } from "react";
import { Mail, Clock, CheckCircle, AlertCircle, Play, Upload, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useApi, apiPost } from "@/hooks/use-api";

interface EmailLog {
  id: string;
  userId: string;
  emailSubject: string;
  sender: string;
  receivedAt: string;
  processedAt: string | null;
  status: string;
  extractedData: {
    invoice?: string;
    supplier?: string;
    amount?: number;
    order?: string;
    confidence?: number;
    scanned?: number;
    found?: number;
    matched?: number;
    errors?: number;
    duration?: string;
  } | null;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  emailAddress: string;
  label: string;
  active: boolean;
  lastScannedAt: string | null;
}

interface ShippingResponse {
  pendingReview: EmailLog[];
  recentHistory: EmailLog[];
  connectedAccounts: ConnectedAccount[];
}

export default function ShippingPage() {
  const { data, loading, error, refetch } = useApi<ShippingResponse>("/api/shipping");
  const [autoScan, setAutoScan] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"review" | "history" | "upload" | "settings">("review");

  const handleRunAgent = async () => {
    setRunning(true);
    try {
      const res = await apiPost("/api/shipping/scan");
      toast.success(res.message || "Scan complete");
      refetch();
    } catch {
      toast.error("Failed to run email scan");
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-sm text-error">{error}</p>
        <button
          onClick={refetch}
          className="rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50"
        >
          Retry
        </button>
      </div>
    );
  }

  const pendingReview = data?.pendingReview ?? [];
  const recentHistory = data?.recentHistory ?? [];
  const connectedAccounts = data?.connectedAccounts ?? [];
  const activeAccount = connectedAccounts.find((a) => a.active);
  const matchedCount = recentHistory.reduce(
    (sum, r) => sum + (r.extractedData?.matched ?? 0),
    0
  );

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Less than 1 hour ago";
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  const tabs = [
    { key: "review" as const, label: "Review Queue" },
    { key: "history" as const, label: "Processing History" },
    { key: "upload" as const, label: "Manual Upload" },
    { key: "settings" as const, label: "Settings" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Shipping Agent</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            AI-powered shipping cost reconciliation from invoices and emails
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-on-surface-variant">Auto-scan every 6h</span>
            <Switch checked={autoScan} onCheckedChange={setAutoScan} />
          </div>
          <button
            onClick={handleRunAgent}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 px-4 py-2.5 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Agent Now
          </button>
        </div>
      </div>

      {/* 3 Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Last Scan</span>
            <Clock className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-lg font-semibold text-on-surface">
            {formatTimeAgo(connectedAccounts.find((a) => a.lastScannedAt)?.lastScannedAt ?? null)}
          </div>
        </div>

        <div className="rounded-xl border border-tertiary-dim/20 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Matched</span>
            <CheckCircle className="h-4 w-4 text-tertiary-dim" />
          </div>
          <div className="mt-3 text-lg font-semibold text-on-surface">{matchedCount} invoices matched</div>
        </div>

        <div className="rounded-xl border border-error/20 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Pending Review</span>
            <AlertCircle className="h-4 w-4 text-error" />
          </div>
          <div className="mt-3 text-lg font-semibold text-on-surface">{pendingReview.length} need approval</div>
        </div>
      </div>

      {/* Connected Email Accounts */}
      <div className="rounded-xl bg-surface-container-low p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Connected Email Accounts</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">Accounts scanned for shipping invoices</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/api/email/google/auth"
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high/50"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect Gmail
            </a>
            <a
              href="/api/email/outlook/auth"
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high/50"
            >
              <Plus className="h-3.5 w-3.5" />
              Connect Outlook
            </a>
          </div>
        </div>

        {connectedAccounts.length === 0 ? (
          <div className="py-8 text-center">
            <Mail className="mx-auto h-10 w-10 text-on-surface-variant/30" />
            <p className="mt-3 text-sm text-on-surface-variant">No email accounts connected yet.</p>
            <p className="mt-1 text-xs text-on-surface-variant/60">Connect a Gmail or Outlook account to start scanning for shipping invoices.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-surface-container p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    account.provider === "gmail" ? "bg-red-500/10" : "bg-blue-500/10"
                  }`}>
                    <Mail className={`h-5 w-5 ${
                      account.provider === "gmail" ? "text-red-400" : "text-blue-400"
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-on-surface">{account.emailAddress}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        account.active
                          ? "bg-tertiary-dim/15 text-tertiary-dim"
                          : "bg-surface-container-highest text-on-surface-variant"
                      }`}>
                        {account.active ? "Active" : "Paused"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-on-surface-variant capitalize">{account.provider}</span>
                      <span className="text-[11px] text-on-surface-variant">
                        Last scan: {formatTimeAgo(account.lastScannedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-lg border border-outline-variant/10 bg-surface-container-low p-2 text-on-surface-variant transition-colors hover:text-error hover:border-error/20"
                    title="Remove account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Card */}
      <div className="overflow-hidden rounded-xl bg-surface-container-low">
        {/* Tab Bar */}
        <div className="flex border-b border-outline-variant/5 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "text-primary"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Review Queue Tab */}
          {activeTab === "review" && (
            <>
              {selectedItems.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-surface-container p-3">
                  <span className="text-sm font-medium text-on-surface">
                    {selectedItems.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button className="rounded-lg border border-outline-variant/10 bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
                      Approve All
                    </button>
                    <button className="rounded-lg border border-outline-variant/10 bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
                      Reject All
                    </button>
                  </div>
                </div>
              )}
              {pendingReview.length === 0 ? (
                <div className="py-12 text-center text-sm text-on-surface-variant">
                  No invoices pending review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-high/50">
                        <th className="w-12 px-4 py-3"></th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                          Invoice ID
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                          Supplier
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                          AI Confidence
                        </th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {pendingReview.map((item) => {
                        const ext = item.extractedData;
                        const confidence = ext?.confidence ?? 0;
                        return (
                          <tr
                            key={item.id}
                            className="transition-colors hover:bg-surface-container-high/30"
                          >
                            <td className="px-4 py-3.5">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-outline-variant accent-primary"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems([...selectedItems, item.id]);
                                  } else {
                                    setSelectedItems(selectedItems.filter((id) => id !== item.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="px-4 py-3.5 text-sm font-medium text-on-surface">
                              {ext?.invoice ?? item.emailSubject}
                            </td>
                            <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                              {ext?.supplier ?? item.sender}
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm font-medium text-on-surface">
                              ${(ext?.amount ?? 0).toFixed(2)}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="h-2 w-24 overflow-hidden rounded-full bg-surface-container-highest/50">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      confidence > 80
                                        ? "bg-tertiary-dim"
                                        : confidence > 50
                                          ? "bg-yellow-500"
                                          : "bg-error"
                                    }`}
                                    style={{ width: `${confidence}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-on-surface-variant">{confidence}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex justify-end gap-2">
                                <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-on-primary transition-colors hover:bg-primary/90">
                                  Approve
                                </button>
                                <button className="rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Processing History Tab */}
          {activeTab === "history" && (
            <>
              {recentHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-on-surface-variant">
                  No processing history yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-high/50">
                        <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Date</th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Emails Scanned</th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Invoices Found</th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Matched</th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Errors</th>
                        <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {recentHistory.map((run) => {
                        const ext = run.extractedData;
                        return (
                          <tr
                            key={run.id}
                            className="transition-colors hover:bg-surface-container-high/30"
                          >
                            <td className="px-4 py-3.5 text-sm text-on-surface">
                              {new Date(run.processedAt ?? run.receivedAt).toLocaleString()}
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">{ext?.scanned ?? 0}</td>
                            <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">{ext?.found ?? 0}</td>
                            <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">{ext?.matched ?? 0}</td>
                            <td className={`px-4 py-3.5 text-right text-sm ${(ext?.errors ?? 0) > 0 ? "text-error font-medium" : "text-on-surface-variant"}`}>
                              {ext?.errors ?? 0}
                            </td>
                            <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">{ext?.duration ?? "--"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Manual Upload Tab */}
          {activeTab === "upload" && (
            <div className="flex min-h-[300px] items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/20">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container">
                  <Upload className="h-8 w-8 text-on-surface-variant" />
                </div>
                <div>
                  <p className="font-medium text-on-surface">Drop a PDF or CSV invoice here</p>
                  <p className="mt-1 text-sm text-on-surface-variant">
                    Supported: PDF, CSV (FedEx billing format)
                  </p>
                </div>
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90">
                  Choose File
                </button>
              </div>
            </div>
          )}

          {/* Settings Tab (FedEx) */}
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-yellow-900/20 p-4">
                <p className="text-sm text-yellow-400">
                  <strong>Limitation notice:</strong> FedEx public APIs do not expose
                  actual billed amounts or post-shipment adjustments. Use the email
                  agent or upload FedEx billing CSV for 100% accuracy.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90">
                  Connect FedEx Account
                </button>
                <button className="rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
                  Upload FedEx Billing CSV
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
