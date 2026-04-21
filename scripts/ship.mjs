#!/usr/bin/env node
/**
 * ship.mjs — End-to-end ship workflow: preflight → local verify → push → watch deploy → verify live.
 *
 * Enforces the rule: "Never confirm success until the full chain is green."
 *
 * Phases (stops on first failure):
 *   1. Preflight   — `npm run lint` (add typecheck if configured)
 *   2. Local       — `npm run verify:local`  (spawns dev, smoke-tests routes)
 *   3. Push        — detects uncommitted changes; with --auto-push, stages+commits+pushes.
 *                    Without --auto-push, reminds you to push manually, then waits for ENTER.
 *   4. Watch       — polls GitHub Actions deploy.yml until completed.
 *   5. Live        — `npm run verify:live` smoke test.
 *
 * Flags:
 *   --auto-push            git add -A && git commit -m "<msg>" && git push
 *   --message "<msg>"      commit message (requires --auto-push)
 *   --skip-local           skip phase 2
 *   --skip-preflight       skip phase 1
 *   --skip-watch           skip phase 4
 *   --skip-live            skip phase 5
 *
 * Exit 0 only if all phases pass.
 *
 * Usage:
 *   npm run ship
 *   npm run ship -- --auto-push --message "feat: new section"
 */
import { spawn, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));
const portfolioRoot = join(__dirname, "..");

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const flagVal = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : undefined;
};

const AUTO_PUSH = flag("--auto-push");
const COMMIT_MSG = flagVal("--message") || "chore: ship";
const SKIP_PREFLIGHT = flag("--skip-preflight");
const SKIP_LOCAL = flag("--skip-local");
const SKIP_WATCH = flag("--skip-watch");
const SKIP_LIVE = flag("--skip-live");

function banner(text) { process.stdout.write(`\n━━━ ${text} ━━━\n`); }
function ok(text) { process.stdout.write(`✓ ${text}\n`); }
function fail(text) { process.stdout.write(`✗ ${text}\n`); }

function runInherit(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      cwd: portfolioRoot,
      ...opts,
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function exec(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    encoding: "utf8",
    shell: process.platform === "win32",
    cwd: portfolioRoot,
    ...opts,
  });
}

function gitStatusPorcelain() {
  const r = exec("git", ["status", "--porcelain"]);
  return (r.stdout || "").trim();
}

function prompt(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(q, (a) => { rl.close(); resolve(a); }));
}

async function phasePreflight() {
  banner("PHASE 1: Preflight (lint)");
  const code = await runInherit("npm", ["run", "lint"]);
  if (code !== 0) { fail("Lint failed"); return code; }
  ok("Lint passed");
  return 0;
}

async function phaseLocal() {
  banner("PHASE 2: Local verify (dev server + route smoke test)");
  const code = await runInherit("npm", ["run", "verify:local"]);
  if (code !== 0) { fail("Local verify failed"); return code; }
  ok("Local verify passed");
  return 0;
}

async function phasePush() {
  banner("PHASE 3: Push");
  const status = gitStatusPorcelain();
  if (!status && !AUTO_PUSH) {
    // Nothing to push locally — user may have already pushed, continue.
    ok("Working tree clean — skipping commit. (Assuming a push has already happened.)");
    const ans = await prompt("Press ENTER to start watching GitHub Actions, or type 'skip' to abort: ");
    if (ans.trim().toLowerCase() === "skip") return 1;
    return 0;
  }
  if (!AUTO_PUSH) {
    process.stdout.write(`Uncommitted changes:\n${status}\n`);
    const ans = await prompt("Push manually now, then press ENTER to watch. Type 'skip' to abort: ");
    if (ans.trim().toLowerCase() === "skip") return 1;
    return 0;
  }
  // AUTO_PUSH path
  let code = (await runInherit("git", ["add", "-A"])) ?? 0;
  if (code !== 0) { fail("git add failed"); return code; }
  code = await runInherit("git", ["commit", "-m", COMMIT_MSG]);
  if (code !== 0) {
    // commit may exit non-zero if nothing to commit; continue to push
    const s2 = gitStatusPorcelain();
    if (s2) { fail("git commit failed"); return code; }
    ok("Nothing to commit, continuing");
  } else {
    ok(`Committed: ${COMMIT_MSG}`);
  }
  code = await runInherit("git", ["push"]);
  if (code !== 0) { fail("git push failed"); return code; }
  ok("Pushed to origin");
  return 0;
}

async function phaseWatch(minCreatedAt) {
  banner("PHASE 4: Watch GitHub Actions deploy");
  const code = await runInherit(process.execPath, [join(__dirname, "watch-deploy.mjs")], {
    env: { ...process.env, MIN_CREATED_AT: minCreatedAt },
  });
  if (code !== 0) { fail(`Deploy run ended with non-success exit ${code}`); return code; }
  ok("Deploy workflow succeeded");
  return 0;
}

async function phaseLive() {
  banner("PHASE 5: Live site verify");
  const code = await runInherit("npm", ["run", "verify:live"]);
  if (code !== 0) { fail("Live verify failed"); return code; }
  ok("Live verify passed");
  return 0;
}

async function main() {
  const started = new Date().toISOString();

  if (!SKIP_PREFLIGHT) {
    const c = await phasePreflight();
    if (c !== 0) process.exit(c);
  }
  if (!SKIP_LOCAL) {
    const c = await phaseLocal();
    if (c !== 0) process.exit(c);
  }

  // Capture timestamp BEFORE the push so watch-deploy can ignore older runs.
  const beforePush = new Date().toISOString();
  const c3 = await phasePush();
  if (c3 !== 0) process.exit(c3);

  if (!SKIP_WATCH) {
    const c = await phaseWatch(beforePush);
    if (c !== 0) process.exit(c);
  }
  if (!SKIP_LIVE) {
    const c = await phaseLive();
    if (c !== 0) process.exit(c);
  }

  banner("SHIP COMPLETE");
  ok(`Started: ${started}`);
  ok(`Finished: ${new Date().toISOString()}`);
  ok("All phases green. Safe to confirm success to the user.");
}

main().catch((e) => {
  process.stderr.write(`[ship] fatal: ${e?.stack || e}\n`);
  process.exit(2);
});
