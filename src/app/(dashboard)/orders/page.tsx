"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, Search, Filter, Loader2, Plus, AlertCircle, Package, Truck, X, CheckCircle, ArrowRight } from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface Order {
  id: string;
  storeId: string;
  shopifyOrderId: string;
  orderNumber: string;
  orderDate: string;
  subtotal: number;
  totalTax: number;
  shippingCharged: number;
  actualShippingCost: number;
  transactionFee: number;
  totalCogs: number;
  customCostsTotal: number;
  netProfit: number;
  customerEmail: string;
  customerName: string;
  financialStatus: string;
  fulfillmentStatus: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
}

interface StoresResponse {
  stores: { id: string; name: string }[];
}

interface ShippingValidation {
  orderId: string;
  orderNumber: string;
  shippingCharged: number;
  actualCost: number;
  costSource: string;
  variance: number;
  variancePercent: number;
  profitable: boolean;
  invoiceMatches: Array<{
    id: string;
    source: string;
    amount: number;
    invoiceNumber: string;
    supplierName: string;
    approved: boolean;
  }>;
  fedexData: {
    trackingNumber: string;
    status: string;
    estimatedCost: number | null;
    actualBilled: number | null;
  } | null;
}

interface FulfillmentEntry {
  orderId: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
  carrier: string;
  notifyCustomer: boolean;
  validation: ShippingValidation | null;
  validating: boolean;
  fulfilling: boolean;
  fulfilled: boolean;
  error: string | null;
}

