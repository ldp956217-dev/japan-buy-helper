import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // 避免庫存競爭問題
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    locale: "zh-TW",
    timezoneId: "Asia/Taipei",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "iphone",
      use: { ...devices["iPhone 14"] },
    },
  ],
  // 測試前確保 dev server 已在跑
  // 若要自動啟動，取消以下注解：
  // webServer: {
  //   command: "node scripts/dev.mjs",
  //   url: "http://localhost:3000",
  //   reuseExistingServer: true,
  //   timeout: 60000,
  // },
});
