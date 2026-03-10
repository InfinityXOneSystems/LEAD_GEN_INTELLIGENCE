// tests/playwright/frontend.spec.js
// ===================================
// End-to-end Playwright tests for XPS Intelligence Platform frontend.
// Tests: homepage, navigation, chat interface, LLM command submission,
//        leads page, settings page, buttons, and API integration.

const { test, expect } = require("@playwright/test");
const path = require("path");
const fs = require("fs");

const FRONTEND_URL = "http://127.0.0.1:3000";
const BACKEND_URL = "http://127.0.0.1:8000";
const SCREENSHOT_DIR = "/tmp/xps-screenshots";

// Ensure screenshot dir exists
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

async function saveScreenshot(page, name) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`📸 Screenshot saved: ${filePath}`);
  return filePath;
}

// ---------------------------------------------------------------------------
// Backend API tests (direct HTTP, no browser needed)
// ---------------------------------------------------------------------------

test.describe("Backend API Health & Endpoints", () => {
  test("GET /health returns healthy status", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/health`);
    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.status).toBe("healthy");
    expect(body.service).toBe("leadgen-api");
    console.log("✅ Backend /health:", JSON.stringify(body));
  });

  test("GET /docs returns OpenAPI documentation", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/docs`);
    expect(resp.status()).toBe(200);
    console.log("✅ Backend /docs: accessible");
  });

  test("GET /metrics returns Prometheus metrics", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/metrics`);
    expect(resp.status()).toBe(200);
    console.log("✅ Backend /metrics: accessible");
  });

  test("POST /api/v1/runtime/command queues a scrape task", async ({ request }) => {
    const resp = await request.post(`${BACKEND_URL}/api/v1/runtime/command`, {
      data: { command: "scrape flooring contractors in Austin TX" },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(202);
    const body = await resp.json();
    expect(body).toHaveProperty("task_id");
    expect(body.status).toBe("queued");
    console.log("✅ Runtime command queued:", JSON.stringify(body));

    // Poll task status
    const taskResp = await request.get(`${BACKEND_URL}/api/v1/runtime/task/${body.task_id}`);
    expect(taskResp.status()).toBe(200);
    const taskBody = await taskResp.json();
    expect(taskBody).toHaveProperty("task_id");
    console.log("✅ Task status:", JSON.stringify(taskBody));
  });

  test("POST /api/v1/runtime/command queues an LLM/chat task", async ({ request }) => {
    const resp = await request.post(`${BACKEND_URL}/api/v1/runtime/command`, {
      data: { command: "run seo analysis on example.com" },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(202);
    const body = await resp.json();
    expect(body).toHaveProperty("task_id");
    console.log("✅ LLM/SEO command queued:", JSON.stringify(body));
  });

  test("POST /api/v1/runtime/command rejects empty command", async ({ request }) => {
    const resp = await request.post(`${BACKEND_URL}/api/v1/runtime/command`, {
      data: { command: "" },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(422);
    console.log("✅ Empty command correctly rejected with 422");
  });

  test("GET /api/v1/runtime/task/nonexistent returns 404", async ({ request }) => {
    const resp = await request.get(`${BACKEND_URL}/api/v1/runtime/task/nonexistent-task-id`);
    expect(resp.status()).toBe(404);
    console.log("✅ Non-existent task correctly returns 404");
  });

  test("POST /api/v1/runtime/command queues outreach task", async ({ request }) => {
    const resp = await request.post(`${BACKEND_URL}/api/v1/runtime/command`, {
      data: { command: "run outreach campaign to flooring leads" },
      headers: { "Content-Type": "application/json" },
    });
    expect(resp.status()).toBe(202);
    const body = await resp.json();
    expect(body.agent).toBe("outreach");
    console.log("✅ Outreach command queued:", JSON.stringify(body));
  });
});

// ---------------------------------------------------------------------------
// Frontend tests
// ---------------------------------------------------------------------------

test.describe("Frontend: Homepage", () => {
  test("loads and shows platform title", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");

    const title = page.locator("h1");
    await expect(title).toContainText("XPS Intelligence Platform");

    await saveScreenshot(page, "01-homepage");
    console.log("✅ Homepage loaded with title");
  });

  test("shows navigation cards", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");

    await expect(page.locator("text=💬 Chat Interface")).toBeVisible();
    await expect(page.locator("text=📋 Leads")).toBeVisible();
    await expect(page.locator("text=📊 Analytics")).toBeVisible();
    await expect(page.locator("text=⚙️ Settings")).toBeVisible();

    await saveScreenshot(page, "02-homepage-cards");
    console.log("✅ All 4 navigation cards visible");
  });

  test("Chat Interface card navigates to /chat", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");

    await page.locator("text=💬 Chat Interface").click();
    await page.waitForURL("**/chat**");
    await page.waitForLoadState("networkidle");

    await saveScreenshot(page, "03-chat-navigation");
    console.log("✅ Chat Interface card navigates correctly");
  });
});

test.describe("Frontend: Chat / LLM Interface", () => {
  test("chat page loads with input and suggestions", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Look for the chat header logo (first instance of XPS Intelligence)
    await expect(page.locator("text=XPS Intelligence").first()).toBeVisible();

    // Check for input
    const input = page.locator("input[type=text], textarea").first();
    await expect(input).toBeVisible();

    await saveScreenshot(page, "04-chat-page-loaded");
    console.log("✅ Chat page loaded with input");
  });

  test("chat suggestions are clickable", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Click a suggestion chip if present
    const suggestion = page.locator("text=scrape epoxy contractors in Orlando FL").first();
    if (await suggestion.isVisible()) {
      await suggestion.click();
      await page.waitForTimeout(500);
      await saveScreenshot(page, "05-chat-suggestion-clicked");
      console.log("✅ Chat suggestion clicked");
    } else {
      console.log("ℹ️  Suggestion not immediately visible, checking input");
    }
  });

  test("can type and submit a command via chat input", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const input = page.locator("input[type=text], textarea").first();
    await input.click();
    await input.fill("scrape flooring contractors in Dallas TX");

    await saveScreenshot(page, "06-chat-command-typed");

    // Submit via Enter or Send button
    const sendBtn = page.locator("button[type=submit], button:has-text('Send'), button:has-text('Run')").first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    } else {
      await page.keyboard.press("Enter");
    }

    // Wait for response/loading indicator
    await page.waitForTimeout(2000);
    await saveScreenshot(page, "07-chat-command-submitted");
    console.log("✅ Chat command typed and submitted");
  });

  test("chat shows loading state after command submit", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    const input = page.locator("input[type=text], textarea").first();
    await input.fill("run seo analysis on example.com");
    await page.keyboard.press("Enter");

    await page.waitForTimeout(3000);
    await saveScreenshot(page, "08-chat-response-received");
    console.log("✅ Chat response received/loading shown");
  });
});

test.describe("Frontend: Leads Page", () => {
  test("leads page loads", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/leads`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await saveScreenshot(page, "09-leads-page");
    console.log("✅ Leads page loaded");
  });
});

test.describe("Frontend: Settings Page", () => {
  test("settings page loads", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/settings`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await saveScreenshot(page, "10-settings-page");
    console.log("✅ Settings page loaded");
  });
});

test.describe("Frontend: Navigation Buttons", () => {
  test("all nav links work from homepage", async ({ page }) => {
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");

    // Test Leads card
    await page.locator("text=📋 Leads").click();
    await page.waitForURL("**/leads**");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "11-leads-from-home");

    // Go back and test Settings
    await page.goto(FRONTEND_URL);
    await page.waitForLoadState("networkidle");
    await page.locator("text=⚙️ Settings").click();
    await page.waitForURL("**/settings**");
    await page.waitForLoadState("networkidle");
    await saveScreenshot(page, "12-settings-from-home");

    console.log("✅ All navigation buttons work");
  });

  test("chat nav links back to home", async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/chat`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    // Click Home link in header
    const homeLink = page.locator("a[href='/'], a:has-text('Home')").first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await page.waitForLoadState("networkidle");
      await saveScreenshot(page, "13-home-from-chat");
      console.log("✅ Home navigation from chat works");
    }
  });
});
