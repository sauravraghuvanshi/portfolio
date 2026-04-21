#!/usr/bin/env node
/**
 * watch-deploy.mjs — Poll GitHub Actions for the latest run and wait for completion.
 *
 * Watches the `deploy.yml` workflow on sauravraghuvanshi/portfolio (configurable).
 * Polls every 10s (configurable), up to 30 minutes total.
 *
 * Env:
 *   GH_TOKEN          (recommended — personal access token or Actions token)
 *   REPO              default: sauravraghuvanshi/portfolio
 *   WORKFLOW_FILE     default: deploy.yml
 *   POLL_INTERVAL_MS  default: 10000
 *   MAX_WAIT_MS       default: 1800000 (30 min)
 *   MIN_CREATED_AT    (ISO string) only accept runs created after this moment
 *
 * Exit:
 *   0 — run completed with conclusion=success
 *   1 — run completed with any other conclusion (failure/cancelled/etc)
 *   2 — timeout or API error
 *
 * Usage:
 *   node scripts/watch-deploy.mjs
 *   npm run watch:deploy
 */
import { execSync } from "node:child_process";

const REPO = process.env.REPO || "sauravraghuvanshi/portfolio";
const WORKFLOW_FILE = process.env.WORKFLOW_FILE || "deploy.yml";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 10_000);
const MAX_WAIT_MS = Number(process.env.MAX_WAIT_MS || 30 * 60 * 1000);
const MIN_CREATED_AT = process.env.MIN_CREATED_AT ? Date.parse(process.env.MIN_CREATED_AT) : 0;

function log(msg) { process.stdout.write(`[watch-deploy] ${msg}\n`); }

function getToken() {
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  // Try `gh auth token` as a fallback (local dev convenience).
  try {
    return execSync("gh auth token", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch { return ""; }
}

async function ghFetch(pathname) {
  const token = getToken();
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "portfolio-watch-deploy",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  }
  return res.json();
}

async function latestRun() {
  const data = await ghFetch(`/repos/${REPO}/actions/workflows/${WORKFLOW_FILE}/runs?per_page=5`);
  const runs = data.workflow_runs || [];
  // Pick the most recent run after MIN_CREATED_AT
  for (const run of runs) {
    if (Date.parse(run.created_at) >= MIN_CREATED_AT) return run;
  }
  return runs[0] || null;
}

async function main() {
  const deadline = Date.now() + MAX_WAIT_MS;
  log(`Watching ${REPO} ${WORKFLOW_FILE} (poll ${POLL_INTERVAL_MS}ms, max ${MAX_WAIT_MS}ms)`);
  let lastStatus = "";
  while (Date.now() < deadline) {
    let run;
    try { run = await latestRun(); }
    catch (e) { log(`API error: ${e.message}. Retrying...`); await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS)); continue; }

    if (!run) { log("No runs found yet. Waiting..."); await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS)); continue; }

    const line = `run #${run.run_number} (${run.head_sha.slice(0, 7)}) status=${run.status} conclusion=${run.conclusion || "—"} — ${run.html_url}`;
    if (line !== lastStatus) { log(line); lastStatus = line; }

    if (run.status === "completed") {
      const out = {
        run_number: run.run_number,
        sha: run.head_sha,
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        created_at: run.created_at,
        updated_at: run.updated_at,
      };
      console.log("\n" + JSON.stringify(out, null, 2));
      process.exit(run.conclusion === "success" ? 0 : 1);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  log(`Timed out after ${MAX_WAIT_MS}ms`);
  process.exit(2);
}

main().catch((e) => {
  process.stderr.write(`[watch-deploy] fatal: ${e?.stack || e}\n`);
  process.exit(2);
});
