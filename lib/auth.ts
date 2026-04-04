/**
 * Admin 身分驗證工具
 * 使用 JWT (jose) 做輕量 cookie session
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-please-change";
const COOKIE_NAME = "buyhelper_admin_token";
const JWT_EXPIRY = "7d";

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET);
}

export function hashPassword(password: string): string {
  const salt = "japan_buy_helper_salt";
  return crypto
    .createHash("sha256")
    .update(password + salt)
    .digest("hex");
}

export async function signAdminToken(payload: {
  adminId: string;
  username: string;
}): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(getSecretKey());
}

export async function verifyAdminToken(
  token: string
): Promise<{ adminId: string; username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as { adminId: string; username: string };
  } catch {
    return null;
  }
}

/** 從 cookie 取得當前 admin session，供 Server Component 使用 */
export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

/** 設定 admin cookie（在 Route Handler 內呼叫） */
export function getAdminCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };
}

export { COOKIE_NAME };
