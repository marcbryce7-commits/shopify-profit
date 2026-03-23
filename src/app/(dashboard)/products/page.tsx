"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Download, Search, Loader2, Calendar, Package } from "lucide-react";
import { useApi } from "@/hooks/use-api";

interface Product {
  title: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  cogs: number;
  profit: number;
}

interface ProductsResponse {
  products: Product[];
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, loading, error } = useApi<ProductsResponse>("/api/products");

  const products = data?.products ?? [];

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const mostProfitable = useMemo(
    () =>
      products.length > 0
        ? products.reduce((best, p) => (p.profit > best.profit ? p : best), products[0])
        : null,
    [products]
  );

  const leastProfitable = useMemo(
    () =>
      products.length > 0
        ? products.reduce((worst, p) => (p.profit < worst.profit ? p : worst), products[0])
        : null,
    [products]
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
        <p className="text-error">Failed to load products: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface">Product Analytics</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Net profit breakdown by product
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/5 bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high">
            <Calendar className="h-4 w-4" />
            Last 30 days
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Products */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Total Products</span>
            <Package className="h-4 w-4 text-outline" />
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-3xl font-bold text-on-surface">{products.length}</span>
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-tertiary-dim/10 px-2 py-0.5 text-xs font-medium text-tertiary-dim">
              <TrendingUp className="h-3 w-3" />
              +4.2%
            </span>
          </div>
        </div>

        {/* Most Profitable */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Most Profitable</span>
            <TrendingUp className="h-4 w-4 text-tertiary-dim" />
          </div>
          {mostProfitable ? (
            <div className="mt-3">
              <div className="text-sm font-semibold text-on-surface">{mostProfitable.title}</div>
              <div className="mt-1 text-xl font-bold text-tertiary-dim">
                {formatCurrency(mostProfitable.profit)}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-on-surface-variant">No data</div>
          )}
        </div>

        {/* Least Profitable */}
        <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-on-surface-variant">Least Profitable</span>
            <TrendingDown className="h-4 w-4 text-error" />
          </div>
          {leastProfitable ? (
            <div className="mt-3">
              <div className="text-sm font-semibold text-on-surface">{leastProfitable.title}</div>
              <div className="mt-1 text-xl font-bold text-error">
                {formatCurrency(leastProfitable.profit)}
              </div>
            </div>
          ) : (
            <div className="mt-3 text-sm text-on-surface-variant">No data</div>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-xl border border-outline-variant/5 bg-surface-container-low">
        {/* Search */}
        <div className="border-b border-outline-variant/5 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              placeholder="Search products..."
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
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-outline">Product</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">Units Sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">COGS</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">Net Profit</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-outline">Margin</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product, idx) => {
                const margin =
                  product.revenue !== 0
                    ? (product.profit / product.revenue) * 100
                    : 0;
                const isPositive = product.profit >= 0;
                return (
                  <tr
                    key={`${product.sku}-${idx}`}
                    className="border-b border-outline-variant/5 transition-colors hover:bg-surface-container"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-xs font-bold text-on-surface-variant">
                          {product.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-on-surface">{product.title}</div>
                          <div className="text-xs text-outline">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                      {product.unitsSold.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-on-surface-variant">
                      {formatCurrency(product.cogs)}
                    </td>
                    <td className={`px-4 py-3 text-right text-sm font-bold ${isPositive ? "text-tertiary-dim" : "text-error"}`}>
                      {formatCurrency(product.profit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        margin >= 0
                          ? "border-tertiary-dim/20 text-tertiary-dim"
                          : "border-error/20 text-error"
                      }`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-outline">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="flex items-center justify-between border-t border-outline-variant/5 px-4 py-3">
            <span className="text-xs text-outline">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
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
