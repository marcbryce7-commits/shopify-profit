"use client";

import { useState } from "react";
import { Mail, Clock, CheckCircle, AlertCircle, Play, Upload, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApi, apiPost } from "@/hooks/use-api";

interface EmailLog {
  id: string;
  userId: string;
  emailSubject: string;
  sender: string;
  receivedAt: string;
  processedAt: string | null;
  status: string;
  extractedData: {
    invoice?: string;
    supplier?: string;
    amount?: number;
    order?: string;
    confidence?: number;
    scanned?: number;
    found?: number;
    matched?: number;
    errors?: number;
    duration?: string;
  } | null;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  emailAddress: string;
  label: string;
  active: boolean;
  lastScannedAt: string | null;
}

interface ShippingResponse {
  pendingReview: EmailLog[];
  recentHistory: EmailLog[];
  connectedAccounts: ConnectedAccount[];
}

export default function ShippingPage() {
  const { data, loading, error, refetch } = useApi<ShippingResponse>("/api/shipping");
  const [autoScan, setAutoScan] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const handleRunAgent = async () => {
    setRunning(true);
    try {
      await apiPost("/api/shipping");
      toast.success("Shipping agent started successfully");
      refetch();
    } catch {
      toast.error("Failed to start shipping agent");
    } finally {
      setRunning(false);
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

  const pendingReview = data?.pendingReview ?? [];
  const recentHistory = data?.recentHistory ?? [];
  const connectedAccounts = data?.connectedAccounts ?? [];
  const activeAccount = connectedAccounts.find((a) => a.active);
  const matchedCount = recentHistory.reduce(
    (sum, r) => sum + (r.extractedData?.matched ?? 0),
    0
  );

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Less than 1 hour ago";
    if (hours === 1) return "1 hour ago";
    return `${hours} hours ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shipping Agent</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            AI-powered shipping cost reconciliation from invoices and emails
          </p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="auto-scan">Auto-scan every 6h</Label>
            <Switch id="auto-scan" checked={autoScan} onCheckedChange={setAutoScan} />
          </div>
          <Button onClick={handleRunAgent} disabled={running}>
            {running ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Run Agent Now
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Email Connection
            </CardTitle>
            <Mail className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            {activeAccount ? (
              <>
                <Badge variant="success">Connected</Badge>
                <p className="mt-1 text-xs text-zinc-500">{activeAccount.emailAddress}</p>
              </>
            ) : (
              <Badge variant="outline">Not Connected</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Last Scan
            </CardTitle>
            <Clock className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {formatTimeAgo(activeAccount?.lastScannedAt ?? null)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Matched
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{matchedCount} invoices matched</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Pending Review
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{pendingReview.length} need approval</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="review">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="review">Review Queue</TabsTrigger>
              <TabsTrigger value="history">Processing History</TabsTrigger>
              <TabsTrigger value="upload">Manual Upload</TabsTrigger>
              <TabsTrigger value="fedex">FedEx</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="review" className="mt-0">
              {selectedItems.length > 0 && (
                <div className="mb-4 flex items-center justify-between rounded-lg bg-zinc-100 p-3 dark:bg-zinc-800">
                  <span className="text-sm font-medium">
                    {selectedItems.length} selected
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Approve All
                    </Button>
                    <Button size="sm" variant="outline">
                      Reject All
                    </Button>
                  </div>
                </div>
              )}
              {pendingReview.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  No invoices pending review.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800">
                        <th className="w-12 pb-3"></th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Invoice #
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Supplier
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                          Amount
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Matched Order
                        </th>
                        <th className="pb-3 text-left text-xs font-medium text-zinc-500">
                          Confidence
                        </th>
                        <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingReview.map((item) => {
                        const ext = item.extractedData;
                        const confidence = ext?.confidence ?? 0;
                        return (
                          <tr
                            key={item.id}
                            className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                          >
                            <td className="py-3">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedItems([...selectedItems, item.id]);
                                  } else {
                                    setSelectedItems(selectedItems.filter((id) => id !== item.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-3 text-sm">{ext?.invoice ?? item.emailSubject}</td>
                            <td className="py-3 text-sm">{ext?.supplier ?? item.sender}</td>
                            <td className="py-3 text-right text-sm">
                              ${(ext?.amount ?? 0).toFixed(2)}
                            </td>
                            <td className="py-3 text-sm text-blue-600">{ext?.order ?? "—"}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                  <div
                                    className={`h-full ${
                                      confidence > 80
                                        ? "bg-green-600"
                                        : confidence > 50
                                          ? "bg-yellow-500"
                                          : "bg-red-600"
                                    }`}
                                    style={{ width: `${confidence}%` }}
                                  />
                                </div>
                                <span className="text-xs">{confidence}%</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline">
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline">
                                  Reject
                                </Button>
                                <Button size="sm" variant="ghost">
                                  Edit
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              {recentHistory.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-500">
                  No processing history yet.
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800">
                      <th className="pb-3 text-left text-xs font-medium text-zinc-500">Date</th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Emails Scanned
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Invoices Found
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Matched
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Errors
                      </th>
                      <th className="pb-3 text-right text-xs font-medium text-zinc-500">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentHistory.map((run) => {
                      const ext = run.extractedData;
                      return (
                        <tr
                          key={run.id}
                          className="border-b border-zinc-100 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        >
                          <td className="py-3 text-sm">
                            {new Date(run.processedAt ?? run.receivedAt).toLocaleString()}
                          </td>
                          <td className="py-3 text-right text-sm">{ext?.scanned ?? 0}</td>
                          <td className="py-3 text-right text-sm">{ext?.found ?? 0}</td>
                          <td className="py-3 text-right text-sm">{ext?.matched ?? 0}</td>
                          <td
                            className={`py-3 text-right text-sm ${
                              (ext?.errors ?? 0) > 0 ? "text-red-600" : ""
                            }`}
                          >
                            {ext?.errors ?? 0}
                          </td>
                          <td className="py-3 text-right text-sm">{ext?.duration ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-0">
              <div className="flex min-h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Upload className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
                  <div>
                    <p className="font-medium">Drop a PDF or CSV invoice here</p>
                    <p className="text-sm text-zinc-500">
                      Supported: PDF, CSV (FedEx billing format)
                    </p>
                  </div>
                  <Button>Choose File</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="fedex" className="mt-0">
              <div className="space-y-4">
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>Limitation notice:</strong> FedEx public APIs do not expose
                    actual billed amounts or post-shipment adjustments. Use the email
                    agent or upload FedEx billing CSV for 100% accuracy.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button>Connect FedEx Account</Button>
                  <Button variant="outline">Upload FedEx Billing CSV</Button>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
