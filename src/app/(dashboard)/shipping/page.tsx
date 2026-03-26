"use client";

import { useState } from "react";
import { Mail, Clock, CheckCircle, AlertCircle, Play, Upload, Loader2, Plus, Trash2, ExternalLink, Pencil, Truck, DollarSign } from "lucide-react";
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

type ApprovalType = "full" | "tracking_only" | "cost_only";

interface CostOverrides {
  [logId: string]: {
    productCost?: string;
    shippingCost?: string;
    grandTotal?: string;
  };
}

interface EditingState {
  [logId: string]: {
    productCost?: boolean;
    shippingCost?: boolean;
    grandTotal?: boolean;
  };
}

export default function ShippingPage() {
  const { data, loading, error, refetch } = useApi<ShippingResponse>("/api/shipping");
  const [autoScan, setAutoScan] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"review" | "history" | "upload" | "settings">("review");

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [costOverrides, setCostOverrides] = useState<CostOverrides>({});
  const [editingFields, setEditingFields] = useState<EditingState>({});

  const setOverride = (logId: string, field: "productCost" | "shippingCost" | "grandTotal", value: string) => {
    setCostOverrides((prev) => ({
      ...prev,
      [logId]: { ...prev[logId], [field]: value },
    }));
  };

  const setEditing = (logId: string, field: "productCost" | "shippingCost" | "grandTotal", editing: boolean) => {
    setEditingFields((prev) => ({
      ...prev,
      [logId]: { ...prev[logId], [field]: editing },
    }));
  };

  const buildOverridesPayload = (logId: string, ext: Record<string, unknown> | null) => {
    const ov = costOverrides[logId];
    if (!ov) return undefined;

    const overrides: { productCost?: number; shippingCost?: number; grandTotal?: number } = {};
    let hasOverride = false;

    if (ov.productCost !== undefined) {
      const parsed = parseFloat(ov.productCost);
      if (!isNaN(parsed) && parsed !== Number(ext?.productCost ?? 0)) {
        overrides.productCost = parsed;
        hasOverride = true;
      }
    }
    if (ov.shippingCost !== undefined) {
      const parsed = parseFloat(ov.shippingCost);
      if (!isNaN(parsed) && parsed !== Number(ext?.shippingCost ?? 0)) {
        overrides.shippingCost = parsed;
        hasOverride = true;
      }
    }
    if (ov.grandTotal !== undefined) {
      const parsed = parseFloat(ov.grandTotal);
      if (!isNaN(parsed) && parsed !== Number(ext?.grandTotal ?? 0)) {
        overrides.grandTotal = parsed;
        hasOverride = true;
      }
    }

    return hasOverride ? overrides : undefined;
  };

  const handleApprove = async (logId: string, type: ApprovalType, ext: Record<string, unknown> | null) => {
    setApprovingId(logId);
    try {
      const overrides = buildOverridesPayload(logId, ext);
      const body: { logId: string; type: ApprovalType; overrides?: { productCost?: number; shippingCost?: number; grandTotal?: number } } = { logId, type };
      if (overrides) body.overrides = overrides;

      await apiPost("/api/shipping/approve", body);

      const messages: Record<ApprovalType, string> = {
        full: "Fully approved — tracking & costs updated",
        tracking_only: "Tracking approved — still needs cost data",
        cost_only: "Costs approved — still needs shipping/tracking",
      };
      toast.success(messages[type]);
      refetch();
    } catch {
      toast.error("Failed to approve invoice");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (logId: string) => {
    try {
      await apiPost("/api/shipping/reject", { logId });
      toast.success("Invoice rejected");
      refetch();
    } catch {
      toast.error("Failed to reject invoice");
    }
  };

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

  // Filter review items: skip cards with no pricing AND no tracking
  const filteredReview = pendingReview.filter((item) => {
    const ext = item.extractedData as Record<string, unknown> | null;
    const tracking = ext?.tracking as string | null;
    const productCost = Number(ext?.productCost ?? 0);
    const shippingCost = Number(ext?.shippingCost ?? 0);
    const grandTotal = Number(ext?.grandTotal ?? 0);
    const amount = Number(ext?.amount ?? 0);
    const hasPricing = productCost > 0 || shippingCost > 0 || grandTotal > 0 || amount > 0;
    const hasTracking = !!tracking;
    return hasPricing || hasTracking;
  });

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
          <div className="mt-3 text-lg font-semibold text-on-surface">{filteredReview.length} need approval</div>
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
              {filteredReview.length === 0 ? (
                <div className="py-12 text-center text-sm text-on-surface-variant">
                  No invoices pending review. Click &quot;Run Agent Now&quot; to scan your emails.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReview.map((item) => {
                    const ext = item.extractedData as Record<string, unknown> | null;
                    const confidence = Number(ext?.confidence ?? 0);
                    const emailLink = ext?.emailLink as string | null;
                    const snippet = ext?.snippet as string | null;
                    const orderRef = ext?.order as string | null;
                    const tracking = ext?.tracking as string | null;
                    const amount = Number(ext?.amount ?? 0);
                    const supplier = (ext?.supplier as string) || item.sender;
                    const invoice = ext?.invoice as string | null;
                    const amountContext = ext?.amountContext as string | null;
                    const matchMethod = ext?.matchMethod as string | null;
                    const productCost = Number(ext?.productCost ?? 0);
                    const shippingCost = Number(ext?.shippingCost ?? 0);
                    const grandTotal = Number(ext?.grandTotal ?? 0);

                    const hasPricing = productCost > 0 || shippingCost > 0 || grandTotal > 0 || amount > 0;
                    const hasTracking = !!tracking;

                    // Status badges for partially approved items
                    const status = item.status;
                    const isTrackingApproved = status === "tracking_approved";
                    const isCostApproved = status === "cost_approved";

                    // Current override values (fallback to extracted)
                    const ov = costOverrides[item.id];
                    const displayProductCost = ov?.productCost !== undefined ? ov.productCost : (productCost > 0 ? productCost.toFixed(2) : "");
                    const displayShippingCost = ov?.shippingCost !== undefined ? ov.shippingCost : (shippingCost > 0 ? shippingCost.toFixed(2) : "");
                    const displayGrandTotal = ov?.grandTotal !== undefined ? ov.grandTotal : (grandTotal > 0 ? grandTotal.toFixed(2) : "");

                    const editing = editingFields[item.id];

                    return (
                      <div key={item.id} className="rounded-lg bg-[#19191d] border border-[#47474e]/30 p-4">
                        {/* Status badge for partial approvals */}
                        {(isTrackingApproved || isCostApproved) && (
                          <div className="mb-3">
                            {isTrackingApproved && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-semibold text-blue-400">
                                <Truck className="h-3 w-3" />
                                Tracking &#10003; &mdash; Costs Needed
                              </span>
                            )}
                            {isCostApproved && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[11px] font-semibold text-amber-400">
                                <DollarSign className="h-3 w-3" />
                                Costs &#10003; &mdash; Shipping Needed
                              </span>
                            )}
                          </div>
                        )}

                        {/* Top row: subject + link */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-[#e7e4ec] truncate">
                                {item.emailSubject || "No subject"}
                              </h4>
                              {emailLink && (
                                <a
                                  href={emailLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 text-primary hover:text-primary-dim"
                                  title="View original email"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                            <p className="text-xs text-[#acaab1] mt-0.5">
                              From: {item.sender} &middot; {new Date(item.receivedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-16 overflow-hidden rounded-full bg-[#25252b]">
                                <div
                                  className={`h-full rounded-full ${
                                    confidence > 80 ? "bg-[#73f08c]" : confidence > 50 ? "bg-yellow-500" : "bg-[#ee7d77]"
                                  }`}
                                  style={{ width: `${confidence}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-[#75757c]">{confidence}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Snippet */}
                        {snippet && (
                          <p className="mt-2 text-xs text-[#acaab1]/70 line-clamp-2 bg-[#131316] rounded px-2 py-1.5">
                            {snippet}
                          </p>
                        )}

                        {/* Extracted data grid */}
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75757c]">Order/PO</span>
                            <p className="text-sm font-medium text-[#e7e4ec] mt-0.5">{orderRef || "\u2014"}</p>
                            {matchMethod && (
                              <span className="text-[10px] text-[#73f08c]">Matched by: {matchMethod}</span>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75757c]">Supplier</span>
                            <p className="text-sm text-[#e7e4ec] mt-0.5">{supplier}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75757c]">Invoice #</span>
                            <p className="text-sm text-[#e7e4ec] mt-0.5">{invoice || "\u2014"}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#75757c]">Tracking</span>
                            <p className="text-sm text-[#e7e4ec] mt-0.5 truncate">{tracking || "\u2014"}</p>
                          </div>
                        </div>

                        {/* Cost breakdown — editable fields */}
                        {(hasPricing || isTrackingApproved || isCostApproved) && (
                          <div className="mt-3 grid grid-cols-3 gap-3 rounded-lg bg-[#131316] p-3">
                            {/* Product Cost */}
                            <EditableCostField
                              label="Product Cost"
                              value={displayProductCost}
                              isEditing={!!editing?.productCost}
                              onStartEdit={() => {
                                setEditing(item.id, "productCost", true);
                                if (ov?.productCost === undefined && productCost > 0) {
                                  setOverride(item.id, "productCost", productCost.toFixed(2));
                                }
                              }}
                              onStopEdit={() => setEditing(item.id, "productCost", false)}
                              onChange={(val) => setOverride(item.id, "productCost", val)}
                              hasOverride={ov?.productCost !== undefined && parseFloat(ov.productCost) !== productCost}
                            />
                            {/* Shipping Cost */}
                            <EditableCostField
                              label="Shipping Cost"
                              value={displayShippingCost}
                              isEditing={!!editing?.shippingCost}
                              onStartEdit={() => {
                                setEditing(item.id, "shippingCost", true);
                                if (ov?.shippingCost === undefined && shippingCost > 0) {
                                  setOverride(item.id, "shippingCost", shippingCost.toFixed(2));
                                }
                              }}
                              onStopEdit={() => setEditing(item.id, "shippingCost", false)}
                              onChange={(val) => setOverride(item.id, "shippingCost", val)}
                              hasOverride={ov?.shippingCost !== undefined && parseFloat(ov.shippingCost) !== shippingCost}
                            />
                            {/* Grand Total */}
                            <EditableCostField
                              label="Invoice Total"
                              value={displayGrandTotal}
                              isEditing={!!editing?.grandTotal}
                              onStartEdit={() => {
                                setEditing(item.id, "grandTotal", true);
                                if (ov?.grandTotal === undefined && grandTotal > 0) {
                                  setOverride(item.id, "grandTotal", grandTotal.toFixed(2));
                                }
                              }}
                              onStopEdit={() => setEditing(item.id, "grandTotal", false)}
                              onChange={(val) => setOverride(item.id, "grandTotal", val)}
                              hasOverride={ov?.grandTotal !== undefined && parseFloat(ov.grandTotal) !== grandTotal}
                            />
                          </div>
                        )}

                        {/* AI Reasoning */}
                        {amountContext && (
                          <details className="mt-3 group">
                            <summary className="cursor-pointer text-[11px] font-semibold text-primary hover:text-primary-dim select-none">
                              View AI reasoning
                            </summary>
                            <div className="mt-2 rounded-lg bg-[#0e0e10] border border-[#47474e]/30 px-3 py-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#75757c] mb-1">
                                Amount found in context:
                              </p>
                              <p className="text-xs text-[#e7e4ec] font-mono leading-relaxed">
                                &quot;...{amountContext}...&quot;
                              </p>
                            </div>
                          </details>
                        )}

                        {/* Actions — smart button visibility */}
                        <div className="mt-3 flex items-center justify-end gap-2 flex-wrap">
                          {/* Reject — always visible */}
                          <button
                            onClick={() => handleReject(item.id)}
                            className="rounded-lg border border-[#47474e]/50 bg-[#1f1f24] px-3 py-1.5 text-xs font-medium text-[#acaab1] transition-colors hover:bg-[#25252b] hover:text-[#ee7d77] hover:border-[#ee7d77]/30"
                          >
                            Reject
                          </button>

                          {/* Cost Only — when pricing exists but no tracking */}
                          {hasPricing && !hasTracking && (
                            <button
                              onClick={() => handleApprove(item.id, "cost_only", ext)}
                              disabled={approvingId === item.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-colors hover:bg-amber-500/25 disabled:opacity-50"
                            >
                              <DollarSign className="h-3 w-3" />
                              {approvingId === item.id ? "Approving..." : "Cost Only"}
                            </button>
                          )}

                          {/* Tracking Only — when tracking exists but no pricing */}
                          {hasTracking && !hasPricing && (
                            <button
                              onClick={() => handleApprove(item.id, "tracking_only", ext)}
                              disabled={approvingId === item.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/25 disabled:opacity-50"
                            >
                              <Truck className="h-3 w-3" />
                              {approvingId === item.id ? "Approving..." : "Tracking Only"}
                            </button>
                          )}

                          {/* Approve All — when both tracking AND pricing exist */}
                          {hasTracking && hasPricing && (
                            <button
                              onClick={() => handleApprove(item.id, "full", ext)}
                              disabled={approvingId === item.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[#73f08c]/15 px-3 py-1.5 text-xs font-semibold text-[#73f08c] transition-colors hover:bg-[#73f08c]/25 disabled:opacity-50"
                            >
                              <CheckCircle className="h-3 w-3" />
                              {approvingId === item.id ? "Approving..." : "Approve All"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

/* ── Editable Cost Field Component ────────────────────────────────────── */

function EditableCostField({
  label,
  value,
  isEditing,
  onStartEdit,
  onStopEdit,
  onChange,
  hasOverride,
}: {
  label: string;
  value: string;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onChange: (val: string) => void;
  hasOverride: boolean;
}) {
  const displayValue = value ? `$${parseFloat(value).toFixed(2)}` : "\u2014";
  const isModified = hasOverride;

  if (isEditing) {
    return (
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#75757c]">{label}</span>
        <div className="mt-0.5 flex items-center gap-1">
          <span className="text-sm text-[#75757c]">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onStopEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "Escape") onStopEdit();
            }}
            className="w-full rounded bg-[#0e0e10] border border-[#47474e] px-2 py-1 text-sm font-semibold text-[#e7e4ec] outline-none focus:border-primary transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#75757c]">{label}</span>
      <button
        onClick={onStartEdit}
        className="group mt-0.5 flex w-full items-center gap-1.5 text-left"
        title="Click to edit"
      >
        <p className={`text-sm font-semibold ${isModified ? "text-amber-400" : "text-[#e7e4ec]"}`}>
          {displayValue}
        </p>
        <Pencil className="h-3 w-3 text-[#75757c] opacity-0 group-hover:opacity-100 transition-opacity" />
        {isModified && (
          <span className="text-[9px] font-medium text-amber-400/70">edited</span>
        )}
      </button>
    </div>
  );
}
