"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  const alerts = data?.alerts ?? [];
  const activeCount = alerts.filter((a) => a.status === "Active" || a.status === "active").length;

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === "all") return true;
    return alert.status.toLowerCase() === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Alerts</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Monitor cost discrepancies and get notified of anomalies
          </p>
        </div>
        <Badge variant="destructive" className="px-4 py-2 text-base">
          {activeCount} active alert{activeCount !== 1 ? "s" : ""}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alert Settings</CardTitle>
          <CardDescription>
            Configure thresholds for cost discrepancy detection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Shipping Cost Discrepancy</h3>
              <div className="space-y-2">
                <Label htmlFor="shipping-percent">Percentage Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="shipping-percent"
                    type="number"
                    value={shippingPercent}
                    onChange={(e) => setShippingPercent(e.target.value)}
                  />
                  <span className="text-sm text-zinc-500">%</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Alert when actual cost differs by this percentage
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shipping-dollar">Dollar Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">$</span>
                  <Input
                    id="shipping-dollar"
                    type="number"
                    value={shippingDollar}
                    onChange={(e) => setShippingDollar(e.target.value)}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Alert when actual cost differs by this amount
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">COGS Discrepancy</h3>
              <div className="space-y-2">
                <Label htmlFor="cogs-percent">Percentage Threshold</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="cogs-percent"
                    type="number"
                    value={cogsPercent}
                    onChange={(e) => setCogsPercent(e.target.value)}
                  />
                  <span className="text-sm text-zinc-500">%</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Alert when actual cost differs by this percentage
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cogs-dollar">Dollar Threshold</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">$</span>
                  <Input
                    id="cogs-dollar"
                    type="number"
                    value={cogsDollar}
                    onChange={(e) => setCogsDollar(e.target.value)}
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  Alert when actual cost differs by this amount
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <h3 className="font-semibold">Notification Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <Label htmlFor="in-app" className="font-medium">
                    In-App
                  </Label>
                  <p className="text-xs text-zinc-500">Show alerts in the dashboard</p>
                </div>
                <Switch id="in-app" checked={inApp} onCheckedChange={setInApp} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <Label htmlFor="email" className="font-medium">
                    Email
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Send alerts via email for high-severity
                  </p>
                </div>
                <Switch id="email" checked={email} onCheckedChange={setEmail} />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <div>
                  <Label htmlFor="sms" className="font-medium">
                    SMS/Text
                  </Label>
                  <p className="text-xs text-zinc-500">
                    Text for urgent cost overruns ($50+)
                  </p>
                </div>
                <Switch id="sms" checked={sms} onCheckedChange={setSms} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Alert History</CardTitle>
            <Select value={filter} onValueChange={(v) => v && setFilter(v)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No alerts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800">
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">Type</th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">Order</th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">Expected</th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">Actual</th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                      Difference
                    </th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">Severity</th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">Status</th>
                    <th className="pb-3 text-left text-xs font-medium text-zinc-500">Date</th>
                    <th className="pb-3 text-right text-xs font-medium text-zinc-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <td className="py-3 text-sm">{alert.type}</td>
                      <td className="py-3 text-sm text-blue-600">{alert.orderId}</td>
                      <td className="py-3 text-right text-sm">
                        ${alert.expectedCost.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-sm">${alert.actualCost.toFixed(2)}</td>
                      <td className="py-3 text-right">
                        <div className="font-bold text-red-600">
                          +${alert.difference.toFixed(2)} (+{alert.percentOver.toFixed(1)}%)
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            alert.severity === "High" || alert.severity === "high"
                              ? "destructive"
                              : alert.severity === "Medium" || alert.severity === "medium"
                                ? "warning"
                                : "outline"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            alert.status === "Active" || alert.status === "active"
                              ? "default"
                              : "outline"
                          }
                        >
                          {alert.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(alert.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-right">
                        {(alert.status === "Active" || alert.status === "active") && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAlertAction(alert.id, "resolve")}
                            >
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAlertAction(alert.id, "dismiss")}
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
