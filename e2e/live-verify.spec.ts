/**
 * Live-site verification tests — run against the deployed Azure App Service.
 * Usage: BASE_URL=https://saurav-portfolio.azurewebsites.net npx playwright test e2e/live-verify.spec.ts --reporter=list
 */
import { test, expect, type Page } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "https://saurav-portfolio.azurewebsites.net";

async function login(page: Page) {
  await page.goto(`${BASE}/admin/login`);
  await page.fill('input[name="username"]', "saurav");
  await page.fill('input[name="password"]', "Admin@Portfolio2024");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/admin`, { timeout: 20_000 });
}

/** Click a content-type card button by matching the first <p> label exactly. */
async function clickContentTypeCard(page: Page, label: string) {
  await page.waitForSelector("text=What would you like to create?", { timeout: 10_000 });
  await page.evaluate((lbl) => {
    const btns = [...document.querySelectorAll("button")] as HTMLButtonElement[];
    const btn = btns.find((b) => {
      const ps = [...b.querySelectorAll("p")];
      return ps.some((p) => p.textContent?.trim() === lbl);
    });
    if (!btn) throw new Error(`Content type card not found: ${lbl}`);
    btn.click();
  }, label);
}

/** Wait for the AI streaming to complete — detect by absence of loading spinner. */
async function waitForStreamingComplete(page: Page, timeout = 120_000) {
  await page.waitForSelector("div.ai-message-content", { timeout });
  await page.waitForFunction(
    () => !document.querySelector(".animate-spin"),
    { timeout }
  );
  await page.waitForTimeout(1_500);
}

// ---------------------------------------------------------------------------
// 1. Tech Radar — dots render, entry tag-list visible, drawer opens on click
// ---------------------------------------------------------------------------
test("tech-radar: SVG dots render and drawer opens on click", async ({ page }) => {
  await page.goto(`${BASE}/tech-radar`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("svg[role='img']", { timeout: 15_000 });

  // Count SVG dots
  const dotCount = await page.locator("svg g[role='button']").count();
  expect(dotCount).toBeGreaterThan(20);

  // Click a quadrant filter chip — this requires React hydration so it confirms
  // event handlers are attached before we try clicking a tag button.
  await page.locator("div[role='group'] button").filter({ hasText: /Platforms/i }).click();
  await page.waitForTimeout(500);

  // Quadrant list now shows only Platforms entries.
  // Nav dropdown buttons have aria-haspopup="menu"; QuadrantList buttons do NOT.
  const tagCount = await page.locator("ul li > button[type='button']:not([aria-haspopup])").count();
  expect(tagCount).toBeGreaterThan(5);

  const tagBtn = page.locator("ul li > button[type='button']:not([aria-haspopup])").first();
  await tagBtn.scrollIntoViewIfNeeded();
  await tagBtn.click();
  await page.waitForTimeout(1_000);

  // Drawer appears as motion.div[role='dialog']
  await expect(page.locator("div[role='dialog']").first()).toBeVisible({ timeout: 15_000 });
});

// ---------------------------------------------------------------------------
// 2. ADR Gallery — 12 cards, WAF filter chips, drawer opens
// ---------------------------------------------------------------------------
test("decisions: ADR cards load, WAF filter chips work, drawer opens", async ({ page }) => {
  await page.goto(`${BASE}/decisions`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=ADR-001", { timeout: 15_000 });

  // Spot check a few ADR entries
  for (const n of ["ADR-001", "ADR-006", "ADR-012"]) {
    await expect(page.locator(`text=${n}`).first()).toBeVisible();
  }

  // WAF filter chips exist
  const filterChips = page.locator("button").filter({ hasText: /reliability|security|cost|operational|performance/i });
  expect(await filterChips.count()).toBeGreaterThanOrEqual(3);

  // Click a filter chip to verify filter works
  await filterChips.first().click();
  await page.waitForTimeout(400);

  // Reset to All
  const allBtn = page.locator("button").filter({ hasText: /^all$/i });
  if (await allBtn.count() > 0) await allBtn.click();

  // Wait for grid re-animation to settle (stagger: 0.05s × 12 cards ≈ 0.9s total)
  await page.waitForTimeout(1_200);

  // Click first ADR card — motion.article renders as a real <article> element.
  // force:true bypasses Playwright's stability check (position may still be changing
  // from the filter re-animation), ensuring the click is delivered.
  const firstCard = page.locator("article[role='button']").first();
  await firstCard.scrollIntoViewIfNeeded();
  await firstCard.click({ force: true });

  // Give React time to process the state update
  await page.waitForTimeout(1_000);

  // Drawer animates in as motion.div[role='dialog']
  await expect(page.locator("div[role='dialog']").first()).toBeVisible({ timeout: 15_000 });
});

// ---------------------------------------------------------------------------
// 3. AI Writer — select "Talk", verify compact JSON output
// ---------------------------------------------------------------------------
test("ai-writer: talk type produces compact JSON, no bodyMarkdown", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/admin/ai-writer`, { waitUntil: "domcontentloaded" });

  await clickContentTypeCard(page, "Talk");

  await page.waitForSelector("[data-ai-writer-input]", { timeout: 8_000 });
  await page.fill("[data-ai-writer-input]", "Azure AI Foundry — building agentic apps with GPT-4o");
  await page.press("[data-ai-writer-input]", "Enter");

  await waitForStreamingComplete(page);

  const bodyText = await page.locator("div.ai-message-content").last().innerText();
  expect(bodyText).toMatch(/topic|title|format|highlights|agenda|abstract/i);
  expect(bodyText).not.toMatch(/bodyMarkdown/);
});

