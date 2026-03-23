"use client";

import { useState, useEffect, useMemo } from "react";
import { Download, Search, Loader2 } from "lucide-react";
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

function statusBadgeVariant(status: string): "success" | "warning" | "destructive" | "default" {
  const s = status.toLowerCase();
  if (s === "paid") return "success";
  if (s === "pending" || s === "authorized" || s === "partially_paid") return "warning";
  if (s === "refunded" || s === "voided" || s === "partially_refunded") return "destructive";
  return "default";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            All orders across your connected stores
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
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
            <Select value={storeFilter} onValueChange={(v) => v && setStoreFilter(v)}>
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
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="authorized">Authorized</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
                <SelectItem value="partially_refunded">Partially Refunded</SelectItem>
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
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">Order #</th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">Date</th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">Customer</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">Revenue</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">Tax</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">Shipping</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">COGS</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">Fees</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">Net Profit</th>
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            #{order.orderNumber}
                          </div>
                        </td>
                        <td className="py-3 text-sm">{formatDate(order.orderDate)}</td>
                        <td className="py-3 text-sm">
                          <div>{order.customerName || "Guest"}</div>
                          {order.customerEmail && (
                            <div className="text-xs text-zinc-500">{order.customerEmail}</div>
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
                          {order.actualShippingCost !== order.shippingCharged && order.actualShippingCost > 0 && (
                            <div className="text-xs text-zinc-500">
                              (actual: {formatCurrency(order.actualShippingCost)})
                            </div>
                          )}
                        </td>
                        <td className="py-3 text-right text-sm">
                          {formatCurrency(order.totalCogs)}
                        </td>
                        <td className="py-3 text-right text-sm">
                          {formatCurrency(order.transactionFee + order.customCostsTotal)}
                        </td>
                        <td
                          className={`py-3 text-right text-sm font-bold ${
                            order.netProfit > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatCurrency(order.netProfit)}
                        </td>
                        <td className="py-3">
                          <Badge variant={statusBadgeVariant(order.financialStatus)}>
                            {formatStatus(order.financialStatus)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
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
    </div>
  );
}
