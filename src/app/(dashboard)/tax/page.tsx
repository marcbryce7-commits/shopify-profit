"use client";

import { DollarSign, MapPin, AlertTriangle, Receipt, Download, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApi } from "@/hooks/use-api";

interface NexusRecord {
  id: string;
  userId: string;
  state: string;
  totalRevenue: number;
  totalTransactions: number;
  revenueThreshold: number;
  transactionThreshold: number;
  hasNexus: boolean;
  registeredForTax: boolean;
  taxjarEnabled: boolean;
}

interface TaxByState {
  state: string;
  totalTaxable: number;
  totalCollected: number;
}

interface TaxResponse {
  totalTaxCollected: number;
  statesWithNexus: number;
  nexus: NexusRecord[];
  taxByState: TaxByState[];
}

export default function TaxPage() {
  const { data, loading, error, refetch } = useApi<TaxResponse>("/api/tax");

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

  const totalTaxCollected = data?.totalTaxCollected ?? 0;
  const statesWithNexus = data?.statesWithNexus ?? 0;
  const nexus = data?.nexus ?? [];
  const taxByState = data?.taxByState ?? [];

  const chartData = taxByState.map((t) => ({
    state: t.state,
    amount: t.totalCollected,
  }));

  const filingDueCount = nexus.filter((n) => n.hasNexus && n.registeredForTax).length;
  const anyTaxjarEnabled = nexus.some((n) => n.taxjarEnabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tax Portal</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Sales tax tracking, nexus monitoring, and automated filing
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            March 2026
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Tax Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Tax Collected (Period)
            </CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalTaxCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              States with Nexus
            </CardTitle>
            <MapPin className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statesWithNexus} of 50 states</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Filing Due Soon
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filingDueCount}</div>
            <p className="text-xs text-zinc-500">next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Auto-Filing
            </CardTitle>
            <Receipt className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            {anyTaxjarEnabled ? (
              <Badge variant="success">TaxJar Connected</Badge>
            ) : (
              <Badge variant="outline">Off — Connect TaxJar</Badge>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Automated Tax Filing</CardTitle>
              <CardDescription>
                Connect TaxJar to auto-calculate, report, and file state sales tax
                returns
              </CardDescription>
            </div>
            <Button>Connect TaxJar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="font-medium">TaxJar handles:</p>
            <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
              <li>• Auto-calculate tax liability per state</li>
              <li>• File and remit returns on your behalf</li>
              <li>• Monitor economic nexus thresholds</li>
              <li>• Product tax categorization</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Economic Nexus Tracker</CardTitle>
          <CardDescription>
            Monitor your revenue against state thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {nexus.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No nexus data available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">State</th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">Revenue</th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Threshold
                    </th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Transactions
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                      Nexus Status
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                      Registered
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nexus.map((n) => (
                    <tr
                      key={n.id}
                      className={`border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                        n.hasNexus ? "bg-red-50 dark:bg-red-900/10" : ""
                      }`}
                    >
                      <td className="py-3 text-sm font-medium">{n.state}</td>
                      <td className="py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            ${n.totalRevenue.toLocaleString()}
                          </div>
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                            <div
                              className={`h-full ${
                                n.hasNexus ? "bg-red-600" : "bg-blue-600"
                              }`}
                              style={{
                                width: `${Math.min((n.totalRevenue / n.revenueThreshold) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm">
                        ${n.revenueThreshold.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm">
                        {n.totalTransactions} / {n.transactionThreshold}
                      </td>
                      <td className="py-3">
                        <Badge variant={n.hasNexus ? "destructive" : "outline"}>
                          {n.hasNexus ? "Nexus" : "Below threshold"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge variant={n.registeredForTax ? "success" : "outline"}>
                          {n.registeredForTax ? "Yes" : "No"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Collected by State</CardTitle>
          <CardDescription>March 2026</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No tax collection data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-800"
                />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="state" type="category" className="text-xs" />
                <Tooltip />
                <Bar dataKey="amount" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
