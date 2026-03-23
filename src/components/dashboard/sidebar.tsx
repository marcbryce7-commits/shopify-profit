"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Store,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Megaphone,
  Truck,
  Receipt,
  Settings,
  AlertTriangle,
  FileEdit,
} from "lucide-react";

const navigation = [
  { name: "Overview", href: "/", icon: BarChart3 },
  { name: "Stores", href: "/stores", icon: Store },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "P&L Report", href: "/pnl", icon: FileText },
  { name: "Ad Spend", href: "/ads", icon: Megaphone },
  { name: "Shipping Agent", href: "/shipping", icon: Truck },
  { name: "Tax Portal", href: "/tax", icon: Receipt },
  { name: "Cost Alerts", href: "/alerts", icon: AlertTriangle },
  { name: "Content", href: "/content", icon: FileEdit },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-surface-container-low flex flex-col gap-y-4 p-6 border-r border-outline-variant/10 z-50">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-m3-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-on-surface">ProfitPilot</h1>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">Shopify Analytics</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium tracking-tight transition-all duration-200 rounded-lg",
                isActive
                  ? "text-on-surface font-semibold bg-surface-container"
                  : "text-outline hover:text-on-surface hover:bg-surface-container"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/10">
        <button className="w-full bg-gradient-to-br from-m3-primary to-primary-container text-on-primary py-2.5 rounded-lg font-bold text-sm transition-transform active:scale-95">
          Upgrade to Pro
        </button>
      </div>
    </aside>
  );
}
