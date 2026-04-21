#!/usr/bin/env node
/**
 * verify-live.mjs — Smoke-test key routes against the live production site.
 *
 * Identical probe logic to verify-local.mjs, but targets BASE (default live URL).
 * Exits 0 on all-green, 1 on any failure.
 *
 * Env:
 *   BASE   default: https://saurav-portfolio.azurewebsites.net
 *   ROUTES comma-separated override for smoke routes
 *
 * Usage:
 *   node scripts/verify-live.mjs
 *   npm run verify:live
 *   BASE=https://staging.example.com node scripts/verify-live.mjs
 */
const BASE = (process.env.BASE || "https://saurav-portfolio.azurewebsites.net").replace(/\/$/, "");
const ROUTE_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

const DEFAULT_ROUTES = [
  "/",
  "/blog",
  "/projects",
  "/events",
  "/talks",
  "/community",
  "/resume",
  "/social",
  "/case-studies",
  "/sitemap.xml",
  "/robots.txt",
  "/feed.xml",
];
const routes = (process.env.ROUTES || "").trim()
  ? process.env.ROUTES.split(",").map((s) => s.trim()).filter(Boolean)
  : DEFAULT_ROUTES;

function log(msg) { process.stdout.write(`[verify-live] ${msg}\n`); }

async function probeOnce(path) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "manual", headers: { "User-Agent": "portfolio-verify-live/1.0" } });
    return { path, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (e) {
    return { path, status: 0, ok: false, error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function probe(path) {
  let last = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const result = await probeOnce(path);
    if (result.ok) return result;
    last = result;
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  return { ...last, retries: MAX_RETRIES };
}

async function main() {
  log(`Target: ${BASE}`);
  log(`Probing ${routes.length} routes...`);
  const results = [];
  for (const r of routes) {
    const result = await probe(r);
    results.push(result);
    const tag = result.ok ? "✓" : "✗";
    log(`${tag} ${result.status || "ERR"} ${r}${result.error ? ` — ${result.error}` : ""}`);
  }
  const failed = results.filter((r) => !r.ok);
  const summary = {
    base: BASE,
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    failures: failed,
  };
  console.log("\n" + JSON.stringify(summary, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write(`[verify-live] fatal: ${e?.stack || e}\n`);
  process.exit(2);
});
