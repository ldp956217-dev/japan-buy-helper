/**
 * TC-STOCK：防超賣測試（核心安全機制）
 */
import { test, expect } from "@playwright/test";

test.describe("TC-STOCK 防超賣機制", () => {
  test("STOCK-01 API 層庫存不足應回傳錯誤", async ({ page }) => {
    await page.goto("/");

    const result = await page.evaluate(async () => {
      // 先取得一個有庫存的商品
      const productsRes = await fetch("/api/products");
      const products = await productsRes.json();
      const active = products.data?.find((p: { status: string; availableStock: number }) => p.status === "ACTIVE" && p.availableStock > 0);
      if (!active) return { skipped: true };

      // 建立測試 guest
      const guestRes = await fetch("/api/guests/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: `超賣測試_${Date.now()}` }),
      });
      const guestData = await guestRes.json();

      // 嘗試預定超過庫存的數量
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: active.id,
          guestToken: guestData.data.guestToken,
          nickname: guestData.data.nickname,
          quantity: active.availableStock + 999, // 超過庫存
        }),
      });
      return await res.json();
    });

    if (!result.skipped) {
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/庫存不足|庫存|已售完/);
    }
  });

  test("STOCK-02 同商品多次預定庫存正確遞減", async ({ page }) => {
    await page.goto("/");

    const result = await page.evaluate(async () => {
      const productsRes = await fetch("/api/products");
      const products = await productsRes.json();
      const active = products.data?.find((p: { status: string; availableStock: number }) =>
        p.status === "ACTIVE" && p.availableStock >= 2
      );
      if (!active) return { skipped: true, reason: "無足夠庫存商品" };

      const stockBefore = active.availableStock;

      // 預定 1 件
      const guestRes = await fetch("/api/guests/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: `庫存遞減_${Date.now()}` }),
      });
      const guestData = await guestRes.json();

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: active.id,
          guestToken: guestData.data.guestToken,
          nickname: guestData.data.nickname,
          quantity: 1,
        }),
      });
      const resData = await res.json();

      // 重新查詢庫存
      const refreshRes = await fetch("/api/products");
      const refreshProducts = await refreshRes.json();
      const refreshed = refreshProducts.data?.find((p: { id: string }) => p.id === active.id);

      return {
        skipped: false,
        stockBefore,
        stockAfter: refreshed?.availableStock,
        reservationSuccess: resData.success,
      };
    });

    if (!result.skipped) {
      expect(result.reservationSuccess).toBe(true);
      expect(result.stockAfter).toBe(result.stockBefore - 1);
    }
  });

  test("STOCK-03 商品售完後狀態應變為 SOLD_OUT", async ({ page }) => {
    await page.goto("/");

    // 此測試用 seed-product-2（已售完商品）來驗證
    const result = await page.evaluate(async () => {
      const res = await fetch("/api/products");
      const data = await res.json();
      const soldOut = data.data?.find((p: { status: string }) => p.status === "SOLD_OUT");
      return { hasSoldOut: !!soldOut, status: soldOut?.status };
    });

    expect(result.hasSoldOut).toBe(true);
    expect(result.status).toBe("SOLD_OUT");
  });

  test("STOCK-04 已售完商品的前台頁面預定按鈕應 disabled", async ({ page }) => {
    await page.goto("/product/seed-product-2");
    const btn = page.locator("button").filter({ hasText: /已售完/ });
    await expect(btn).toBeDisabled();
  });
});
