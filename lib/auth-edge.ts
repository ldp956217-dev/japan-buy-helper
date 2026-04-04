/**
 * Edge Runtime 相容的 auth 工具（給 middleware 用）
 * 不可 import Node.js built-in（如 crypto）
 */
import { jwtVerify } from "jose";

export const COOKIE_NAME = "buyhelper_admin_token";

function getSecretKey() {
  const secret = process.env.JWT_SECRET || "fallback-secret-please-change";
  return new TextEncoder().encode(secret);
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
