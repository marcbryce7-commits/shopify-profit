"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, Search, Filter, Loader2, Plus, AlertCircle } from "lucide-react";
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

const LIMIT = 25;

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

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

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

  const { data, loading, error } = useApi<OrdersResponse>(`/api/orders?${queryString}`);
  const { data: storesData } = useApi<StoresResponse>("/api/stores");

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / LIMIT);
  const showingFrom = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const showingTo = Math.min(page * LIMIT, total);

  const stores = storesData?.stores ?? [];

  // Compute bottom stats
  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum, o) => sum + (o.subtotal ?? 0), 0) / orders.length
    : 0;
  const totalNetProfit = orders.reduce((sum, o) => sum + (o.netProfit ?? 0), 0);
  const refundCount = orders.filter((o) => {
    const s = (o.financialStatus || "").toLowerCase();
    return s === "refunded" || s === "partially_refunded";
  }).length;
  const refundRate = orders.length > 0 ? (refundCount / orders.length) * 100 : 0;
  const avgLtv = avgOrderValue * 1.8; // rough estimate

  // Generate page numbers for pagination
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
          <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            New Order
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
          {stores.map((s) => (
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
        ) : loading && orders.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">
            No orders found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-high/50">
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
                      Tax
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      COGS
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Net Profit
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {orders.map((order) => {
                    const fulfillment = getFulfillmentStyle(order.fulfillmentStatus || order.financialStatus);
                    const showAlert = hasAlert(order);
                    const initials = getInitials(order.customerName);
                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-surface-container-high/30"
                      >
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
                              {order.customerEmail && (
                                <div className="text-xs text-on-surface-variant/60">
                                  {order.customerEmail}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-on-surface">
                          {formatCurrency(order.subtotal)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                          {formatCurrency(order.totalTax)}
                        </td>
                        <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                          {formatCurrency(order.totalCogs)}
                        </td>
                        <td className={`px-4 py-3.5 text-right text-sm font-bold ${
                          order.netProfit >= 0 ? "text-tertiary-dim" : "text-error"
                        }`}>
                          {formatCurrency(order.netProfit)}
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

      {/* Bottom Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
            Avg Order Value
          </div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">
            {formatCurrency(avgOrderValue)}
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
            Total Net Profit
          </div>
          <div className={`mt-2 text-2xl font-extrabold ${totalNetProfit >= 0 ? "text-tertiary-dim" : "text-error"}`}>
            {formatCurrency(totalNetProfit)}
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
            Refund Rate
          </div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">
            {refundRate.toFixed(1)}%
          </div>
        </div>
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
            Customer LTV
          </div>
          <div className="mt-2 text-2xl font-extrabold text-on-surface">
            {formatCurrency(avgLtv)}
          </div>
        </div>
      </div>
    </div>
  );
}
