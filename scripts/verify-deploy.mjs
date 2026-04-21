#!/usr/bin/env node
/**
 * verify-deploy.mjs — Full deploy verification orchestrator.
 *
 * Runs the three verification phases IN ORDER and stops on first failure:
 *   1. verify-local   → npm run dev + smoke tests
 *   2. watch-deploy   → watch latest GitHub Actions run until completed
 *   3. verify-live    → smoke-test live site routes
 *
 * Exit 0 only if all three succeed.
 *
 * Env:
 *   SKIP_LOCAL=1   skip phase 1 (use when dev was already verified)
 *   SKIP_WATCH=1   skip phase 2 (use for local-only checks)
 *   SKIP_LIVE=1    skip phase 3
 *   MIN_CREATED_AT pass-through to watch-deploy (so we only match runs newer than push)
 *
 * Usage:
 *   node scripts/verify-deploy.mjs
 *   npm run verify:deploy
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function runPhase(scriptName, env = {}) {
  return new Promise((resolve) => {
    const start = Date.now();
    const label = scriptName.replace(/\.mjs$/, "");
    process.stdout.write(`\n=== PHASE: ${label} ===\n`);
    const child = spawn(process.execPath, [join(__dirname, scriptName)], {
      stdio: "inherit",
      env: { ...process.env, ...env },
    });
    child.on("exit", (code) => {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      process.stdout.write(`=== PHASE: ${label} — exit ${code} (${elapsed}s) ===\n`);
      resolve(code ?? 1);
    });
  });
}

async function main() {
  const phases = [];
  if (process.env.SKIP_LOCAL !== "1") phases.push({ name: "verify-local.mjs", required: true });
  if (process.env.SKIP_WATCH !== "1") phases.push({ name: "watch-deploy.mjs", required: true });
  if (process.env.SKIP_LIVE !== "1") phases.push({ name: "verify-live.mjs", required: true });

  for (const phase of phases) {
    const code = await runPhase(phase.name);
    if (code !== 0) {
      process.stdout.write(`\n✗ ${phase.name} failed (exit ${code}). Aborting.\n`);
      process.exit(code);
    }
  }
  process.stdout.write(`\n✓ All phases passed.\n`);
}

main();
