// tests/playwright/playwright.config.js
// ======================================
// Playwright configuration for XPS Intelligence Platform E2E tests.

const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: [
    ["list"],
  ],
  outputDir: "/tmp/xps-screenshots",
  use: {
    baseURL: "http://127.0.0.1:3000",
    screenshot: "on",
    video: "off",
    trace: "off",
    headless: true,
    launchOptions: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
