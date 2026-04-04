/**
 * Next.js Middleware
 * 保護 /admin/* 路由（/admin/login 除外）
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth-edge";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 只保護 /admin 系列路由
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // /admin/login 不保護
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // 驗證 JWT cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const session = await verifyAdminToken(token);
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
