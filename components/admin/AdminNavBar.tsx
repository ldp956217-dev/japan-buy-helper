"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Package, ClipboardList, Users, LogOut, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "商品管理", icon: Package, exact: true },
  { href: "/admin/reservations", label: "預定明細", icon: ClipboardList, exact: false },
  { href: "/admin/buyers", label: "購買人", icon: Users, exact: false },
];

export function AdminNavBar() {
  const pathname = usePathname();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        const { products, buyers, reservations } = json.data;
        setSyncMsg(`✓ 同步完成：${products} 商品 / ${buyers} 購買人 / ${reservations} 明細`);
      } else {
        setSyncMsg(`✗ ${json.error}`);
      }
    } catch {
      setSyncMsg("✗ 網路錯誤");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(""), 5000);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/admin" className="flex items-center gap-2 font-bold">
          <span className="text-lg">🇯🇵</span>
          <span className="text-sm font-semibold">日本代購 後台</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors min-h-[44px] justify-center",
                  isActive
                    ? "bg-white/20 text-white font-medium"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}

          {/* 同步 Google Sheets */}
          <button
            onClick={handleSync}
            disabled={syncing}
            title="同步到 Google Sheets"
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] justify-center disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
            <span className="hidden sm:inline">同步試算表</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex flex-col sm:flex-row items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] justify-center ml-1"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">登出</span>
          </button>
        </nav>
      </div>

      {/* 同步結果提示列 */}
      {syncMsg && (
        <div className={cn(
          "text-center text-xs py-1.5 px-4",
          syncMsg.startsWith("✓") ? "bg-green-700 text-green-100" : "bg-red-700 text-red-100"
        )}>
          {syncMsg}
        </div>
      )}
    </header>
  );
}
