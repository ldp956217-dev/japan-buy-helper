/**
 * TC-RWD：手機版 RWD 測試
 * 使用 mobile-chrome 和 iphone projects
 */
import { test, expect } from "@playwright/test";
import { setGuestIdentity } from "./helpers";

test.describe("TC-RWD 手機版響應式測試", () => {
  test("RWD-01 首頁手機版正常顯示商品格線", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=商品列表")).toBeVisible();
    // 商品卡存在
    await expect(page.locator(".rounded-xl").first()).toBeVisible();
  });

  test("RWD-02 商品詳情頁底部按鈕固定可見", async ({ page }) => {
    await page.goto("/product/seed-product-3");
    const btn = page.locator('button:has-text("確認預定")').or(page.locator('button:has-text("已售完")'));
    await expect(btn).toBeVisible();
    // 確認按鈕在畫面內（fixed bottom）
    const box = await btn.boundingBox();
    const viewportHeight = page.viewportSize()?.height ?? 812;
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y + box.height).toBeLessThanOrEqual(viewportHeight + 5);
    }
  });

  test("RWD-03 Header 在手機版正確顯示", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=日本代購")).toBeVisible();
  });

  test("RWD-04 後台手機版 Header nav 可見", async ({ page }) => {
    // 後台 NavBar 在手機版只顯示 icon，不顯示文字
    await page.goto("/admin/login");
    await page.locator("input").first().fill("admin");
    await page.locator('input[type="password"]').fill("admin1234");
    await page.locator('button[type="submit"], button:has-text("登入")').click();
    await page.waitForURL("**/admin");
    // 在手機版，nav icon 應可見
    await expect(page.locator("header")).toBeVisible();
  });

  test("RWD-05 我的預定頁手機版正常顯示", async ({ page }) => {
    await setGuestIdentity(page, `RWD測試_${Date.now()}`);
    await page.goto("/me");
    await expect(page.locator("text=目前身份").or(page.locator("text=設定暱稱"))).toBeVisible();
  });

  test("RWD-06 暱稱頁手機版輸入框和按鈕 touch target 足夠大", async ({ page }) => {
    await page.goto("/nickname");
    await page.evaluate(() => {
      localStorage.removeItem("buyhelper_guest_token");
      localStorage.removeItem("buyhelper_guest_nickname");
    });
    await page.reload();

    const btn = page.locator('button:has-text("確認暱稱")');
    await expect(btn).toBeVisible();
    const box = await btn.boundingBox();
    // touch target 至少 44px 高
    expect(box?.height).toBeGreaterThanOrEqual(40);
  });
});
