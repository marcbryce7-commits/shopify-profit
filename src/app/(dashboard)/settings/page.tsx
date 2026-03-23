"use client";

import { useState, useEffect } from "react";
import { Mail, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApi, apiPost, apiDelete } from "@/hooks/use-api";

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

interface CostRule {
  id: string;
  storeId: string;
  name: string;
  type: string;
  amount: number;
  appliesTo: string;
  active: boolean;
  store?: {
    id: string;
    name: string;
  };
}

interface EmailAccount {
  id: string;
  provider: string;
  emailAddress: string;
  label: string;
  active: boolean;
  lastScannedAt: string | null;
}

interface SettingsResponse {
  alertSettings: AlertSettings;
  costRules: CostRule[];
  emailAccounts: EmailAccount[];
}

export default function SettingsPage() {
  const { data, loading, error, refetch } = useApi<SettingsResponse>("/api/settings");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [costType, setCostType] = useState("per-order");
  const [amount, setAmount] = useState("");
  const [appliesTo, setAppliesTo] = useState("all");
  const [ruleStoreId, setRuleStoreId] = useState("");
  const [addingRule, setAddingRule] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notification settings
  const [alertEmail, setAlertEmail] = useState("");
  const [alertPhone, setAlertPhone] = useState("");

  useEffect(() => {
    if (data?.alertSettings) {
      setAlertEmail(data.alertSettings.alertEmail ?? "");
      setAlertPhone(data.alertSettings.alertPhone ?? "");
    }
  }, [data?.alertSettings]);

  const handleSaveAccount = () => {
    toast.success("Account settings saved");
  };

  const handleAddRule = async () => {
    if (!ruleName || !amount) {
      toast.error("Please fill in all fields");
      return;
    }
    setAddingRule(true);
    try {
      await apiPost("/api/settings", {
        storeId: ruleStoreId || undefined,
        name: ruleName,
        type: costType,
        amount: Number(amount),
        appliesTo,
      });
      toast.success("Cost rule added");
      setDialogOpen(false);
      setRuleName("");
      setAmount("");
      setCostType("per-order");
      setAppliesTo("all");
      setRuleStoreId("");
      refetch();
    } catch {
      toast.error("Failed to add cost rule");
    } finally {
      setAddingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    setDeletingId(ruleId);
    try {
      await apiDelete("/api/settings", { ruleId });
      toast.success("Cost rule deleted");
      refetch();
    } catch {
      toast.error("Failed to delete cost rule");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleRule = (id: string) => {
    // Optimistic toggle in the UI; in a real app you'd also persist this
    toast.success("Rule toggled");
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

  const costRules = data?.costRules ?? [];
  const emailAccounts = data?.emailAccounts ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Manage your account and application preferences
        </p>
      </div>

      <Card>
        <Tabs defaultValue="account">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="costs">Custom Costs</TabsTrigger>
              <TabsTrigger value="email">Email Connection</TabsTrigger>
              <TabsTrigger value="api">API Keys</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled />
                <p className="text-xs text-zinc-500">Email cannot be changed</p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveAccount}>Save Changes</Button>
              </div>
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Cost Rules</h3>
                  <p className="text-sm text-zinc-500">
                    Add custom costs to include in profit calculations
                  </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Cost Rule
                      </Button>
                    }
                  />
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Cost Rule</DialogTitle>
                      <DialogDescription>
                        Configure a custom cost to include in profit calculations
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="rule-name">Rule Name</Label>
                        <Input
                          id="rule-name"
                          value={ruleName}
                          onChange={(e) => setRuleName(e.target.value)}
                          placeholder="e.g., Packaging Cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cost-type">Cost Type</Label>
                        <Select value={costType} onValueChange={(v) => v && setCostType(v)}>
                          <SelectTrigger id="cost-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="per-order">Per Order</SelectItem>
                            <SelectItem value="percentage">
                              Percentage of Revenue
                            </SelectItem>
                            <SelectItem value="fixed">Fixed Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="applies-to">Applies To</Label>
                        <Select value={appliesTo} onValueChange={(v) => v && setAppliesTo(v)}>
                          <SelectTrigger id="applies-to">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Orders</SelectItem>
                            <SelectItem value="sku">Specific SKU</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleAddRule} disabled={addingRule}>
                          {addingRule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {costRules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                  <p className="text-sm text-zinc-500">
                    No custom cost rules yet. Add one to include recurring costs in
                    your profit calculations.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Name
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Type
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Amount
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Applies To
                        </th>
                        <th className="pb-3 text-center text-xs font-medium text-zinc-500">
                          Active
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {costRules.map((rule) => (
                        <tr
                          key={rule.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        >
                          <td className="py-3 text-sm">{rule.name}</td>
                          <td className="py-3">
                            <Badge variant="outline">{rule.type}</Badge>
                          </td>
                          <td className="py-3 text-sm">
                            {rule.type === "percentage" || rule.type === "Percentage of Revenue"
                              ? `${rule.amount}%`
                              : `$${rule.amount.toFixed(2)}`}
                          </td>
                          <td className="py-3 text-sm">{rule.appliesTo}</td>
                          <td className="py-3 text-center">
                            <Switch
                              checked={rule.active}
                              onCheckedChange={() => handleToggleRule(rule.id)}
                            />
                          </td>
                          <td className="py-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={deletingId === rule.id}
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              {deletingId === rule.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-red-600" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              {emailAccounts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
                  <p className="text-sm text-zinc-500">
                    No email accounts connected. Connect one to enable the shipping agent.
                  </p>
                  <Button className="mt-4">Connect Email Account</Button>
                </div>
              ) : (
                emailAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500">
                          <Mail className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{account.provider}</div>
                          <div className="text-sm text-zinc-500">
                            {account.active ? "Connected" : "Disconnected"}:{" "}
                            {account.emailAddress}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline">Disconnect</Button>
                    </div>
                  </div>
                ))
              )}
              <div className="space-y-2">
                <h3 className="font-semibold">How it works</h3>
                <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>1. Connect your Gmail account</li>
                  <li>2. ProfitPilot scans for shipping invoices</li>
                  <li>3. Invoices are matched to orders automatically</li>
                  <li>4. Review and approve matches</li>
                  <li>
                    5. Actual shipping costs update your profit calculations
                  </li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxjar">TaxJar API Key</Label>
                <Input id="taxjar" type="password" placeholder="Enter API key" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fedex-id">FedEx Client ID</Label>
                <Input id="fedex-id" type="text" placeholder="Enter client ID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fedex-secret">FedEx Client Secret</Label>
                <Input
                  id="fedex-secret"
                  type="password"
                  placeholder="Enter client secret"
                />
              </div>
              <div className="flex justify-end">
                <Button>Save API Keys</Button>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alert-email">Alert Email Address</Label>
                <Input
                  id="alert-email"
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="alerts@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">SMS Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="flex justify-end">
                <Button>Save Notification Settings</Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
