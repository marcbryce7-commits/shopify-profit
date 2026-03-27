"use client";

import { useState, useCallback, Fragment, DragEvent } from "react";
import {
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Upload,
  Loader2,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApi, apiPost } from "@/hooks/use-api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ExtractedData {
  invoice?: string;
  supplier?: string;
  amount?: number;
  productCost?: number;
  shippingCost?: number;
  grandTotal?: number;
  order?: string;
  tracking?: string;
  confidence?: number;
  scanned?: number;
  found?: number;
  matched?: number;
  errors?: number;
  duration?: string;
  lineItems?: LineItem[];
}

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EmailLog {
  id: string;
  userId: string;
  emailSubject: string;
  sender: string;
  receivedAt: string;
  processedAt: string | null;
  status: string;
  extractedData: ExtractedData | null;
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

type CostField = "productCost" | "shippingCost" | "grandTotal";

interface CostOverrides {
  [emailLogId: string]: {
    productCost?: number;
    shippingCost?: number;
    grandTotal?: number;
  };
}

// ─── Draggable value chip ────────────────────────────────────────────────────

function DraggableAmount({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  const handleDragStart = (e: DragEvent<HTMLSpanElement>) => {
    e.dataTransfer.setData("text/plain", value.toString());
    e.dataTransfer.effectAllowed = "copy";
    (e.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (e: DragEvent<HTMLSpanElement>) => {
    (e.currentTarget as HTMLElement).style.opacity = "1";
  };

  return (
    <span
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="inline-flex items-center gap-1 bg-[#25252b] px-2 py-0.5 rounded text-sm cursor-grab active:cursor-grabbing select-none"
      title={label ? `Drag to reassign: ${label}` : "Drag to reassign"}
    >
      <GripVertical className="h-3 w-3 text-zinc-500 flex-shrink-0" />
      <span>${value.toFixed(2)}</span>
    </span>
  );
}

// ─── Cost drop zone input ────────────────────────────────────────────────────

function CostDropZone({
  label,
  value,
  edited,
  onDrop,
  onChange,
}: {
  label: string;
  value: number;
  edited: boolean;
  onDrop: (droppedValue: number) => void;
  onChange: (newValue: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const raw = e.dataTransfer.getData("text/plain");
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        onDrop(num);
      }
    },
    [onDrop]
  );

  const borderClass = dragOver
    ? "border-2 border-dashed border-[#73f08c]/50 bg-[#73f08c]/5"
    : edited
      ? "border border-amber-500/50 bg-amber-500/5"
      : "border border-zinc-700";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-md px-3 py-2 transition-colors ${borderClass}`}
    >
      <label className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
        {label}
        {edited && (
          <span className="ml-1 text-amber-500 normal-case tracking-normal">(edited)</span>
        )}
      </label>
      <div className="flex items-center gap-1">
        <span className="text-zinc-400">$</span>
        <input
          type="number"
          step="0.01"
          value={value.toFixed(2)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(v);
          }}
          className="w-full bg-transparent text-sm font-medium outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}

// ─── Invoice breakdown (expandable line items) ──────────────────────────────

function InvoiceBreakdown({ lineItems }: { lineItems: LineItem[] }) {
  if (!lineItems || lineItems.length === 0) return null;

  return (
    <div className="mt-3 rounded-md bg-zinc-900/50 p-3">
      <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
        Line Items
      </p>
      <div className="space-y-1.5">
        {lineItems.map((li, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs text-zinc-300"
          >
            <span className="truncate max-w-[200px]">
              {li.description}{" "}
              <span className="text-zinc-500">
                x{li.quantity} @ ${li.unitPrice.toFixed(2)}
              </span>
            </span>
            <DraggableAmount
              value={li.total}
              label={`Line item: ${li.description}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Expanded review row ─────────────────────────────────────────────────────

function ReviewRowExpanded({
  item,
  overrides,
  onOverride,
}: {
  item: EmailLog;
  overrides: CostOverrides[string] | undefined;
  onOverride: (field: CostField, value: number) => void;
}) {
  const ext = item.extractedData;
  const productCost = overrides?.productCost ?? ext?.productCost ?? 0;
  const shippingCost = overrides?.shippingCost ?? ext?.shippingCost ?? 0;
  const grandTotal =
    overrides?.grandTotal ?? ext?.grandTotal ?? ext?.amount ?? 0;

  return (
    <tr>
      <td colSpan={8} className="px-4 pb-4">
        <div className="rounded-lg bg-zinc-900/40 p-4">
          {/* Top summary row — draggable extracted values */}
          <div className="mb-4 grid grid-cols-5 gap-3 rounded-md bg-zinc-800/60 p-3 text-xs">
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Order/PO
              </span>
              <span className="text-zinc-200">{ext?.order ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Supplier
              </span>
              <span className="text-zinc-200">{ext?.supplier ?? item.sender}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Invoice #
              </span>
              <span className="text-zinc-200">{ext?.invoice ?? "—"}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Amount
              </span>
              {(ext?.amount ?? 0) > 0 ? (
                <DraggableAmount
                  value={ext?.amount ?? 0}
                  label="AI-extracted amount"
                />
              ) : (
                <span className="text-zinc-500">—</span>
              )}
            </div>
            <div>
              <span className="block text-[10px] uppercase tracking-wider text-zinc-500 mb-1">
                Tracking
              </span>
              <span className="text-zinc-200 text-[11px] break-all">
                {ext?.tracking ?? "—"}
              </span>
            </div>
          </div>

          {/* Cost drop zones */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <CostDropZone
              label="Product Cost"
              value={productCost}
              edited={overrides?.productCost != null}
              onDrop={(v) => onOverride("productCost", v)}
              onChange={(v) => onOverride("productCost", v)}
            />
            <CostDropZone
              label="Shipping Cost"
              value={shippingCost}
              edited={overrides?.shippingCost != null}
              onDrop={(v) => onOverride("shippingCost", v)}
              onChange={(v) => onOverride("shippingCost", v)}
            />
            <CostDropZone
              label="Invoice Total"
              value={grandTotal}
              edited={overrides?.grandTotal != null}
              onDrop={(v) => onOverride("grandTotal", v)}
              onChange={(v) => onOverride("grandTotal", v)}
            />
          </div>

          {/* AI-extracted cost chips (draggable sources) */}
          {(ext?.productCost || ext?.shippingCost || ext?.grandTotal) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="text-[10px] uppercase tracking-wider">
                AI Extracted:
              </span>
              {ext?.productCost != null && ext.productCost > 0 && (
                <span className="flex items-center gap-1">
                  Product{" "}
                  <DraggableAmount value={ext.productCost} label="AI product cost" />
                </span>
              )}
              {ext?.shippingCost != null && ext.shippingCost > 0 && (
                <span className="flex items-center gap-1">
                  Shipping{" "}
                  <DraggableAmount value={ext.shippingCost} label="AI shipping cost" />
                </span>
              )}
              {ext?.grandTotal != null && ext.grandTotal > 0 && (
                <span className="flex items-center gap-1">
                  Total{" "}
                  <DraggableAmount value={ext.grandTotal} label="AI grand total" />
                </span>
              )}
            </div>
          )}

          {/* Line items breakdown */}
          <InvoiceBreakdown lineItems={ext?.lineItems ?? []} />

          {/* Tip */}
          <p className="mt-3 text-[10px] text-zinc-600">
            Drag any dollar amount onto a cost field above to reassign it.
          </p>
        </div>
      </td>
    </tr>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ShippingPage() {
  const { data, loading, error, refetch } = useApi<ShippingResponse>("/api/shipping");
  const [autoScan, setAutoScan] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [costOverrides, setCostOverrides] = useState<CostOverrides>({});

  const toggleExpanded = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleOverride = useCallback(
    (emailLogId: string, field: CostField, value: number) => {
      setCostOverrides((prev) => ({
        ...prev,
        [emailLogId]: {
          ...prev[emailLogId],
          [field]: value,
        },
      }));
    },
    []
  );

  const handleRunAgent = async () => {
    setRunning(true);
    try {
      await apiPost("/api/shipping");
      toast.success("Shipping agent started successfully");
      refetch();
    } catch {
      toast.error("Failed to start shipping agent");
    } finally {
      setRunning(false);
    }
  };

  const handleApprove = async (item: EmailLog) => {
    try {
      const overrides = costOverrides[item.id];
      await apiPost("/api/shipping/approve", {
        emailLogId: item.id,
        type: "full",
        overrides: overrides
          ? {
              productCost: overrides.productCost,
              shippingCost: overrides.shippingCost,
              grandTotal: overrides.grandTotal,
            }
          : undefined,
      });
      toast.success("Invoice approved");
      refetch();
    } catch {
      toast.error("Failed to approve invoice");
    }
  };

  const handleReject = async (item: EmailLog) => {
    try {
      await apiPost("/api/shipping/reject", { emailLogId: item.id });
      toast.success("Invoice rejected");
      refetch();
    } catch {
      toast.error("Failed to reject invoice");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" onClick={refetch}>Retry</Button>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Agent</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            AI-powered shipping cost reconciliation from invoices and emails
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-scan">Auto-scan every 6h</Label>
            <Switch id="auto-scan" checked={autoScan} onCheckedChange={setAutoScan} />
          </div>
          <Button onClick={handleRunAgent} disabled={running}>
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Agent Now
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Email Connection
            </CardTitle>
            <Mail className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            {activeAccount ? (
              <>
                <Badge variant="success">Connected</Badge>
                <p className="mt-1 text-xs text-zinc-500">{activeAccount.emailAddress}</p>
              </>
            ) : (
              <Badge variant="outline">Not Connected</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Last Scan
            </CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatTimeAgo(activeAccount?.lastScannedAt ?? null)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Matched
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{matchedCount} invoices matched</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Pending Review
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{pendingReview.length} need approval</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="review">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="review">Review Queue</TabsTrigger>
              <TabsTrigger value="history">Processing History</TabsTrigger>
              <TabsTrigger value="upload">Manual Upload</TabsTrigger>
              <TabsTrigger value="fedex">FedEx</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="review" className="mt-0">
              {selectedItems.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                  <span className="text-sm font-medium">
                    {selectedItems.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Approve All
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject All
                    </Button>
                  </div>
                </div>
              )}
              {pendingReview.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  No invoices pending review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="w-12 pb-3"></th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Invoice #
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Supplier
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                          Amount
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Matched Order
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Confidence
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                          Actions
                        </th>
                        <th className="w-10 pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReview.map((item) => {
                        const ext = item.extractedData;
                        const confidence = ext?.confidence ?? 0;
                        const isExpanded = expandedRows.has(item.id);
                        const displayAmount =
                          costOverrides[item.id]?.grandTotal ??
                          ext?.grandTotal ??
                          ext?.amount ??
                          0;
                        const hasOverrides = !!costOverrides[item.id];

                        return (
                          <Fragment key={item.id}>
                            <tr
                              className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 cursor-pointer"
                              onClick={() => toggleExpanded(item.id)}
                            >
                              <td className="py-3" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={selectedItems.includes(item.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedItems([...selectedItems, item.id]);
                                    } else {
                                      setSelectedItems(
                                        selectedItems.filter((id) => id !== item.id)
                                      );
                                    }
                                  }}
                                />
                              </td>
                              <td className="py-3 text-sm">
                                {ext?.invoice ?? item.emailSubject}
                              </td>
                              <td className="py-3 text-sm">
                                {ext?.supplier ?? item.sender}
                              </td>
                              <td className="py-3 text-right text-sm">
                                <DraggableAmount
                                  value={displayAmount}
                                  label="Row amount"
                                />
                                {hasOverrides && (
                                  <span className="ml-1 text-[10px] text-amber-500">*</span>
                                )}
                              </td>
                              <td className="py-3 text-sm text-blue-600">
                                {ext?.order ?? "\u2014"}
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                    <div
                                      className={`h-full ${
                                        confidence > 80
                                          ? "bg-green-600"
                                          : confidence > 50
                                            ? "bg-yellow-500"
                                            : "bg-red-600"
                                      }`}
                                      style={{ width: `${confidence}%` }}
                                    />
                                  </div>
                                  <span className="text-xs">{confidence}%</span>
                                </div>
                              </td>
                              <td
                                className="py-3 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleApprove(item)}
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReject(item)}
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <ReviewRowExpanded
                                item={item}
                                overrides={costOverrides[item.id]}
                                onOverride={(field, value) =>
                                  handleOverride(item.id, field, value)
                                }
                              />
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {recentHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  No processing history yet.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">Date</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Emails Scanned
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Invoices Found
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Matched
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Errors
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHistory.map((run) => {
                      const ext = run.extractedData;
                      return (
                        <tr
                          key={run.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        >
                          <td className="py-3 text-sm">
                            {new Date(run.processedAt ?? run.receivedAt).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-sm">{ext?.scanned ?? 0}</td>
                          <td className="py-3 text-right text-sm">{ext?.found ?? 0}</td>
                          <td className="py-3 text-right text-sm">{ext?.matched ?? 0}</td>
                          <td
                            className={`py-3 text-right text-sm ${
                              (ext?.errors ?? 0) > 0 ? "text-red-600" : ""
                            }`}
                          >
                            {ext?.errors ?? 0}
                          </td>
                          <td className="py-3 text-right text-sm">{ext?.duration ?? "\u2014"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Upload className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                  <div>
                    <p className="font-medium">Drop a PDF or CSV invoice here</p>
                    <p className="text-sm text-zinc-500">
                      Supported: PDF, CSV (FedEx billing format)
                    </p>
                  </div>
                  <Button>Choose File</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fedex" className="mt-0">
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Limitation notice:</strong> FedEx public APIs do not expose
                    actual billed amounts or post-shipment adjustments. Use the email
                    agent or upload FedEx billing CSV for 100% accuracy.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button>Connect FedEx Account</Button>
                  <Button variant="outline">Upload FedEx Billing CSV</Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

