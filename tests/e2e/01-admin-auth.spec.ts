/**
 * TC-AUTH：後台認證測試
 */
import { test, expect } from "@playwright/test";
import { adminLogin, ADMIN } from "./helpers";

test.describe("TC-AUTH 後台認證", () => {
  test("AUTH-01 未登入直接訪問後台應重導至登入頁", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("AUTH-02 錯誤密碼應顯示錯誤訊息", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator("input").first().fill(ADMIN.username);
    await page.locator('input[type="password"]').fill("wrong-password");
    await page.locator('button:has-text("登入")').click();
    await expect(page.locator("text=帳號或密碼錯誤").or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 });
  });

  test("AUTH-03 正確帳密應成功登入並進入後台", async ({ page }) => {
    await adminLogin(page);
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator("text=商品管理")).toBeVisible();
  });

  test("AUTH-04 登入後未登入頁 /admin/login 應可訪問（不強制跳轉）", async ({ page }) => {
    await adminLogin(page);
    await page.goto("/admin/login");
    // 登入頁應正常顯示（middleware 只保護 /admin，不含 /admin/login）
    await expect(page.locator("text=管理後台").or(page.locator("text=帳號"))).toBeVisible();
  });

  test("AUTH-05 登出後應無法訪問後台", async ({ page }) => {
    await adminLogin(page);
    // 按登出按鈕
    await page.locator('button:has-text("登出")').click();
    await expect(page).toHaveURL(/\/admin\/login/);
    // 再次直接訪問應被擋
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
