import { Page } from "@playwright/test";

export const ADMIN = { username: "admin", password: "admin1234" };
export const BASE_URL = "http://localhost:3000";

/** 後台登入 */
export async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.locator('input').first().fill(ADMIN.username);
  await page.locator('input[type="password"]').fill(ADMIN.password);
  await page.locator('button[type="submit"], button:has-text("登入")').click();
  await page.waitForURL("**/admin");
}

/** 設定前台 guest 身份（透過 API） */
export async function setGuestIdentity(page: Page, nickname: string) {
  await page.goto("/");
  await page.evaluate(async (nick) => {
    const res = await fetch("/api/guests/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: nick }),
    });
    const json = await res.json();
    if (json.success) {
      localStorage.setItem("buyhelper_guest_token", json.data.guestToken);
      localStorage.setItem("buyhelper_guest_nickname", json.data.nickname);
    }
  }, nickname);
  await page.reload();
}

/** 取得目前庫存 */
export async function getProductStock(page: Page, productId: string): Promise<number> {
  const res = await page.evaluate(async (id) => {
    const r = await fetch(`/api/products/${id}`);
    return r.json();
  }, productId);
  return res.data?.availableStock ?? -1;
}