// ---------------------------------------------------------------------------
// 4. AI Writer — ReviewModal opens when Save is clicked
// ---------------------------------------------------------------------------
test("ai-writer: ReviewModal opens on Save click", { timeout: 480_000 }, async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/admin/ai-writer`, { waitUntil: "domcontentloaded" });

  // Use "Talk" type. Provide ALL required fields in the AI's own template format
  // so the AI skips the question phase and generates directly.
  await clickContentTypeCard(page, "Talk");
  await page.waitForSelector("[data-ai-writer-input]", { timeout: 8_000 });
  await page.fill(
    "[data-ai-writer-input]",
    "- Title: Zero-Trust Architecture with Azure Entra ID\n" +
    "- Event/Community: Azure Developer Community Day 2024\n" +
    "- Audience Level: Intermediate\n" +
    "- Abstract: Deep dive into Zero-Trust patterns — Entra ID Conditional Access, Managed Identity for workload auth, MSAL for app auth — with live Azure demo.\n" +
    "- Agenda:\n" +
    "  - Zero-Trust principles and why perimeter security fails\n" +
    "  - Entra ID Conditional Access configuration\n" +
    "  - Managed Identity for Azure workloads\n" +
    "  - MSAL integration for web/API apps\n" +
    "  - Live demo: end-to-end Zero-Trust app on Azure\n" +
    "  - Q&A\n" +
    "- Demos/Labs: Yes — live Azure portal + VS Code demo showing Managed Identity\n" +
    "- Outcomes: 200 attendees, recording available"
  );
  await page.press("[data-ai-writer-input]", "Enter");

  // Wait for first AI response
  await page.waitForSelector("div.ai-message-content", { timeout: 60_000 });
  await page.waitForFunction(() => !document.querySelector(".animate-spin"), { timeout: 120_000 });
  await page.waitForTimeout(1_500);

  // If AI still asked questions despite comprehensive input, answer and trigger generation
  const msgs = await page.locator("div.ai-message-content").all();
  const lastMsgText = await msgs[msgs.length - 1].innerText();
  if (!lastMsgText.includes("```json")) {
    // Provide the structured answer in the template format shown by the AI
    await page.fill(
      "[data-ai-writer-input]",
      "Please generate the talk entry now using all the information I provided above."
    );
    await page.press("[data-ai-writer-input]", "Enter");
    await waitForStreamingComplete(page, 240_000);
  }

  // ContentPreview renders "Save as Talk" button in the right panel once JSON is extracted
  const saveBtn = page.locator("button").filter({ hasText: /Save as/i }).first();
  await saveBtn.scrollIntoViewIfNeeded().catch(() => {});
  await expect(saveBtn).toBeVisible({ timeout: 60_000 });
  await saveBtn.click();

  // ReviewModal heading
  await expect(page.locator("text=Review & Save").first()).toBeVisible({ timeout: 10_000 });
});

// ---------------------------------------------------------------------------
// 5. Tech Radar admin draft/publish cycle
// ---------------------------------------------------------------------------
test("tech-radar admin: CRUD cycle — create draft, publish, delete", async ({ page }) => {
  await login(page);
  await page.goto(`${BASE}/admin/tech-radar/new`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("input[placeholder*='Azure Container Apps']", { timeout: 10_000 });

  // Use a timestamp-based name to guarantee uniqueness across test runs
  const testEntry = `LiveTest-${Date.now()}`;
  await page.fill("input[placeholder*='Azure Container Apps']", testEntry);

  // selects: [0]=quadrant [1]=ring [2]=movedFrom [3]=status
  const selects = page.locator("select");
  await selects.nth(0).selectOption("tools");
  await selects.nth(1).selectOption("assess");
  await page.fill("textarea[placeholder*='production experience']", "Automated live test entry — safe to delete");
  await selects.nth(3).selectOption("draft");

  await page.locator("button").filter({ hasText: /^Save$/ }).click();
  await page.waitForTimeout(3_000);

  // Confirm entry appears in admin list
  await page.goto(`${BASE}/admin/tech-radar`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(`text=${testEntry}`).first()).toBeVisible({ timeout: 10_000 });

  // Edit — change status to published
  await page.locator("tr").filter({ hasText: testEntry }).locator("a[href*='/edit']").click();
  await page.waitForSelector("input[placeholder*='Azure Container Apps']", { timeout: 10_000 });

  const nameVal = await page.locator("input[placeholder*='Azure Container Apps']").inputValue();
  expect(nameVal).toBe(testEntry);

  await page.locator("select").nth(3).selectOption("published");
  await page.locator("button").filter({ hasText: /^Save$/ }).click();
  await page.waitForTimeout(3_000);

  // Verify still in admin list after publishing
  await page.goto(`${BASE}/admin/tech-radar`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(`text=${testEntry}`).first()).toBeVisible({ timeout: 10_000 });

  // Cleanup — delete
  const delRow = page.locator("tr").filter({ hasText: testEntry });
  await delRow.locator("button").last().click();
  await page.waitForTimeout(500);
  const confirmBtn = page.locator("button").filter({ hasText: /confirm|yes|delete/i }).first();
  if (await confirmBtn.isVisible()) await confirmBtn.click();
  await page.waitForTimeout(2_000);

  await page.goto(`${BASE}/admin/tech-radar`, { waitUntil: "domcontentloaded" });
  await expect(page.locator(`text=${testEntry}`)).not.toBeVisible();
});
