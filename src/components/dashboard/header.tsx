"use client";

import { signOut, useSession } from "next-auth/react";
import { Bell, Moon, Search, LogOut, Settings } from "lucide-react";
import { useTheme } from "next-themes";

export function Header() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : session?.user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="h-16 sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex justify-between items-center px-8">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant h-4 w-4" />
          <input
            className="w-full bg-surface-container-highest border-none rounded-lg pl-10 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-outline/20 placeholder:text-outline text-on-surface"
            placeholder="Search..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="p-2 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Moon className="h-5 w-5" />
        </button>

        <button className="p-2 text-outline hover:text-on-surface transition-colors rounded-full hover:bg-surface-container relative">
          <Bell className="h-5 w-5" />
        </button>

        <div className="h-8 w-px bg-outline-variant/20 mx-1" />

        <div className="relative group">
          <button className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-on-surface leading-none">
                {session?.user?.name || "User"}
              </p>
              <p className="text-[10px] text-outline font-medium">
                {session?.user?.email || ""}
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-xs font-bold text-m3-primary">
              {initials}
            </div>
          </button>

          <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="p-3 border-b border-outline-variant/10">
              <p className="text-sm font-semibold text-on-surface">{session?.user?.name || "User"}</p>
              <p className="text-xs text-on-surface-variant">{session?.user?.email}</p>
            </div>
            <a
              href="/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </a>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-container/10 transition-colors w-full rounded-b-xl"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
