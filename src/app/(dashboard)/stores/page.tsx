"use client";

import { useState } from "react";
import {
  Store as StoreIcon,
  Wifi,
  WifiOff,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useApi, apiPost, apiDelete } from "@/hooks/use-api";

interface Store {
  id: string;
  userId: string;
  shopifyDomain: string;
  name: string;
  status: string;
  lastSyncAt: string | null;
  createdAt: string;
}

interface RecentSync {
  id: string;
  storeId: string;
  status: string;
  completedAt: string;
}

interface StoresResponse {
  stores: Store[];
  recentSyncs: RecentSync[];
}

export default function StoresPage() {
  const { data, loading, error, refetch } = useApi<StoresResponse>("/api/stores");
  const [storeDomain, setStoreDomain] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
  const [deletingStoreId, setDeletingStoreId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const stores = data?.stores ?? [];

  const handleConnect = async () => {
    if (!storeDomain) {
      toast.error("Please enter a store domain");
      return;
    }

    setConnecting(true);
    try {
      const domain = storeDomain.includes(".myshopify.com")
        ? storeDomain
        : `${storeDomain}.myshopify.com`;
      // Redirect flow — the API returns a redirect URL
      window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(domain)}`;
    } catch (err) {
      toast.error("Failed to start connection flow");
      setConnecting(false);
    }
  };

  const handleSync = async (storeId: string) => {
    setSyncingStoreId(storeId);
    try {
      await apiPost(`/api/stores/${storeId}/sync`);
      toast.success("Sync started successfully");
      refetch();
    } catch (err) {
      toast.error("Failed to start sync");
    } finally {
      setSyncingStoreId(null);
    }
  };

  const handleDelete = async (storeId: string) => {
    setDeletingStoreId(storeId);
    try {
      await apiDelete("/api/stores", { storeId });
      toast.success("Store removed");
      refetch();
    } catch (err) {
      toast.error("Failed to remove store");
    } finally {
      setDeletingStoreId(null);
    }
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return "Never";
    const diff = Date.now() - new Date(lastSyncAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const connectStoreDialog = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="domain">Store Domain</Label>
        <div className="flex items-center gap-2">
          <Input
            id="domain"
            value={storeDomain}
            onChange={(e) => setStoreDomain(e.target.value)}
            placeholder="mystore"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
          <span className="text-sm text-zinc-500">.myshopify.com</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleConnect} disabled={connecting}>
          {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Connect
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect and manage your Shopify stores
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect and manage your Shopify stores
          </p>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-red-500">Failed to load stores: {error}</p>
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stores</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect and manage your Shopify stores
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Connect Store
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect a Shopify Store</DialogTitle>
              <DialogDescription>
                Enter your Shopify store domain to connect
              </DialogDescription>
            </DialogHeader>
            {connectStoreDialog}
          </DialogContent>
        </Dialog>
      </div>

      {stores.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <StoreIcon className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            <div>
              <h3 className="font-semibold">No stores connected</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Connect your first Shopify store to start tracking profits.
              </p>
            </div>
            <Dialog>
              <DialogTrigger
                render={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Your First Store
                  </Button>
                }
              />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect a Shopify Store</DialogTitle>
                  <DialogDescription>
                    Enter your Shopify store domain to connect
                  </DialogDescription>
                </DialogHeader>
                {connectStoreDialog}
              </DialogContent>
            </Dialog>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const isActive = store.status === "active";
            const isSyncing = syncingStoreId === store.id;
            const isDeleting = deletingStoreId === store.id;

            return (
              <Card key={store.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{store.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {store.shopifyDomain}
                      </CardDescription>
                    </div>
                    <Badge variant={isActive ? "success" : "destructive"}>
                      {isActive ? (
                        <>
                          <Wifi className="mr-1 h-3 w-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <WifiOff className="mr-1 h-3 w-3" />
                          {store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                        </>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">
                      Last sync: {formatLastSync(store.lastSyncAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={isSyncing}
                      onClick={() => handleSync(store.id)}
                    >
                      {isSyncing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Sync
                    </Button>
                    <a
                      href={`https://${store.shopifyDomain}/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      disabled={isDeleting}
                      onClick={() => handleDelete(store.id)}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
