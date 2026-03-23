"use client";

import { useMemo, useState } from "react";
import { Download, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function CustomersPage() {
  const [search, setSearch] = useState("");
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
        <p className="text-red-500">Failed to load customers: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Lifetime Value</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Track customer profitability and repeat purchase behavior
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Avg LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageLtv)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Repeat Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{repeatRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Avg Orders / Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOrdersPerCustomer.toFixed(1)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Search customers..."
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
                  <th className="pb-3 text-left text-xs font-medium text-zinc-500">Customer</th>
                  <th className="pb-3 text-left text-xs font-medium text-zinc-500">First Order</th>
                  <th className="pb-3 text-left text-xs font-medium text-zinc-500">Last Order</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                    Total Orders
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                    Total Revenue
                  </th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">Total COGS</th>
                  <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                    LTV (Net Profit)
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                  >
                    <td className="py-3">
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-xs text-zinc-500">{customer.email}</div>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{formatDate(customer.firstOrderDate)}</td>
                    <td className="py-3 text-sm">{formatDate(customer.lastOrderDate)}</td>
                    <td className="py-3 text-right text-sm">{customer.totalOrders}</td>
                    <td className="py-3 text-right text-sm">
                      {formatCurrency(customer.totalRevenue)}
                    </td>
                    <td className="py-3 text-right text-sm">
                      {formatCurrency(customer.totalCogs)}
                    </td>
                    <td className="py-3 text-right text-sm font-bold text-green-600">
                      {formatCurrency(customer.ltvNetProfit)}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-zinc-400">
                      No customers found.
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
