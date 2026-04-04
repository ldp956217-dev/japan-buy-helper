/**
 * TC-PROD：商品管理測試（後台）
 */
import { test, expect } from "@playwright/test";
import { adminLogin } from "./helpers";

const TEST_PRODUCT = {
  name: `QA測試商品_${Date.now()}`,
  stock: "5",
  price: "299",
  cost: "150",
  note: "這是自動測試新增的商品",
  storeName: "松本清",
};

test.describe("TC-PROD 商品管理", () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test("PROD-01 商品列表頁正常顯示", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=商品管理")).toBeVisible();
    await expect(page.locator("text=新增商品")).toBeVisible();
  });

  test("PROD-02 新增商品表單驗證 - 空白送出應顯示錯誤", async ({ page }) => {
    await page.goto("/admin/products/new");
    await page.locator('button:has-text("上架商品")').click();
    await expect(page.locator("text=請輸入商品名稱")).toBeVisible();
  });

  test("PROD-03 成功新增商品並出現在列表", async ({ page }) => {
    await page.goto("/admin/products/new");
    await page.locator("#name").fill(TEST_PRODUCT.name);
    await page.locator("#totalStock").fill(TEST_PRODUCT.stock);
    await page.locator("#price").fill(TEST_PRODUCT.price);
    await page.locator("#cost").fill(TEST_PRODUCT.cost);
    await page.locator("#storeName").fill(TEST_PRODUCT.storeName);
    await page.locator("#note").fill(TEST_PRODUCT.note);
    await page.locator('button:has-text("上架商品")').click();

    // 應導回後台首頁
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator(`text=${TEST_PRODUCT.name}`)).toBeVisible();
  });

  test("PROD-04 編輯商品頁正常載入（無 parse error）", async ({ page }) => {
    await page.goto("/admin");
    const editBtn = page.locator('a:has-text("編輯")').first();
    await editBtn.click();
    await expect(page).toHaveURL(/\/edit/);
    // 關鍵：確認「建議圖片大小」文字正確渲染（之前有 < 5MB parse bug）
    await expect(page.locator("text=建議圖片大小")).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#price")).toBeVisible();
  });

  test("PROD-05 售價欄標籤顯示 TWD ($)", async ({ page }) => {
    await page.goto("/admin/products/new");
    await expect(page.locator("text=售價 ($)")).toBeVisible();
    // 成本仍顯示 JPY
    await expect(page.locator("text=成本 (¥)")).toBeVisible();
  });

  test("PROD-06 複製商品連結按鈕存在", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator('button:has-text("複製商品連結")').first()).toBeVisible();
  });

  test("PROD-07 庫存快速調整按鈕存在於編輯頁", async ({ page }) => {
    await page.goto("/admin");
    await page.locator('a:has-text("編輯")').first().click();
    await expect(page.locator('button:has-text("+1")').or(page.locator('button:has-text("+5")'))).toBeVisible();
  });

  test("PROD-08 後台商品列表顯示台幣售價和日幣成本", async ({ page }) => {
    await page.goto("/admin");
    // 台幣符號 $
    const priceEl = page.locator(".text-primary").first();
    await expect(priceEl).toContainText("$");
    // 成本顯示 ¥
    await expect(page.locator("text=成本 ¥").first()).toBeVisible();
  });
});
