"use client";

import { DollarSign, MapPin, AlertTriangle, Receipt, Download, Calendar, Loader2, ExternalLink } from "lucide-react";
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
        <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-2">
        <p className="text-sm text-error">{error}</p>
        <button
          onClick={refetch}
          className="rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50"
        >
          Retry
        </button>
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

  const maxCollected = Math.max(...taxByState.map((t) => t.totalCollected), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface">Tax Portal</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Sales tax tracking, nexus monitoring, and automated filing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/10 bg-surface-container-low px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high/50">
            <Calendar className="h-4 w-4" />
            March 2026
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90">
            <Download className="h-4 w-4" />
            Export Tax Report
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Tax Collected</span>
            <DollarSign className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-2xl font-bold text-on-surface">
            ${totalTaxCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">Current period</p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">States with Nexus</span>
            <MapPin className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 text-2xl font-bold text-on-surface">{statesWithNexus} of 50</div>
          <p className="mt-1 text-xs text-on-surface-variant">states monitored</p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Filing Due Soon</span>
            <AlertTriangle className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-2xl font-bold text-on-surface">{filingDueCount}</span>
            {filingDueCount > 0 && (
              <span className="rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-error">
                Critical
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">next 30 days</p>
        </div>

        <div className="rounded-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">Auto-Filing</span>
            <Receipt className="h-4 w-4 text-on-surface-variant" />
          </div>
          <div className="mt-3">
            {anyTaxjarEnabled ? (
              <span className="inline-flex items-center rounded-full bg-tertiary-dim/15 px-3 py-1 text-xs font-semibold text-tertiary-dim">
                TaxJar Connected
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-outline-variant/20 px-3 py-1 text-xs font-semibold text-on-surface-variant">
                Off -- Connect TaxJar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TaxJar + Tax by State Row */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* TaxJar Integration Card */}
        <div className="lg:col-span-4 rounded-xl border border-outline-variant/5 bg-surface-container-low/60 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-on-surface">TaxJar Integration</h2>
            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90">
              <ExternalLink className="h-3.5 w-3.5" />
              Connect TaxJar
            </button>
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">
            Auto-calculate, report, and file state sales tax returns
          </p>
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">TaxJar handles:</p>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-dim" />
                Auto-calculate tax liability per state
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-dim" />
                File and remit returns on your behalf
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-dim" />
                Monitor economic nexus thresholds
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-tertiary-dim" />
                Product tax categorization
              </li>
            </ul>
          </div>
        </div>

        {/* Tax Collected by State */}
        <div className="lg:col-span-8 rounded-xl bg-surface-container-low p-6">
          <h2 className="text-lg font-bold text-on-surface">Tax Collected by State</h2>
          <p className="mt-1 text-sm text-on-surface-variant">March 2026</p>
          <div className="mt-5 space-y-3">
            {chartData.length === 0 ? (
              <div className="py-12 text-center text-sm text-on-surface-variant">
                No tax collection data available.
              </div>
            ) : (
              taxByState.map((t) => (
                <div key={t.state} className="flex items-center gap-4">
                  <span className="w-10 text-right text-xs font-semibold text-on-surface">{t.state}</span>
                  <div className="flex-1">
                    <div className="h-5 overflow-hidden rounded-full bg-surface-container-highest/50">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min((t.totalCollected / maxCollected) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-20 text-right text-xs font-medium text-on-surface-variant">
                    ${t.totalCollected.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Economic Nexus Tracker */}
      <div className="overflow-hidden rounded-xl bg-surface-container-low">
        <div className="border-b border-outline-variant/5 px-6 py-5">
          <h2 className="text-lg font-bold text-on-surface">Economic Nexus Tracker</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Monitor your revenue against state thresholds
          </p>
        </div>
        {nexus.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">
            No nexus data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    State
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Revenue
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Threshold Progress
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Transactions
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Nexus Status
                  </th>
                  <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {nexus.map((n) => {
                  const pct = Math.min((n.totalRevenue / n.revenueThreshold) * 100, 100);
                  return (
                    <tr
                      key={n.id}
                      className="transition-colors hover:bg-surface-container-high/30"
                    >
                      <td className="px-4 py-3.5 text-sm font-semibold text-on-surface">{n.state}</td>
                      <td className="px-4 py-3.5 text-sm text-on-surface">
                        ${n.totalRevenue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-container-highest/50">
                            <div
                              className={`h-full rounded-full transition-all ${
                                n.hasNexus ? "bg-error" : "bg-primary"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-on-surface-variant">
                            {pct.toFixed(0)}% of ${n.revenueThreshold.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                        {n.totalTransactions} / {n.transactionThreshold}
                      </td>
                      <td className="px-4 py-3.5">
                        {n.hasNexus ? (
                          <span className="inline-flex items-center rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-bold text-error">
                            Nexus
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-outline-variant/20 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                            Below threshold
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {n.hasNexus && !n.registeredForTax ? (
                          <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-on-primary transition-colors hover:bg-primary/90">
                            Register
                          </button>
                        ) : n.registeredForTax ? (
                          <span className="inline-flex items-center rounded-full bg-tertiary-dim/15 px-2.5 py-0.5 text-[11px] font-semibold text-tertiary-dim">
                            Registered
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
