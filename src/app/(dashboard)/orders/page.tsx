"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Download,
  Search,
  Loader2,
  Package,
  Truck,
  X,
  Check,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi, apiPost } from "@/hooks/use-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface ValidationResult {
  matched: boolean;
  shippingCharged: number;
  actualCost: number | null;
  variance: number | null;
}

interface FulfillmentEntry {
  orderId: string;
  trackingNumber: string;
  carrier: string;
  validation: ValidationResult | null;
  validating: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIMIT = 25;
const CARRIERS = ["FedEx", "UPS", "USPS", "DHL", "Other"] as const;

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "$0.00";
  return `$${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadgeVariant(
  status: string
): "success" | "warning" | "destructive" | "default" {
  const s = status.toLowerCase();
  if (s === "paid") return "success";
  if (s === "pending" || s === "authorized" || s === "partially_paid")
    return "warning";
  if (s === "refunded" || s === "voided" || s === "partially_refunded")
    return "destructive";
  return "default";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
        type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {type === "success" ? (
        <Check className="h-4 w-4" />
      ) : (
        <X className="h-4 w-4" />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fulfillment Panel
// ---------------------------------------------------------------------------

function FulfillmentPanel({
  orders,
  onClose,
  onFulfilled,
}: {
  orders: Order[];
  onClose: () => void;
  onFulfilled: (fulfilledIds: string[]) => void;
}) {
  const [entries, setEntries] = useState<FulfillmentEntry[]>(() =>
    orders.map((o) => ({
      orderId: o.id,
      trackingNumber: "",
      carrier: "USPS",
      validation: null,
      validating: false,
    }))
  );
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [fulfilling, setFulfilling] = useState(false);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup debounce timers
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const updateEntry = useCallback(
    (orderId: string, patch: Partial<FulfillmentEntry>) => {
      setEntries((prev) =>
        prev.map((e) => (e.orderId === orderId ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const handleTrackingChange = useCallback(
    (orderId: string, trackingNumber: string) => {
      updateEntry(orderId, {
        trackingNumber,
        validation: null,
        validating: false,
      });

      // Clear previous debounce timer for this order
      if (debounceTimers.current[orderId]) {
        clearTimeout(debounceTimers.current[orderId]);
      }

      if (!trackingNumber.trim()) return;

      debounceTimers.current[orderId] = setTimeout(async () => {
        updateEntry(orderId, { validating: true });
        try {
          const result = await apiPost("/api/orders/validate-shipping", {
            orderId,
            trackingNumber,
          });
          updateEntry(orderId, {
            validation: result as ValidationResult,
            validating: false,
          });
        } catch {
          updateEntry(orderId, { validating: false });
        }
      }, 500);
    },
    [updateEntry]
  );

  const handleFulfillAll = async () => {
    setFulfilling(true);
    const fulfilled: string[] = [];
    try {
      for (const entry of entries) {
        await apiPost("/api/orders/fulfill", {
          orderId: entry.orderId,
          trackingNumber: entry.trackingNumber || undefined,
          carrier: entry.carrier,
          notifyCustomer,
        });
        fulfilled.push(entry.orderId);
      }
      onFulfilled(fulfilled);
    } catch {
      // Partial success: report what was fulfilled
      if (fulfilled.length > 0) {
        onFulfilled(fulfilled);
      }
    } finally {
      setFulfilling(false);
    }
  };

  const orderMap = useMemo(() => {
    const m = new Map<string, Order>();
    orders.forEach((o) => m.set(o.id, o));
    return m;
  }, [orders]);

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[480px] max-w-full flex-col border-l border-[#47474e]/20 bg-[#131316] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#47474e]/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-[#b8b0c8]" />
            <h2 className="text-lg font-semibold text-[#e7e4ec]">
              Fulfill Orders ({orders.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#b8b0c8] transition-colors hover:bg-[#25252b] hover:text-[#e7e4ec]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {entries.map((entry) => {
              const order = orderMap.get(entry.orderId);
              if (!order) return null;

              return (
                <div
                  key={entry.orderId}
                  className="rounded-xl border border-[#47474e]/20 bg-[#1c1c21] p-4"
                >
                  {/* Order info */}
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-[#e7e4ec]">
                        #{order.orderNumber}
                      </span>
                      <span className="ml-2 text-sm text-[#b8b0c8]">
                        {order.customerName || "Guest"}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#47474e]" />
                  </div>

                  {/* Tracking number */}
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-[#b8b0c8]">
                      Tracking Number
                    </label>
                    <input
                      type="text"
                      value={entry.trackingNumber}
                      onChange={(e) =>
                        handleTrackingChange(entry.orderId, e.target.value)
                      }
                      placeholder="Enter tracking number..."
                      className="w-full rounded-lg border-none bg-[#25252b] px-3 py-2 text-sm text-[#e7e4ec] placeholder-[#6e6a78] outline-none ring-1 ring-transparent transition-all focus:ring-[#6750a4]"
                    />
                  </div>

                  {/* Carrier dropdown */}
                  <div className="mb-3">
                    <label className="mb-1 block text-xs font-medium text-[#b8b0c8]">
                      Carrier
                    </label>
                    <select
                      value={entry.carrier}
                      onChange={(e) =>
                        updateEntry(entry.orderId, { carrier: e.target.value })
                      }
                      className="w-full rounded-lg border-none bg-[#25252b] px-3 py-2 text-sm text-[#e7e4ec] outline-none ring-1 ring-transparent transition-all focus:ring-[#6750a4]"
                    >
                      {CARRIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Validation result */}
                  {entry.validating && (
                    <div className="flex items-center gap-2 rounded-lg bg-[#25252b] px-3 py-2 text-xs text-[#b8b0c8]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Validating shipping cost...
                    </div>
                  )}
                  {entry.validation && (
                    <div className="rounded-lg bg-[#25252b] px-3 py-2">
                      <div className="flex items-center gap-1 text-xs">
                        <Truck className="mr-1 h-3 w-3 text-[#b8b0c8]" />
                        <span className="text-[#b8b0c8]">
                          Charged:{" "}
                          <span className="text-[#e7e4ec]">
                            {formatCurrency(entry.validation.shippingCharged)}
                          </span>
                        </span>
                        {entry.validation.actualCost !== null && (
                          <>
                            <span className="mx-1 text-[#47474e]">|</span>
                            <span className="text-[#b8b0c8]">
                              Actual:{" "}
                              <span className="text-[#e7e4ec]">
                                {formatCurrency(entry.validation.actualCost)}
                              </span>
                            </span>
                          </>
                        )}
                        {entry.validation.variance !== null && (
                          <>
                            <span className="mx-1 text-[#47474e]">|</span>
                            <span className="text-[#b8b0c8]">
                              Variance:{" "}
                              <span
                                className={
                                  entry.validation.variance >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }
                              >
                                {entry.validation.variance >= 0 ? "+" : ""}
                                {formatCurrency(entry.validation.variance)}
                              </span>
                            </span>
                          </>
                        )}
                        {!entry.validation.matched && entry.validation.actualCost === null && (
                          <span className="ml-1 text-[#b8b0c8] italic">
                            No shipping cost data found
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[#47474e]/20 px-6 py-4">
          {/* Notify toggle */}
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm text-[#b8b0c8]">Notify customer</label>
            <button
              type="button"
              role="switch"
              aria-checked={notifyCustomer}
              onClick={() => setNotifyCustomer((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                notifyCustomer ? "bg-[#6750a4]" : "bg-[#47474e]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow-sm transition-transform ${
                  notifyCustomer ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Fulfill button */}
          <button
            onClick={handleFulfillAll}
            disabled={fulfilling}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-green-500 hover:to-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {fulfilling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fulfilling...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Fulfill All ({orders.length})
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(
    () => new Set()
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Track locally fulfilled IDs to update status in the UI without refetch
  const [localFulfilled, setLocalFulfilled] = useState<Set<string>>(
    () => new Set()
  );

  const debouncedSearch = useDebounce(search, 400);

  // Reset to page 1 when filters change
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

  const { data, loading, error, refetch } = useApi<OrdersResponse>(
    `/api/orders?${queryString}`
  );
  const { data: storesData } = useApi<StoresResponse>("/api/stores");

  // Apply local fulfillment overrides
  const orders = useMemo(() => {
    const raw = data?.orders ?? [];
    return raw.map((o) =>
      localFulfilled.has(o.id)
        ? { ...o, fulfillmentStatus: "fulfilled" }
        : o
    );
  }, [data, localFulfilled]);

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);
  const stores = storesData?.stores ?? [];

  // Unfulfilled orders on current page
  const unfulfilledOrders = useMemo(
    () => orders.filter((o) => o.fulfillmentStatus !== "fulfilled"),
    [orders]
  );

  const allUnfulfilledSelected =
    unfulfilledOrders.length > 0 &&
    unfulfilledOrders.every((o) => selectedOrders.has(o.id));

  const toggleSelectAll = () => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (allUnfulfilledSelected) {
        unfulfilledOrders.forEach((o) => next.delete(o.id));
      } else {
        unfulfilledOrders.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  const toggleOrder = (orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Get selected order objects for the panel
  const selectedOrderObjects = useMemo(
    () => orders.filter((o) => selectedOrders.has(o.id)),
    [orders, selectedOrders]
  );

  const handleFulfilled = (fulfilledIds: string[]) => {
    // Remove from selection
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      fulfilledIds.forEach((id) => next.delete(id));
      return next;
    });

    // Mark as locally fulfilled
    setLocalFulfilled((prev) => {
      const next = new Set(prev);
      fulfilledIds.forEach((id) => next.add(id));
      return next;
    });

    // Close panel if all done
    setPanelOpen(false);

    // Show toast
    setToast({
      message: `Successfully fulfilled ${fulfilledIds.length} order${fulfilledIds.length > 1 ? "s" : ""}`,
      type: "success",
    });

    // Refetch after a moment to get server state
    setTimeout(() => refetch(), 1000);
  };

  // Clear local fulfilled when data refreshes
  useEffect(() => {
    if (data) {
      setLocalFulfilled(new Set());
    }
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All orders across your connected stores
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedOrders.size > 0 && (
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-green-500 hover:to-emerald-400"
            >
              <Truck className="h-4 w-4" />
              Fulfill ({selectedOrders.size})
            </button>
          )}
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Search by order #, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={storeFilter}
              onValueChange={(v) => v && setStoreFilter(v)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stores</SelectItem>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="authorized">Authorized</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="partially_refunded">
                  Partially Refunded
                </SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="voided">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading orders...
              </span>
            ) : (
              `${total.toLocaleString()} Orders`
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="py-8 text-center text-sm text-red-500">
              Failed to load orders: {error}
            </div>
          ) : loading && orders.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-sm text-zinc-500">
              No orders found.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="w-10 pb-3 text-left">
                        {unfulfilledOrders.length > 0 && (
                          <input
                            type="checkbox"
                            checked={allUnfulfilledSelected}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 cursor-pointer rounded border-zinc-600 bg-[#25252b] accent-[#6750a4]"
                            title="Select all unfulfilled orders"
                          />
                        )}
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                        Order #
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                        Date
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                        Customer
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Revenue
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Tax
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Shipping
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        COGS
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Fees
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Net Profit
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                        Status
                      </th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                        Fulfillment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const isUnfulfilled =
                        order.fulfillmentStatus !== "fulfilled";
                      const isSelected = selectedOrders.has(order.id);

                      return (
                        <tr
                          key={order.id}
                          className={`border-b border-zinc-100 dark:border-zinc-800 ${
                            isSelected
                              ? "bg-[#6750a4]/5 dark:bg-[#6750a4]/10"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          }`}
                        >
                          <td className="py-3">
                            {isUnfulfilled ? (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleOrder(order.id)}
                                className="h-4 w-4 cursor-pointer rounded border-zinc-600 bg-[#25252b] accent-[#6750a4]"
                              />
                            ) : null}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              #{order.orderNumber}
                            </div>
                          </td>
                          <td className="py-3 text-sm">
                            {formatDate(order.orderDate)}
                          </td>
                          <td className="py-3 text-sm">
                            <div>{order.customerName || "Guest"}</div>
                            {order.customerEmail && (
                              <div className="text-xs text-zinc-500">
                                {order.customerEmail}
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-right text-sm">
                            {formatCurrency(order.subtotal)}
                          </td>
                          <td className="py-3 text-right text-sm">
                            {formatCurrency(order.totalTax)}
                          </td>
                          <td className="py-3 text-right">
                            <div className="text-sm">
                              {formatCurrency(order.shippingCharged)}
                            </div>
                            {order.actualShippingCost !==
                              order.shippingCharged &&
                              order.actualShippingCost > 0 && (
                                <div className="text-xs text-zinc-500">
                                  (actual:{" "}
                                  {formatCurrency(order.actualShippingCost)})
                                </div>
                              )}
                          </td>
                          <td className="py-3 text-right text-sm">
                            {formatCurrency(order.totalCogs)}
                          </td>
                          <td className="py-3 text-right text-sm">
                            {formatCurrency(
                              order.transactionFee + order.customCostsTotal
                            )}
                          </td>
                          <td
                            className={`py-3 text-right text-sm font-bold ${
                              order.netProfit > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(order.netProfit)}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={statusBadgeVariant(
                                order.financialStatus
                              )}
                            >
                              {formatStatus(order.financialStatus)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={
                                order.fulfillmentStatus === "fulfilled"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              {formatStatus(
                                order.fulfillmentStatus || "unfulfilled"
                              )}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
                <span>
                  Showing {showingFrom}-{showingTo} of {total.toLocaleString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Fulfillment slide-over panel */}
      {panelOpen && selectedOrderObjects.length > 0 && (
        <FulfillmentPanel
          orders={selectedOrderObjects}
          onClose={() => setPanelOpen(false)}
          onFulfilled={handleFulfilled}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
