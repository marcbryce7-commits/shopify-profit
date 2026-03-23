"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, Download, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function ProductsPage() {
  const [search, setSearch] = useState("");
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
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-red-500">Failed to load products: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Net profit breakdown by product
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Most Profitable
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {mostProfitable ? (
              <>
                <div className="font-semibold">{mostProfitable.title}</div>
                <div className="text-lg font-bold text-green-600">
                  {formatCurrency(mostProfitable.profit)}
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-400">No data</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Least Profitable
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {leastProfitable ? (
              <>
                <div className="font-semibold">{leastProfitable.title}</div>
                <div className="text-lg font-bold text-zinc-600 dark:text-zinc-400">
                  {formatCurrency(leastProfitable.profit)}
                </div>
              </>
            ) : (
              <div className="text-sm text-zinc-400">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="pb-3 text-left text-xs font-medium text-zinc-500">Product</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">Units Sold</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">Revenue</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">COGS</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">Net Profit</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">Margin</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, idx) => {
                  const margin =
                    product.revenue !== 0
                      ? (product.profit / product.revenue) * 100
                      : 0;
                  return (
                    <tr
                      key={`${product.sku}-${idx}`}
                      className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <td className="py-3">
                        <div>
                          <div className="font-medium">{product.title}</div>
                          <div className="text-xs text-zinc-500">{product.sku}</div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm">
                        {product.unitsSold.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {formatCurrency(product.cogs)}
                      </td>
                      <td className="py-3 text-right text-sm font-bold text-green-600">
                        {formatCurrency(product.profit)}
                      </td>
                      <td className="py-3 text-right text-sm">{margin.toFixed(1)}%</td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-zinc-400">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
