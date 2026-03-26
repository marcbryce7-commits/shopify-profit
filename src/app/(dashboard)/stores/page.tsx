"use client";

import { useState } from "react";
import {
  Store as StoreIcon,
  ExternalLink,
  Trash2,
  Plus,
  RefreshCw,
  Loader2,
  Package,
} from "lucide-react";
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
import { useApi, apiPost, apiDelete, apiPatch } from "@/hooks/use-api";

interface Store {
  id: string;
  userId: string;
  shopifyDomain: string;
  name: string;
  status: string;
  poPrefix: string | null;
  ignoredSenders: string | null;
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

  const handleSaveStoreSettings = async (storeId: string) => {
    const poInput = document.getElementById(`po-${storeId}`) as HTMLInputElement;
    const ignoreInput = document.getElementById(`ignore-${storeId}`) as HTMLTextAreaElement;
    try {
      await apiPatch("/api/stores", {
        storeId,
        poPrefix: poInput?.value || "",
        ignoredSenders: ignoreInput?.value || "",
      });
      toast.success("Store settings saved");
      refetch();
    } catch {
      toast.error("Failed to save settings");
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
        <Label htmlFor="domain" className="text-on-surface text-sm font-medium">
          Store Domain
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="domain"
            value={storeDomain}
            onChange={(e) => setStoreDomain(e.target.value)}
            placeholder="mystore"
            className="bg-surface-container-high border-outline-variant text-on-surface placeholder:text-on-surface-variant"
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
          />
          <span className="text-sm text-on-surface-variant whitespace-nowrap">.myshopify.com</span>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#73f08c] to-[#3ecf8e] px-5 py-2.5 text-sm font-semibold text-[#0a2218] transition-all hover:brightness-110 disabled:opacity-50"
        >
          {connecting && <Loader2 className="h-4 w-4 animate-spin" />}
          Connect
        </button>
      </div>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-on-surface">
          Stores
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Connect and manage your Shopify stores
        </p>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#73f08c] to-[#3ecf8e] px-5 py-2.5 text-sm font-semibold text-[#0a2218] shadow-lg shadow-[#73f08c]/20 transition-all hover:brightness-110">
              <Plus className="h-4 w-4" />
              Connect Store
            </button>
          }
        />
        <DialogContent className="bg-surface-container border-outline-variant">
          <DialogHeader>
            <DialogTitle className="text-on-surface">Connect a Shopify Store</DialogTitle>
            <DialogDescription className="text-on-surface-variant">
              Enter your Shopify store domain to connect
            </DialogDescription>
          </DialogHeader>
          {connectStoreDialog}
        </DialogContent>
      </Dialog>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-8">
        {header}
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-on-surface-variant" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        {header}
        <div className="bg-surface-container-low rounded-xl p-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-error">Failed to load stores: {error}</p>
            <button
              onClick={refetch}
              className="rounded-lg border border-outline-variant bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {header}

      {stores.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl p-16">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="rounded-2xl bg-surface-container p-4">
              <StoreIcon className="h-12 w-12 text-on-surface-variant" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-on-surface">
                No stores connected
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Connect your first Shopify store to start tracking profits.
              </p>
            </div>
            <Dialog>
              <DialogTrigger
                render={
                  <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#73f08c] to-[#3ecf8e] px-5 py-2.5 text-sm font-semibold text-[#0a2218] shadow-lg shadow-[#73f08c]/20 transition-all hover:brightness-110">
                    <Plus className="h-4 w-4" />
                    Connect Your First Store
                  </button>
                }
              />
              <DialogContent className="bg-surface-container border-outline-variant">
                <DialogHeader>
                  <DialogTitle className="text-on-surface">Connect a Shopify Store</DialogTitle>
                  <DialogDescription className="text-on-surface-variant">
                    Enter your Shopify store domain to connect
                  </DialogDescription>
                </DialogHeader>
                {connectStoreDialog}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const isActive = store.status === "active";
            const isSyncing = syncingStoreId === store.id;
            const isDeleting = deletingStoreId === store.id;

            return (
              <div
                key={store.id}
                className="group relative flex overflow-hidden rounded-xl bg-surface-container-low p-6"
              >
                {/* Green left border for active stores */}
                {isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-[#73f08c]" />
                )}

                <div className="flex w-full flex-col gap-4">
                  {/* Top row: icon, name, status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container">
                        <StoreIcon className="h-5 w-5 text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-on-surface">
                          {store.name}
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          {store.shopifyDomain}
                        </p>
                      </div>
                    </div>
                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        isActive
                          ? "bg-[#73f08c]/10 text-tertiary-dim"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#73f08c] opacity-75" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#73f08c]" />
                        </span>
                      )}
                      {isActive
                        ? "Active"
                        : store.status.charAt(0).toUpperCase() + store.status.slice(1)}
                    </span>
                  </div>

                  {/* Stats section */}
                  <div className="flex items-center gap-4 rounded-lg bg-surface-container px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Package className="h-3.5 w-3.5 text-on-surface-variant" />
                      <span className="text-xs text-on-surface-variant">Orders synced</span>
                    </div>
                    <div className="ml-auto text-xs text-on-surface-variant">
                      Last sync: {formatLastSync(store.lastSyncAt)}
                    </div>
                  </div>

                  {/* Email Scanner Settings */}
                  <div className="rounded-lg bg-surface-container-high/30 p-3 space-y-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        PO Prefix
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RECOUT"
                        defaultValue={store.poPrefix || ""}
                        id={`po-${store.id}`}
                        className="mt-1 w-full rounded-lg bg-surface-container border-none px-3 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/30"
                      />
                      <p className="mt-0.5 text-[10px] text-on-surface-variant/60">
                        Searches for prefix + order number, customer name, and customer email
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                        Ignored Email Addresses
                      </label>
                      <textarea
                        placeholder="e.g. mailer@shopify.com, no-reply@mystore.com"
                        defaultValue={store.ignoredSenders || ""}
                        id={`ignore-${store.id}`}
                        rows={2}
                        className="mt-1 w-full rounded-lg bg-surface-container border-none px-3 py-1.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                      />
                      <p className="mt-0.5 text-[10px] text-on-surface-variant/60">
                        Comma-separated list of sender emails to skip during scans
                      </p>
                    </div>
                    <button
                      onClick={() => handleSaveStoreSettings(store.id)}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-on-primary transition-colors hover:bg-primary-dim"
                    >
                      Save Settings
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      disabled={isSyncing}
                      onClick={() => handleSync(store.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50"
                    >
                      {isSyncing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Sync
                    </button>
                    <a
                      href={`https://${store.shopifyDomain}/admin`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-high"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </a>
                    <button
                      disabled={isDeleting}
                      onClick={() => handleDelete(store.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-xs font-medium text-error transition-colors hover:bg-surface-container-high disabled:opacity-50"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
