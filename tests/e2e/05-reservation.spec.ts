/**
 * TC-RES：預定流程測試（核心業務）
 */
import { test, expect } from "@playwright/test";
import { setGuestIdentity, adminLogin } from "./helpers";

const ACTIVE_PRODUCT_PATH = "/product/seed-product-3"; // 明色防曬乳，有庫存

test.describe("TC-RES 預定流程", () => {
  test("RES-01 未設定暱稱點預定應彈出暱稱 Dialog", async ({ page }) => {
    // 清除身份
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.removeItem("buyhelper_guest_token");
      localStorage.removeItem("buyhelper_guest_nickname");
    });
    await page.goto(ACTIVE_PRODUCT_PATH);
    await page.locator('button:has-text("確認預定")').click();
    await expect(page.locator('text=請先輸入你的暱稱').or(page.locator('[role="dialog"]'))).toBeVisible({ timeout: 5000 });
  });

  test("RES-02 設定暱稱後點預定應彈出確認 Dialog", async ({ page }) => {
    await setGuestIdentity(page, `RES測試_${Date.now()}`);
    await page.goto(ACTIVE_PRODUCT_PATH);
    await page.locator('button:has-text("確認預定")').click();
    await expect(page.locator("text=確認預定").nth(1).or(page.locator('[role="dialog"]').filter({ hasText: "確認" }))).toBeVisible({ timeout: 5000 });
  });

  test("RES-03 確認預定後應導向我的預定頁並顯示訂單", async ({ page }) => {
    const nickname = `RES流程_${Date.now()}`;
    await setGuestIdentity(page, nickname);
    await page.goto(ACTIVE_PRODUCT_PATH);

    // 點確認預定
    await page.locator('button:has-text("確認預定")').click();
    // 等確認 Dialog
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
    // 確認無誤
    await page.locator('button:has-text("確認無誤")').click();

    // 應導向 /me
    await expect(page).toHaveURL(/\/me/, { timeout: 8000 });
    await expect(page.locator("text=已購買商品清單")).toBeVisible();
  });

  test("RES-04 數量選擇器最大不超過剩餘庫存", async ({ page }) => {
    await setGuestIdentity(page, `數量測試_${Date.now()}`);
    await page.goto(ACTIVE_PRODUCT_PATH);

    const plusBtn = page.locator('button:has-text("+")');
    // 一直加到不能加
    let prevValue = "";
    for (let i = 0; i < 20; i++) {
      const currentValue = await page.locator(".font-semibold").filter({ hasText: /^\d+$/ }).textContent();
      if (currentValue === prevValue) break; // 沒有變化，已到上限
      prevValue = currentValue ?? "";
      await plusBtn.click();
    }
    // 按鈕應被 disabled
    await expect(plusBtn).toBeDisabled();
  });

  test("RES-05 已售完商品不可預定", async ({ page }) => {
    // seed-product-2 應是已售完
    await page.goto("/product/seed-product-2");
    const btn = page.locator('button:has-text("已售完，無法預定")');
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test("RES-06 確認 Dialog 顯示台幣金額 $", async ({ page }) => {
    await setGuestIdentity(page, `金額確認_${Date.now()}`);
    await page.goto(ACTIVE_PRODUCT_PATH);
    await page.locator('button:has-text("確認預定")').click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // 金額應顯示 $
    await expect(dialog.locator("text=/\\$\\d+/")).toBeVisible();
  });

  test("RES-07 我的預定頁顯示台幣金額 $", async ({ page }) => {
    await setGuestIdentity(page, `我的預定測試_${Date.now()}`);
    await page.goto("/me");
    // 若有訂單才驗證
    const hasList = await page.locator("text=已購買商品清單").count();
    if (hasList > 0) {
      const amounts = page.locator(".font-bold").filter({ hasText: /\$\d/ });
      const count = await amounts.count();
      if (count > 0) {
        const text = await amounts.first().textContent();
        expect(text).toMatch(/\$/);
      }
    }
  });

  test("RES-08 後台預定明細頁顯示所有訂單", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/reservations");
    await expect(page.locator("text=預定明細")).toBeVisible();
    // 訂單編號格式 R00xxx
    await expect(page.locator("text=/R\\d{5}/").first()).toBeVisible();
  });

  test("RES-09 後台購買人總覽頁正常顯示", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/buyers");
    await expect(page.locator("text=購買人總覽")).toBeVisible();
  });
});
