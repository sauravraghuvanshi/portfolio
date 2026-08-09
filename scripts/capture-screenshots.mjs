#!/usr/bin/env node
/**
 * capture-screenshots.mjs — Refresh the README screenshots from a running site.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs                       # shoots the live site
 *   BASE_URL=http://localhost:3000 node scripts/capture-screenshots.mjs
 *
 * Writes JPEGs into docs/screenshots/. Those files are committed so GitHub can
 * render them in README.md; they are deliberately NOT in public/ so they never
 * end up in the deploy zip.
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "..", "docs", "screenshots");
const BASE_URL = (process.env.BASE_URL || "https://saurav-portfolio.azurewebsites.net").replace(/\/$/, "");

/** @type {{name: string, path: string, scrollY?: number, openChat?: boolean}[]} */
const SHOTS = [
  { name: "home", path: "/" },
  { name: "projects", path: "/projects", scrollY: 260 },
  { name: "architecture", path: "/architecture", scrollY: 420 },
  { name: "talks", path: "/talks", scrollY: 220 },
  { name: "tech-radar", path: "/tech-radar", scrollY: 320 },
  { name: "ai-assistant", path: "/", openChat: true },
];

mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});

for (const shot of SHOTS) {
  const url = `${BASE_URL}${shot.path}`;
  process.stdout.write(`→ ${url} … `);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  } catch {
    // networkidle can never settle when something polls; domcontentloaded is enough.
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  }

  if (shot.scrollY) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), shot.scrollY);
  }

  // Let Framer Motion entrance / whileInView animations settle.
  await page.waitForTimeout(2500);

  if (shot.openChat) {
    await page.getByRole("button", { name: "Open chat assistant" }).click();
    await page.waitForTimeout(800);
    const starter = page.getByRole("button", { name: "What's Saurav's experience?" });
    if (await starter.count()) {
      await starter.first().click();
      // Wait for the streamed answer inside the chat dialog, but never block the run.
      await page
        .waitForFunction(
          () => {
            const el = document.querySelector('[role="dialog"][aria-label="Chat with Saurav\'s AI assistant"]');
            return !!el && (el.textContent || "").length > 700;
          },
          undefined,
          { timeout: 60_000 }
        )
        .catch(() => console.warn("(chat answer did not arrive in time)"));
      // ChatMessage reveals text with a typewriter (~167 chars/s) — let it finish.
      await page.waitForTimeout(6000);
    }
  }

  await page.screenshot({ path: join(outDir, `${shot.name}.jpg`), type: "jpeg", quality: 82 });
  console.log("ok");
}

await browser.close();
console.log(`\nSaved ${SHOTS.length} screenshots to docs/screenshots/`);
