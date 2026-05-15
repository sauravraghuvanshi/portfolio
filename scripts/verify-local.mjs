#!/usr/bin/env node
/**
 * verify-local.mjs — Smoke-test key routes against a local dev server.
 *
 * Behavior:
 *   1. Spawns `npm run dev` (or reuses an already-running server on PORT).
 *   2. Waits for "Ready" on stdout (120s timeout).
 *   3. HTTP-probes a list of key routes for status 200–399.
 *   4. Kills the spawned server (only if it spawned one).
 *   5. Exits 0 on all-green, 1 on any failure.
 *
 * Env:
 *   PORT        (default 3000)
 *   ROUTES      comma-separated override for smoke routes
 *   NO_SPAWN=1  skip spawning — assumes a dev server is already running
 *
 * Usage:
 *   node scripts/verify-local.mjs
 *   npm run verify:local
 */
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const PORT = process.env.PORT || "3000";
const BASE = `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 120_000;
const ROUTE_TIMEOUT_MS = 15_000;
const NO_SPAWN = process.env.NO_SPAWN === "1";

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

function log(msg) { process.stdout.write(`[verify-local] ${msg}\n`); }
function err(msg) { process.stderr.write(`[verify-local] ${msg}\n`); }

async function probe(path) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "manual" });
    return { path, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch (e) {
    return { path, status: 0, ok: false, error: String(e?.message || e) };
  } finally {
    clearTimeout(t);
  }
}

async function waitForReady(child) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  let buffer = "";
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const text = chunk.toString();
      buffer += text;
      process.stdout.write(text.replace(/^/gm, "  | "));
      if (/Ready|Local:\s+http|started server on/i.test(buffer)) {
        cleanup();
        // small grace period so Next finishes binding
        setTimeout(resolve, 500);
      }
    };
    const onExit = (code) => {
      cleanup();
      reject(new Error(`Dev server exited before ready (code ${code})`));
    };
    const tick = setInterval(() => {
      if (Date.now() > deadline) {
        cleanup();
        reject(new Error(`Dev server did not become ready within ${READY_TIMEOUT_MS}ms`));
      }
    }, 1000);
    function cleanup() {
      clearInterval(tick);
      child.stdout.off("data", onData);
      child.stderr.off("data", onData);
      child.off("exit", onExit);
    }
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("exit", onExit);
  });
}

function killTree(pid) {
  if (!pid) return;
  if (process.platform === "win32") {
    try { execSync(`taskkill /pid ${pid} /T /F`, { stdio: "ignore" }); } catch { /* ignore */ }
  } else {
    try { process.kill(-pid, "SIGTERM"); } catch { /* ignore */ }
  }
}

async function main() {
  let child = null;
  if (!NO_SPAWN) {
    log(`Spawning \`npm run dev\` on port ${PORT}...`);
    child = spawn("npm", ["run", "dev"], {
      shell: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT },
      detached: process.platform !== "win32",
    });
    await waitForReady(child);
    log("Dev server ready. Starting probes...");
  } else {
    log(`NO_SPAWN=1 — assuming dev server already running at ${BASE}`);
  }

  // Small warm-up probe
  await sleep(500);

  const results = [];
  for (const r of routes) {
    const result = await probe(r);
    results.push(result);
    const tag = result.ok ? "✓" : "✗";
    log(`${tag} ${result.status || "ERR"} ${r}${result.error ? ` — ${result.error}` : ""}`);
  }

  if (child) {
    log("Shutting down dev server...");
    killTree(child.pid);
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
  err(String(e?.stack || e));
  process.exit(2);
});
