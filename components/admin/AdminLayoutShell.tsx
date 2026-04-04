"use client";

import { usePathname } from "next/navigation";
import { AdminNavBar } from "./AdminNavBar";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoginPage && <AdminNavBar />}
      <main className={isLoginPage ? "" : "max-w-5xl mx-auto px-4 py-6"}>
        {children}
      </main>
    </div>
  );
}
