/**
 * sync-content.mjs — Runs BEFORE server.js on Azure App Service.
 *
 * Copies bundled content/ → /home/data/content/ (persistent storage)
 * so admin panel changes survive zip-deploy.
 *
 * Strategy:
 *   - MDX files (blog/, case-studies/): copy only if file doesn't exist
 *   - JSON files: copy only if file doesn't exist (admin is source of truth)
 *   - profile.json: ALWAYS overwrite (code-managed, no admin API)
 *   - portfolio-rag.json: ALWAYS overwrite (generated)
 */

import fs from "fs";
import path from "path";

const PERSISTENT_DIR = "/home/data/content";
const BUNDLED_DIR = path.join(process.cwd(), "content");

/** Files that are code-managed — always overwrite from bundle. */
const ALWAYS_OVERWRITE = new Set(["profile.json", "portfolio-rag.json"]);

function copyFileIfMissing(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
    console.log(`[sync-content] ADD ${path.relative(PERSISTENT_DIR, dest)}`);
    return true;
  }
  return false;
}

function copyFileAlways(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`[sync-content] OVERWRITE ${path.relative(PERSISTENT_DIR, dest)}`);
}

function syncDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);

    if (fs.statSync(srcPath).isDirectory()) {
      syncDir(srcPath, destPath);
    } else if (ALWAYS_OVERWRITE.has(entry)) {
      copyFileAlways(srcPath, destPath);
    } else {
      copyFileIfMissing(srcPath, destPath);
    }
  }
}

// Only run on Azure App Service
if (!process.env.WEBSITE_SITE_NAME) {
  console.log("[sync-content] Not on Azure — skipping.");
  process.exit(0);
}

if (!fs.existsSync(BUNDLED_DIR)) {
  console.log("[sync-content] No bundled content/ dir found — skipping.");
  process.exit(0);
}

console.log(`[sync-content] Syncing ${BUNDLED_DIR} → ${PERSISTENT_DIR}`);
syncDir(BUNDLED_DIR, PERSISTENT_DIR);
console.log("[sync-content] Done.");
