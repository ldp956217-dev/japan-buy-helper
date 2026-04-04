/**
 * TC-SYNC：Google Sheets 同步 API 測試
 */
import { test, expect } from "@playwright/test";

test.describe("TC-SYNC Google Sheets 同步", () => {
  test("SYNC-01 同步 API 端點存在且有管理員權限保護", async ({ page }) => {
    await page.goto("/");
    // 未登入直接呼叫應被擋（middleware 保護 /api/admin/*）
    const res = await page.evaluate(async () => {
      const r = await fetch("/api/admin/sync", { method: "POST" });
      return r.status;
    });
    // 應被 middleware 重導（3xx）或 401
    expect([302, 307, 401, 403]).toContain(res);
  });

  test("SYNC-02 登入後呼叫同步 API 應成功（Mock 模式）", async ({ page }) => {
    await page.goto("/");
    const result = await page.evaluate(async () => {
      // 先登入
      await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "admin1234" }),
        credentials: "include",
      });
      // 呼叫同步
      const r = await fetch("/api/admin/sync", { method: "POST", credentials: "include" });
      return await r.json();
    });
    // Mock 模式下應成功（不實際寫 Sheets）
    expect(result.success).toBe(true);
    expect(result.data.products).toBeGreaterThan(0);
  });

  test("SYNC-03 後台 NavBar 顯示同步試算表按鈕", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("input").first().fill("admin");
    await page.locator('input[type="password"]').fill("admin1234");
    await page.locator('button[type="submit"], button:has-text("登入")').click();
    await page.waitForURL("**/admin");
    await expect(page.locator('button[title="同步到 Google Sheets"]').or(page.locator('button:has-text("同步試算表")')).first()).toBeVisible();
  });
});