const LIMIT = 25;
const CARRIERS = [
  { value: "fedex", label: "FedEx" },
  { value: "ups", label: "UPS" },
  { value: "usps", label: "USPS" },
  { value: "dhl", label: "DHL" },
  { value: "other", label: "Other" },
];

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatCurrency(value: number | string | null | undefined): string {
  if (value == null) return "$0.00";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getInitials(name: string): string {
  if (!name) return "G";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getFulfillmentStyle(status: string): { bg: string; text: string; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "fulfilled" || s === "paid") {
    return { bg: "bg-tertiary-dim/15", text: "text-tertiary-dim", label: formatStatus(status) };
  }
  if (s === "cancelled" || s === "refunded" || s === "voided" || s === "partially_refunded") {
    return { bg: "bg-error/15", text: "text-error", label: formatStatus(status) };
  }
  return { bg: "bg-on-surface-variant/10", text: "text-on-surface-variant", label: formatStatus(status || "pending") };
}

function hasAlert(order: Order): boolean {
  const s = (order.financialStatus || "").toLowerCase();
  return s === "refunded" || s === "voided" || s === "partially_refunded";
}

function isUnfulfilled(order: Order): boolean {
  const s = (order.fulfillmentStatus || "").toLowerCase();
  return s !== "fulfilled" && s !== "cancelled";
}

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFulfillPanel, setShowFulfillPanel] = useState(false);
  const [fulfillmentEntries, setFulfillmentEntries] = useState<FulfillmentEntry[]>([]);

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, storeFilter, statusFilter]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(LIMIT));
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (storeFilter !== "all") params.set("storeId", storeFilter);
    return params.toString();
  }, [page, debouncedSearch, statusFilter, storeFilter]);

  const { data, loading, error, refetch } = useApi<OrdersResponse>(`/api/orders?${queryString}`);
  const { data: storesData } = useApi<StoresResponse>("/api/stores");

  const ordersList = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);
  const storesList = storesData?.stores ?? [];

  const unfulfilledOrders = ordersList.filter(isUnfulfilled);
  const allUnfulfilledSelected = unfulfilledOrders.length > 0 && unfulfilledOrders.every((o) => selectedIds.has(o.id));

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allUnfulfilledSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unfulfilledOrders.map((o) => o.id)));
    }
  };

  // Open fulfillment panel
  const openFulfillPanel = () => {
    const selected = ordersList.filter((o) => selectedIds.has(o.id));
    setFulfillmentEntries(
      selected.map((o) => ({
        orderId: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName || "Guest",
        trackingNumber: "",
        carrier: "usps",
        notifyCustomer: true,
        validation: null,
        validating: false,
        fulfilling: false,
        fulfilled: false,
        error: null,
      }))
    );
    setShowFulfillPanel(true);
  };

  // Validate shipping cost for an entry
  const validateShipping = useCallback(async (index: number) => {
    const entry = fulfillmentEntries[index];
    if (!entry.trackingNumber) return;

    setFulfillmentEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, validating: true, error: null } : e))
    );

    try {
      const res = await fetch("/api/orders/validate-shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: entry.orderId,
          trackingNumber: entry.trackingNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Validation failed");

      setFulfillmentEntries((prev) =>
        prev.map((e, i) =>
          i === index ? { ...e, validation: data, validating: false } : e
        )
      );
    } catch (err) {
      setFulfillmentEntries((prev) =>
        prev.map((e, i) =>
          i === index
            ? { ...e, validating: false, error: err instanceof Error ? err.message : "Validation failed" }
            : e
        )
      );
    }
  }, [fulfillmentEntries]);

  // Fulfill a single order
  const fulfillOrder = async (index: number) => {
    const entry = fulfillmentEntries[index];
    if (!entry.trackingNumber || !entry.carrier) return;

    setFulfillmentEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, fulfilling: true, error: null } : e))
    );

    try {
      const res = await fetch("/api/orders/fulfill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: entry.orderId,
          trackingNumber: entry.trackingNumber,
          carrier: entry.carrier,
          notifyCustomer: entry.notifyCustomer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fulfillment failed");

      setFulfillmentEntries((prev) =>
        prev.map((e, i) =>
          i === index ? { ...e, fulfilling: false, fulfilled: true } : e
        )
      );

      // Remove from selection
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.orderId);
        return next;
      });
    } catch (err) {
      setFulfillmentEntries((prev) =>
        prev.map((e, i) =>
          i === index
            ? { ...e, fulfilling: false, error: err instanceof Error ? err.message : "Fulfillment failed" }
            : e
        )
      );
    }
  };

  // Fulfill all entries
  const fulfillAll = async () => {
    for (let i = 0; i < fulfillmentEntries.length; i++) {
      if (!fulfillmentEntries[i].fulfilled && fulfillmentEntries[i].trackingNumber) {
        await fulfillOrder(i);
      }
    }
    refetch();
  };

  // Update an entry field
  const updateEntry = (index: number, field: keyof FulfillmentEntry, value: string | boolean) => {
    setFulfillmentEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  };

  // Close panel
  const closeFulfillPanel = () => {
    setShowFulfillPanel(false);
    setFulfillmentEntries([]);
    refetch();
  };

  // Stats
  const avgOrderValue = ordersList.length > 0
    ? ordersList.reduce((sum, o) => sum + (o.subtotal ?? 0), 0) / ordersList.length
    : 0;
  const totalNetProfit = ordersList.reduce((sum, o) => sum + (o.netProfit ?? 0), 0);
  const refundCount = ordersList.filter((o) => {
    const s = (o.financialStatus || "").toLowerCase();
    return s === "refunded" || s === "partially_refunded";
  }).length;
  const refundRate = ordersList.length > 0 ? (refundCount / ordersList.length) * 100 : 0;
  const avgLtv = avgOrderValue * 1.8;

  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const allFulfilled = fulfillmentEntries.length > 0 && fulfillmentEntries.every((e) => e.fulfilled);
  const readyToFulfill = fulfillmentEntries.filter((e) => !e.fulfilled && e.trackingNumber).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface">Orders</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            All orders across your connected stores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={openFulfillPanel}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold text-[#0e0e10] transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #73f08c 0%, #3ecf8e 100%)" }}
            >
              <Truck className="h-4 w-4" />
              Fulfill {selectedIds.size} Order{selectedIds.size !== 1 ? "s" : ""}
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search by order #, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-outline-variant/10 bg-surface-container-low pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="h-10 w-44 appearance-none rounded-lg border border-outline-variant/10 bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All stores</option>
          {storesList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 w-40 appearance-none rounded-lg border border-outline-variant/10 bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="authorized">Authorized</option>
          <option value="partially_paid">Partially Paid</option>
          <option value="partially_refunded">Partially Refunded</option>
          <option value="refunded">Refunded</option>
          <option value="voided">Voided</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-xl bg-surface-container-low">
        {error ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-error">
            <AlertCircle className="h-4 w-4" />
            Failed to load orders: {error}
          </div>
        ) : loading && ordersList.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
          </div>
        ) : ordersList.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">
            No orders found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-high/50">
                    <th className="w-10 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={allUnfulfilledSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-outline-variant accent-[#73f08c]"
                        title="Select all unfulfilled"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Order #
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Revenue
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Ship Charged
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Ship Actual
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Net Profit
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Fulfillment
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {ordersList.map((order) => {
                    const fulfillment = getFulfillmentStyle(order.financialStatus);
                    const fulfillmentBadge = getFulfillmentStyle(order.fulfillmentStatus || "unfulfilled");
                    const showAlert = hasAlert(order);
                    const initials = getInitials(order.customerName);
                    const canSelect = isUnfulfilled(order);
                    const isSelected = selectedIds.has(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors hover:bg-surface-container-high/30 ${isSelected ? "bg-[#73f08c]/5" : ""}`}
                      >
                        <td className="w-10 px-3 py-3.5">
                          {canSelect ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(order.id)}
                              className="h-4 w-4 rounded border-outline-variant accent-[#73f08c]"
                            />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            {showAlert && (
                              <span className="inline-block h-2 w-2 rounded-full bg-error" />
                            )}
                            <span className="text-sm font-medium text-on-surface">
                              #{order.orderNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-on-surface-variant">
                          {formatDate(order.orderDate)}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-on-surface">
                                {order.customerName || "Guest"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-on-surface">
                          {formatCurrency(order.subtotal)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                          {formatCurrency(order.shippingCharged)}
                        </td>
                        <td className={`px-4 py-3.5 text-right text-sm ${
                          order.actualShippingCost > 0
                            ? order.actualShippingCost <= order.shippingCharged
                              ? "text-tertiary-dim font-medium"
                              : "text-error font-medium"
                            : "text-on-surface-variant/40"
                        }`}>
                          {order.actualShippingCost > 0 ? formatCurrency(order.actualShippingCost) : "—"}
                        </td>
                        <td className={`px-4 py-3.5 text-right text-sm font-bold ${
                          order.netProfit >= 0 ? "text-tertiary-dim" : "text-error"
                        }`}>
                          {formatCurrency(order.netProfit)}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${fulfillmentBadge.bg} ${fulfillmentBadge.text}`}>
                            {fulfillmentBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${fulfillment.bg} ${fulfillment.text}`}>
                            {fulfillment.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-outline-variant/5 px-4 py-3">
              <span className="text-sm text-on-surface-variant">
                Showing {showingFrom}-{showingTo} of {total.toLocaleString()} orders
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                {pageNumbers.map((p, i) =>
                  p === "..." ? (
                    <span key={`dots-${i}`} className="px-2 text-sm text-on-surface-variant">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
                        page === p
                          ? "bg-primary text-on-primary"
                          : "text-on-surface-variant hover:bg-surface-container-high/50"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg px-3 py-1.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high/50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Avg Order Value</div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">{formatCurrency(avgOrderValue)}</div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Total Net Profit</div>
          <div className={`mt-2 text-2xl font-extrabold ${totalNetProfit >= 0 ? "text-tertiary-dim" : "text-error"}`}>
            {formatCurrency(totalNetProfit)}
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Refund Rate</div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">{refundRate.toFixed(1)}%</div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">Customer LTV</div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">{formatCurrency(avgLtv)}</div>
        </div>
      </div>

      {/* ── Fulfillment Slide-Over Panel ── */}
      {showFulfillPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={closeFulfillPanel} />

          {/* Panel */}
          <div className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-[#0e0e10] border-l border-outline-variant/10 shadow-2xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#73f08c]/10">
                  <Truck className="h-5 w-5 text-[#73f08c]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-on-surface">Fulfill Orders</h2>
                  <p className="text-xs text-on-surface-variant">
                    {fulfillmentEntries.length} order{fulfillmentEntries.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
              </div>
              <button
                onClick={closeFulfillPanel}
                className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {fulfillmentEntries.map((entry, idx) => (
                <div
                  key={entry.orderId}
                  className={`rounded-xl border p-5 space-y-4 ${
                    entry.fulfilled
                      ? "border-[#73f08c]/20 bg-[#73f08c]/5"
                      : "border-outline-variant/10 bg-surface-container-low"
                  }`}
                >
                  {/* Order header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-on-surface-variant" />
                      <span className="text-sm font-bold text-on-surface">#{entry.orderNumber}</span>
                      <span className="text-xs text-on-surface-variant">{entry.customerName}</span>
                    </div>
                    {entry.fulfilled && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#73f08c]">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Fulfilled
                      </span>
                    )}
                  </div>

                  {!entry.fulfilled && (
                    <>
                      {/* Tracking + Carrier row */}
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3 space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                            Tracking Number
                          </label>
                          <input
                            type="text"
                            value={entry.trackingNumber}
                            onChange={(e) => updateEntry(idx, "trackingNumber", e.target.value)}
                            onBlur={() => validateShipping(idx)}
                            placeholder="Enter tracking #"
                            className="w-full rounded-lg bg-[#25252b] border-none px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-[#73f08c]/50"
                          />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">
                            Carrier
                          </label>
                          <select
                            value={entry.carrier}
                            onChange={(e) => updateEntry(idx, "carrier", e.target.value)}
                            className="w-full rounded-lg bg-[#25252b] border-none px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-[#73f08c]/50"
                          >
                            {CARRIERS.map((c) => (
                              <option key={c.value} value={c.value}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* AI Cost Validation */}
                      {entry.validating && (
                        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Checking shipping costs...
                        </div>
                      )}

                      {entry.validation && (
                        <div className="rounded-lg bg-[#19191d] border border-outline-variant/5 p-4 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                            <Truck className="h-3.5 w-3.5" />
                            AI Cost Check
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Charged</div>
                              <div className="text-sm font-bold text-on-surface">
                                {formatCurrency(entry.validation.shippingCharged)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Actual</div>
                              <div className="text-sm font-bold text-on-surface">
                                {formatCurrency(entry.validation.actualCost)}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-on-surface-variant uppercase tracking-wider">Variance</div>
                              <div className={`text-sm font-bold ${entry.validation.profitable ? "text-[#73f08c]" : "text-error"}`}>
                                {entry.validation.variance >= 0 ? "+" : ""}
                                {formatCurrency(entry.validation.variance)}
                              </div>
                            </div>
                          </div>
                          {entry.validation.costSource !== "none" && (
                            <div className="text-[10px] text-on-surface-variant">
                              Source: <span className="font-medium text-on-surface">{entry.validation.costSource}</span>
                              {entry.validation.invoiceMatches.length > 0 && (
                                <span> — Invoice #{entry.validation.invoiceMatches[0].invoiceNumber} from {entry.validation.invoiceMatches[0].supplierName}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Notify customer toggle */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-on-surface-variant">Notify customer via email</span>
                        <button
                          onClick={() => updateEntry(idx, "notifyCustomer", !entry.notifyCustomer)}
                          className={`relative h-5 w-9 rounded-full transition-colors ${
                            entry.notifyCustomer ? "bg-[#73f08c]" : "bg-[#47474e]"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                              entry.notifyCustomer ? "translate-x-4" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Error */}
                      {entry.error && (
                        <div className="flex items-center gap-2 text-xs text-error">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {entry.error}
                        </div>
                      )}

                      {/* Fulfill button */}
                      <button
                        onClick={() => fulfillOrder(idx)}
                        disabled={!entry.trackingNumber || entry.fulfilling}
                        className="w-full rounded-lg py-2.5 text-sm font-bold text-[#0e0e10] transition-all hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100"
                        style={{ background: "linear-gradient(135deg, #73f08c 0%, #3ecf8e 100%)" }}
                      >
                        {entry.fulfilling ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Fulfilling...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Fulfill Order
                          </span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-outline-variant/10 px-6 py-4">
              {allFulfilled ? (
                <button
                  onClick={closeFulfillPanel}
                  className="w-full rounded-lg bg-surface-container-high py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-variant"
                >
                  Done — Close Panel
                </button>
              ) : (
                <button
                  onClick={fulfillAll}
                  disabled={readyToFulfill === 0}
                  className="w-full rounded-lg py-3 text-sm font-bold text-[#0e0e10] transition-all hover:scale-[1.01] disabled:opacity-40 disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #73f08c 0%, #3ecf8e 100%)" }}
                >
                  Fulfill All {readyToFulfill} Order{readyToFulfill !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
