"use client";

import { useState, useEffect } from "react";
import { Loader2, Package, Truck, Bell, Mail, MessageSquare, Smartphone } from "lucide-react";
const Switch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onCheckedChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-[#73f08c]" : "bg-[#47474e]"}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);
import { toast } from "sonner";
import { useApi, apiPut, apiPatch } from "@/hooks/use-api";

interface Alert {
  id: string;
  orderId: string;
  storeId: string;
  type: string;
  severity: string;
  status: string;
  expectedCost: number;
  actualCost: number;
  difference: number;
  percentOver: number;
  message: string;
  createdAt: string;
}

interface AlertSettings {
  shippingPercentThreshold: number;
  shippingDollarThreshold: number;
  cogsPercentThreshold: number;
  cogsDollarThreshold: number;
  enableInApp: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  alertEmail: string;
  alertPhone: string;
}

interface AlertsResponse {
  alerts: Alert[];
  settings: AlertSettings;
}

export default function AlertsPage() {
  const { data, loading, error, refetch } = useApi<AlertsResponse>("/api/alerts");

  const [shippingPercent, setShippingPercent] = useState("");
  const [shippingDollar, setShippingDollar] = useState("");
  const [cogsPercent, setCogsPercent] = useState("");
  const [cogsDollar, setCogsDollar] = useState("");
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  const [sms, setSms] = useState(false);
  const [alertEmail, setAlertEmail] = useState("");
  const [alertPhone, setAlertPhone] = useState("");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      setShippingPercent(String(s.shippingPercentThreshold));
      setShippingDollar(String(s.shippingDollarThreshold));
      setCogsPercent(String(s.cogsPercentThreshold));
      setCogsDollar(String(s.cogsDollarThreshold));
      setInApp(s.enableInApp);
      setEmail(s.enableEmail);
      setSms(s.enableSms);
      setAlertEmail(s.alertEmail ?? "");
      setAlertPhone(s.alertPhone ?? "");
    }
  }, [data?.settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut("/api/alerts", {
        shippingPercentThreshold: Number(shippingPercent),
        shippingDollarThreshold: Number(shippingDollar),
        cogsPercentThreshold: Number(cogsPercent),
        cogsDollarThreshold: Number(cogsDollar),
        enableInApp: inApp,
        enableEmail: email,
        enableSms: sms,
        alertEmail,
        alertPhone,
      });
      toast.success("Alert settings saved successfully");
    } catch {
      toast.error("Failed to save alert settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAlertAction = async (alertId: string, action: "resolve" | "dismiss") => {
    try {
      await apiPatch("/api/alerts", { alertId, action });
      toast.success(`Alert ${action === "resolve" ? "resolved" : "dismissed"}`);
      refetch();
    } catch {
      toast.error(`Failed to ${action} alert`);
    }
  };

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

  const alerts = data?.alerts ?? [];
  const activeCount = alerts.filter((a) => a.status === "Active" || a.status === "active").length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.status.toLowerCase() === filter;
  });

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("shipping")) return <Truck className="h-4 w-4 text-primary" />;
    return <Package className="h-4 w-4 text-on-surface-variant" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-on-surface">Cost Alerts</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Monitor cost discrepancies and get notified of anomalies
          </p>
        </div>
        <span className="rounded-full bg-error-container px-4 py-2 text-base font-bold text-error">
          {activeCount} active alert{activeCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Settings Row: 2/3 Thresholds + 1/3 Notifications */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Alert Thresholds (2/3 width) */}
        <div className="lg:col-span-2 rounded-xl bg-surface-container-low p-6">
          <h2 className="text-lg font-bold text-on-surface">Alert Thresholds</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Configure cost discrepancy detection</p>

          <div className="mt-6 grid gap-8 md:grid-cols-2">
            {/* Shipping Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                <Truck className="h-4 w-4" />
                Shipping
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant">Percentage Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={shippingPercent || 0}
                    onChange={(e) => setShippingPercent(e.target.value)}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface-container-highest/50 accent-primary"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={shippingPercent}
                      onChange={(e) => setShippingPercent(e.target.value)}
                      className="h-9 w-16 rounded-lg border border-outline-variant/10 bg-surface-container px-2 text-center text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-on-surface-variant">%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant">Dollar Threshold</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">$</span>
                  <input
                    type="number"
                    value={shippingDollar}
                    onChange={(e) => setShippingDollar(e.target.value)}
                    className="h-9 w-full rounded-lg border border-outline-variant/10 bg-surface-container px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* COGS Section */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                <Package className="h-4 w-4" />
                COGS
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant">Percentage Threshold</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cogsPercent || 0}
                    onChange={(e) => setCogsPercent(e.target.value)}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-surface-container-highest/50 accent-primary"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={cogsPercent}
                      onChange={(e) => setCogsPercent(e.target.value)}
                      className="h-9 w-16 rounded-lg border border-outline-variant/10 bg-surface-container px-2 text-center text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="text-xs text-on-surface-variant">%</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-on-surface-variant">Dollar Threshold</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-on-surface-variant">$</span>
                  <input
                    type="number"
                    value={cogsDollar}
                    onChange={(e) => setCogsDollar(e.target.value)}
                    className="h-9 w-full rounded-lg border border-outline-variant/10 bg-surface-container px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Settings
            </button>
          </div>
        </div>

        {/* Notifications (1/3 width) */}
        <div className="rounded-xl bg-surface-container-low p-6">
          <h2 className="text-lg font-bold text-on-surface">Notifications</h2>
          <p className="mt-1 text-sm text-on-surface-variant">How you receive alerts</p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-surface-container p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <span className="text-sm font-medium text-on-surface">In-App</span>
                  <p className="text-xs text-on-surface-variant">Dashboard alerts</p>
                </div>
              </div>
              <Switch checked={inApp} onCheckedChange={setInApp} />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container p-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <span className="text-sm font-medium text-on-surface">Email</span>
                  <p className="text-xs text-on-surface-variant">High-severity alerts</p>
                </div>
              </div>
              <Switch checked={email} onCheckedChange={setEmail} />
            </div>

            <div className="flex items-center justify-between rounded-lg bg-surface-container p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-on-surface-variant" />
                <div>
                  <span className="text-sm font-medium text-on-surface">SMS</span>
                  <p className="text-xs text-on-surface-variant">Urgent cost overruns ($50+)</p>
                </div>
              </div>
              <Switch checked={sms} onCheckedChange={setSms} />
            </div>
          </div>
        </div>
      </div>

      {/* Alert History Table */}
      <div className="overflow-hidden rounded-xl bg-surface-container-low">
        <div className="flex items-center justify-between border-b border-outline-variant/5 px-6 py-5">
          <h2 className="text-lg font-bold text-on-surface">Alert History</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 w-36 appearance-none rounded-lg border border-outline-variant/10 bg-surface-container px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-sm text-on-surface-variant">
            No alerts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-high/50">
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Order
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Expected
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Actual
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Difference
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filteredAlerts.map((alert) => (
                  <tr
                    key={alert.id}
                    className="transition-colors hover:bg-surface-container-high/30"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(alert.type)}
                        <span className="text-sm font-medium text-on-surface">{alert.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-primary">
                      {alert.orderId}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm text-on-surface-variant">
                      ${alert.expectedCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm text-on-surface">
                      ${alert.actualCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-error">
                        +${alert.difference.toFixed(2)} (+{alert.percentOver.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {(alert.severity === "High" || alert.severity === "high") ? (
                        <span className="inline-flex items-center rounded-full bg-error-container px-2.5 py-0.5 text-[11px] font-bold text-error">
                          {alert.severity}
                        </span>
                      ) : (alert.severity === "Medium" || alert.severity === "medium") ? (
                        <span className="inline-flex items-center rounded-full bg-yellow-900/30 px-2.5 py-0.5 text-[11px] font-bold text-yellow-400">
                          {alert.severity}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-outline-variant/20 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                          {alert.severity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {(alert.status === "Active" || alert.status === "active") ? (
                        <span className="inline-flex items-center rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                          {alert.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-outline-variant/20 px-2.5 py-0.5 text-[11px] font-semibold text-on-surface-variant">
                          {alert.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {(alert.status === "Active" || alert.status === "active") && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAlertAction(alert.id, "resolve")}
                            className="rounded-lg border border-outline-variant/10 bg-surface-container px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high/50"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleAlertAction(alert.id, "dismiss")}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container-high/30"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
