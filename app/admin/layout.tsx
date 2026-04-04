/**
 * Admin Layout — login 頁不顯示 NavBar，其他頁面正常顯示
 * 路由保護由 middleware.ts 負責
 */
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
