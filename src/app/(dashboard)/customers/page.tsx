"use client";

import { useMemo, useState } from "react";
import { Download, Search, Loader2, Users, DollarSign, Repeat, ShoppingBag } from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface Customer {
  id: string;
  storeId: string;
  email: string;
  name: string;
  firstOrderDate: string;
  lastOrderDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalCogs: number;
  ltvNetProfit: number;
}

interface CustomersResponse {
  customers: Customer[];
  totalCustomers: number;
  averageLtv: number;
  repeatRate: number;
  avgOrdersPerCustomer: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ITEMS_PER_PAGE = 10;

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useApi<CustomersResponse>("/api/customers");

  const customers = data?.customers ?? [];
  const totalCustomers = data?.totalCustomers ?? 0;
  const averageLtv = data?.averageLtv ?? 0;
  const repeatRate = data?.repeatRate ?? 0;
  const avgOrdersPerCustomer = data?.avgOrdersPerCustomer ?? 0;

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE));
  const paginatedCustomers = filteredCustomers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-error">Failed to load customers: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-on-surface">Customer Lifetime Value</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Track customer profitability and repeat purchase behavior
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container">
          <Download className="h-4 w-4" />
          Export Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Total Customers</span>
            <Users className="h-4 w-4 text-outline" />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-on-surface">{totalCustomers.toLocaleString()}</span>
            <span className="mb-1 inline-flex items-center rounded-full bg-tertiary-dim/10 px-2 py-0.5 text-xs font-medium text-tertiary-dim">
              +12%
            </span>
          </div>
        </div>

        {/* Avg LTV */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Avg LTV</span>
            <DollarSign className="h-4 w-4 text-outline" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-on-surface">{formatCurrency(averageLtv)}</span>
          </div>
        </div>

        {/* Repeat Rate */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Repeat Rate</span>
            <Repeat className="h-4 w-4 text-outline" />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-on-surface">{repeatRate.toFixed(1)}%</span>
            <span className="mb-1 inline-flex items-center rounded-full bg-error/10 px-2 py-0.5 text-xs font-medium text-error">
              -2.1%
            </span>
          </div>
        </div>

        {/* Avg Orders/Cust */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Avg Orders/Cust</span>
            <ShoppingBag className="h-4 w-4 text-outline" />
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-on-surface">{avgOrdersPerCustomer.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low">
        {/* Search */}
        <div className="border-b border-outline-variant/5 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-outline-variant/5 bg-surface-container py-2 pl-9 pr-4 text-sm text-on-surface placeholder-outline outline-none transition-colors focus:border-outline focus:bg-surface-container-high"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/5">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-outline">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-outline">First Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-outline">Last Order</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-outline">Orders</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">COGS</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">LTV</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCustomers.map((customer) => {
                const isPositive = customer.ltvNetProfit >= 0;
                return (
                  <tr
                    key={customer.id}
                    className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
                          {getInitials(customer.name)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-on-surface">{customer.name}</div>
                          <div className="text-xs text-outline">{customer.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">
                      {formatDate(customer.firstOrderDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">
                      {formatDate(customer.lastOrderDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-medium text-on-surface-variant">
                        {customer.totalOrders}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                      {formatCurrency(customer.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                      {formatCurrency(customer.totalCogs)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold ${isPositive ? "text-tertiary-dim" : "text-error"}`}>
                      {formatCurrency(customer.ltvNetProfit)}
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-outline">
                    No customers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant/5 px-4 py-3">
            <span className="text-xs text-outline">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customers
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    p === page
                      ? "bg-surface-container-high text-on-surface"
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high disabled:opacity-40 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
