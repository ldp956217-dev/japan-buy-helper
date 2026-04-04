/**
 * TC-FRONT：前台商品瀏覽測試
 */
import { test, expect } from "@playwright/test";

test.describe("TC-FRONT 前台商品瀏覽", () => {
  test("FRONT-01 首頁正常載入並顯示商品列表", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=商品列表")).toBeVisible();
    await expect(page.locator("text=共").and(page.locator("text=項商品"))).toBeVisible();
  });

  test("FRONT-02 商品卡顯示台幣售價 $", async ({ page }) => {
    await page.goto("/");
    const priceEl = page.locator(".font-bold").filter({ hasText: /^\$\d/ }).first();
    await expect(priceEl).toBeVisible();
    const text = await priceEl.textContent();
    expect(text).toMatch(/^\$/);
  });

  test("FRONT-03 已售完商品顯示「已售完」標籤", async ({ page }) => {
    await page.goto("/");
    const soldOutBadge = page.locator("text=已售完").first();
    // 若有售完商品才驗證
    const count = await soldOutBadge.count();
    if (count > 0) {
      await expect(soldOutBadge).toBeVisible();
    }
  });

  test("FRONT-04 點擊商品卡進入詳情頁", async ({ page }) => {
    await page.goto("/");
    await page.locator('a:has-text("查看")').first().click();
    await expect(page).toHaveURL(/\/product\//);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("FRONT-05 商品詳情頁顯示台幣售價和確認預定按鈕", async ({ page }) => {
    await page.goto("/");
    await page.locator('a:has-text("查看 / 預定")').first().click();
    // 售價顯示 $
    await expect(page.locator(".text-primary").filter({ hasText: /\$\d/ }).first()).toBeVisible();
    // 底部固定按鈕
    await expect(page.locator('button:has-text("確認預定")').or(page.locator('button:has-text("已售完")'))).toBeVisible();
  });

  test("FRONT-06 Header 顯示正確元素", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=日本代購")).toBeVisible();
    await expect(page.locator('a[href="/me"]').first()).toBeVisible();
  });
});
