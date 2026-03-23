"use client";

import { useState, useEffect } from "react";
import { Mail, Plus, Trash2, Loader2, User, Key, Bell, DollarSign, Settings, ChevronRight } from "lucide-react";
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

const tabs = [
  { id: "account", label: "Account", icon: User },
  { id: "costs", label: "Custom Costs", icon: DollarSign },
  { id: "email", label: "Email Connection", icon: Mail },
  { id: "api", label: "API Keys", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function SettingsPage() {
  const { data, loading, error, refetch } = useApi<SettingsResponse>("/api/settings");

  const [activeTab, setActiveTab] = useState("account");
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
    toast.success("Rule toggled");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#acaab1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#ee7d77]">{error}</p>
        <button
          onClick={refetch}
          className="px-4 py-2 rounded-lg border border-[#47474e]/30 text-[#e7e4ec] text-sm font-medium hover:bg-[#25252b] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const costRules = data?.costRules ?? [];
  const emailAccounts = data?.emailAccounts ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#e7e4ec]">Settings</h1>
        <p className="text-sm text-[#acaab1] mt-1">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3">
          <nav className="bg-[#131316] rounded-xl border border-[#47474e]/10 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#25252b] text-[#e7e4ec] border-l-2 border-[#c6c6c7]"
                      : "text-[#acaab1] hover:bg-[#19191d] hover:text-[#e7e4ec] border-l-2 border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <ChevronRight className={`h-3.5 w-3.5 ml-auto transition-opacity ${isActive ? "opacity-100" : "opacity-0"}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <div className="bg-[#131316] rounded-xl border border-[#47474e]/10 p-6 lg:p-8">
            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#e7e4ec]">Account</h2>
                  <p className="text-sm text-[#acaab1] mt-1">Update your personal details</p>
                </div>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Name</label>
                    <input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#75757c] text-sm cursor-not-allowed"
                    />
                    <p className="text-xs text-[#75757c]">Email cannot be changed</p>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSaveAccount}
                      className="px-5 py-2.5 bg-gradient-to-b from-[#c6c6c7] to-[#454747] text-[#3f4041] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Costs Tab */}
            {activeTab === "costs" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-[#e7e4ec]">Cost Rules</h2>
                    <p className="text-sm text-[#acaab1] mt-1">Add custom costs to include in profit calculations</p>
                  </div>
                  <button
                    onClick={() => setDialogOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-b from-[#c6c6c7] to-[#454747] text-[#3f4041] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Plus className="h-4 w-4" />
                    Add Rule
                  </button>
                </div>

                {costRules.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#47474e]/30 p-10 text-center">
                    <DollarSign className="h-10 w-10 text-[#75757c] mx-auto mb-3" />
                    <p className="text-sm text-[#acaab1]">
                      No custom cost rules yet. Add one to include recurring costs in your profit calculations.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#47474e]/20">
                          <th className="pb-3 text-left text-[11px] font-bold text-[#acaab1] uppercase tracking-wider">Name</th>
                          <th className="pb-3 text-left text-[11px] font-bold text-[#acaab1] uppercase tracking-wider">Type</th>
                          <th className="pb-3 text-left text-[11px] font-bold text-[#acaab1] uppercase tracking-wider">Amount</th>
                          <th className="pb-3 text-left text-[11px] font-bold text-[#acaab1] uppercase tracking-wider">Applies To</th>
                          <th className="pb-3 text-center text-[11px] font-bold text-[#acaab1] uppercase tracking-wider">Active</th>
                          <th className="pb-3 text-right text-[11px] font-bold text-[#acaab1] uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costRules.map((rule) => (
                          <tr
                            key={rule.id}
                            className="border-b border-[#47474e]/10 hover:bg-[#19191d] transition-colors"
                          >
                            <td className="py-3.5 text-sm text-[#e7e4ec]">{rule.name}</td>
                            <td className="py-3.5">
                              <span className="px-2 py-1 text-xs font-medium text-[#acaab1] bg-[#25252b] rounded-md">
                                {rule.type}
                              </span>
                            </td>
                            <td className="py-3.5 text-sm text-[#e7e4ec]">
                              {rule.type === "percentage" || rule.type === "Percentage of Revenue"
                                ? `${rule.amount}%`
                                : `$${rule.amount.toFixed(2)}`}
                            </td>
                            <td className="py-3.5 text-sm text-[#acaab1]">{rule.appliesTo}</td>
                            <td className="py-3.5 text-center">
                              <button
                                onClick={() => handleToggleRule(rule.id)}
                                className={`relative w-10 h-5 rounded-full transition-colors ${
                                  rule.active ? "bg-[#73f08c]" : "bg-[#47474e]"
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                                    rule.active ? "left-5" : "left-0.5"
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="py-3.5 text-right">
                              <button
                                disabled={deletingId === rule.id}
                                onClick={() => handleDeleteRule(rule.id)}
                                className="p-2 rounded-lg hover:bg-[#7f2927]/20 transition-colors"
                              >
                                {deletingId === rule.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin text-[#acaab1]" />
                                ) : (
                                  <Trash2 className="h-4 w-4 text-[#ee7d77]" />
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add Rule Dialog */}
                {dialogOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-[#19191d] rounded-xl border border-[#47474e]/20 p-6 w-full max-w-md shadow-2xl">
                      <h3 className="text-lg font-bold text-[#e7e4ec] mb-1">Add Cost Rule</h3>
                      <p className="text-sm text-[#acaab1] mb-6">Configure a custom cost to include in profit calculations</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Rule Name</label>
                          <input
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            placeholder="e.g., Packaging Cost"
                            className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Cost Type</label>
                          <select
                            value={costType}
                            onChange={(e) => setCostType(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                          >
                            <option value="per-order">Per Order</option>
                            <option value="percentage">Percentage of Revenue</option>
                            <option value="fixed">Fixed Monthly</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Amount</label>
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Applies To</label>
                          <select
                            value={appliesTo}
                            onChange={(e) => setAppliesTo(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                          >
                            <option value="all">All Orders</option>
                            <option value="sku">Specific SKU</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => setDialogOpen(false)}
                            className="px-4 py-2.5 rounded-lg border border-[#47474e]/30 text-[#e7e4ec] text-sm font-medium hover:bg-[#25252b] transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleAddRule}
                            disabled={addingRule}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#c6c6c7] to-[#454747] text-[#3f4041] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {addingRule && <Loader2 className="h-4 w-4 animate-spin" />}
                            Add Rule
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Connection Tab */}
            {activeTab === "email" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#e7e4ec]">Email Connection</h2>
                  <p className="text-sm text-[#acaab1] mt-1">Connect email to enable the shipping cost agent</p>
                </div>

                {emailAccounts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#47474e]/30 p-10 text-center">
                    <Mail className="h-10 w-10 text-[#75757c] mx-auto mb-3" />
                    <p className="text-sm text-[#acaab1] mb-4">
                      No email accounts connected. Connect one to enable the shipping agent.
                    </p>
                    <button className="px-5 py-2.5 bg-gradient-to-b from-[#c6c6c7] to-[#454747] text-[#3f4041] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                      Connect Email Account
                    </button>
                  </div>
                ) : (
                  emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl bg-[#19191d] border border-[#47474e]/10 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7f2927]">
                            <Mail className="h-5 w-5 text-[#ff9993]" />
                          </div>
                          <div>
                            <div className="font-medium text-[#e7e4ec]">{account.provider}</div>
                            <div className="text-sm text-[#acaab1]">
                              {account.active ? (
                                <span className="text-[#73f08c]">Connected</span>
                              ) : (
                                <span className="text-[#ee7d77]">Disconnected</span>
                              )}
                              {" · "}
                              {account.emailAddress}
                            </div>
                          </div>
                        </div>
                        <button className="px-4 py-2 rounded-lg border border-[#47474e]/30 text-[#acaab1] text-sm font-medium hover:bg-[#25252b] transition-colors">
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))
                )}

                <div className="bg-[#19191d] rounded-xl p-5 border border-[#47474e]/10">
                  <h3 className="font-bold text-[#e7e4ec] mb-3">How it works</h3>
                  <ol className="space-y-2.5 text-sm text-[#acaab1]">
                    <li className="flex gap-3"><span className="text-[#c6c6c7] font-bold">1.</span> Connect your Gmail account</li>
                    <li className="flex gap-3"><span className="text-[#c6c6c7] font-bold">2.</span> ProfitPilot scans for shipping invoices</li>
                    <li className="flex gap-3"><span className="text-[#c6c6c7] font-bold">3.</span> Invoices are matched to orders automatically</li>
                    <li className="flex gap-3"><span className="text-[#c6c6c7] font-bold">4.</span> Review and approve matches</li>
                    <li className="flex gap-3"><span className="text-[#c6c6c7] font-bold">5.</span> Actual shipping costs update your profit calculations</li>
                  </ol>
                </div>
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === "api" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#e7e4ec]">API Keys</h2>
                  <p className="text-sm text-[#acaab1] mt-1">Connect third-party services</p>
                </div>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="taxjar" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">TaxJar API Key</label>
                    <input id="taxjar" type="password" placeholder="Enter API key" className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fedex-id" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">FedEx Client ID</label>
                    <input id="fedex-id" type="text" placeholder="Enter client ID" className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="fedex-secret" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">FedEx Client Secret</label>
                    <input id="fedex-secret" type="password" placeholder="Enter client secret" className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button className="px-5 py-2.5 bg-gradient-to-b from-[#c6c6c7] to-[#454747] text-[#3f4041] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                      Save API Keys
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[#e7e4ec]">Notifications</h2>
                  <p className="text-sm text-[#acaab1] mt-1">Configure how you receive alerts</p>
                </div>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <label htmlFor="alert-email" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">Alert Email Address</label>
                    <input
                      id="alert-email"
                      type="email"
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      placeholder="alerts@example.com"
                      className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-xs font-semibold text-[#acaab1] uppercase tracking-wider">SMS Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      value={alertPhone}
                      onChange={(e) => setAlertPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2.5 bg-[#25252b] border-none rounded-lg text-[#e7e4ec] text-sm placeholder-[#75757c] focus:outline-none focus:ring-1 focus:ring-[#75757c]"
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button className="px-5 py-2.5 bg-gradient-to-b from-[#c6c6c7] to-[#454747] text-[#3f4041] text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                      Save Notification Settings
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
