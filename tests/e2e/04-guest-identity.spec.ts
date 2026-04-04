/**
 * TC-GUEST：訪客身份管理測試
 */
import { test, expect } from "@playwright/test";
import { setGuestIdentity } from "./helpers";

test.describe("TC-GUEST 訪客身份管理", () => {
  test("GUEST-01 首次進入 /nickname 顯示輸入框", async ({ page }) => {
    await page.goto("/nickname");
    // 清除任何殘留 localStorage
    await page.evaluate(() => {
      localStorage.removeItem("buyhelper_guest_token");
      localStorage.removeItem("buyhelper_guest_nickname");
    });
    await page.reload();
    await expect(page.locator("#nickname")).toBeVisible();
    await expect(page.locator('button:has-text("確認暱稱")')).toBeVisible();
    await expect(page.locator("text=暱稱確認後不可修改")).toBeVisible();
  });

  test("GUEST-02 設定暱稱後顯示鎖定畫面", async ({ page }) => {
    await setGuestIdentity(page, "QA測試員");
    await page.goto("/nickname");
    await expect(page.locator("p.font-semibold:has-text('QA測試員'), p:has-text('QA測試員')").first()).toBeVisible();
    await expect(page.locator("text=暱稱確認後不可修改")).toBeVisible();
    await expect(page.locator('button:has-text("切換用戶")')).toBeVisible();
    // 不應有修改暱稱的輸入框
    await expect(page.locator("#nickname")).not.toBeVisible();
  });

  test("GUEST-03 同暱稱永遠對應同一 guestToken", async ({ page }) => {
    await page.goto("/");
    const result1 = await page.evaluate(async () => {
      const r = await fetch("/api/guests/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: "同名測試" }),
      });
      return (await r.json()).data?.guestToken;
    });

    const result2 = await page.evaluate(async () => {
      const r = await fetch("/api/guests/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: "同名測試" }),
      });
      return (await r.json()).data?.guestToken;
    });

    expect(result1).toBe(result2);
    expect(result1).toBeTruthy();
  });

  test("GUEST-04 不同暱稱對應不同 guestToken", async ({ page }) => {
    await page.goto("/");
    const token1 = await page.evaluate(async () => {
      const r = await fetch("/api/guests/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: `身份A_${Date.now()}` }),
      });
      return (await r.json()).data?.guestToken;
    });

    const token2 = await page.evaluate(async () => {
      const r = await fetch("/api/guests/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: `身份B_${Date.now() + 1}` }),
      });
      return (await r.json()).data?.guestToken;
    });

    expect(token1).not.toBe(token2);
  });

  test("GUEST-05 切換用戶按鈕觸發後顯示輸入框", async ({ page }) => {
    await setGuestIdentity(page, "切換測試員");
    await page.goto("/nickname");
    await page.locator('button:has-text("切換用戶")').click();
    await expect(page.locator("#nickname")).toBeVisible();
  });

  test("GUEST-06 Header 顯示目前登入暱稱", async ({ page }) => {
    await setGuestIdentity(page, "顯示測試員");
    await page.goto("/");
    await expect(page.locator("text=顯示測試員")).toBeVisible();
  });

  test("GUEST-07 暱稱空白送出應顯示錯誤", async ({ page }) => {
    await page.goto("/nickname");
    await page.evaluate(() => {
      localStorage.removeItem("buyhelper_guest_token");
      localStorage.removeItem("buyhelper_guest_nickname");
    });
    await page.reload();
    await page.locator('button:has-text("確認暱稱")').click();
    await expect(page.locator("text=請輸入暱稱")).toBeVisible();
  });
});
