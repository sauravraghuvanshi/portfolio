/**
 * pull-live-content.mjs
 *
 * Automatically downloads admin-created blog/case-study MDX files from the
 * live Azure App Service persistent storage into local content/.
 *
 * Runs automatically via `predev` before `npm run dev`.
 * Also available as `npm run pull:live` on demand.
 *
 * - Skips silently if credentials are absent (never blocks dev startup).
 * - Only downloads files not already present locally.
 * - Exits 0 on all errors (warnings only, never a hard failure).
 *
 * Credentials — add to .env.local (one-time setup):
 *   KUDU_USER=$saurav-portfolio
 *   KUDU_PASS=<password>
 *
 * Get password once:
 *   az webapp deployment list-publishing-profiles \
 *     --name saurav-portfolio --resource-group rg-saurav-portfolio \
 *     --query "[?publishMethod=='ZipDeploy']|[0].userPWD" --output tsv
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Load .env.local (simple key=value parser, no extra dependency needed)
const envLocalPath = path.join(root, ".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  }
}

const KUDU_USER = process.env.KUDU_USER || process.env.AZURE_DEPLOY_USER;
const KUDU_PASS = process.env.KUDU_PASS || process.env.AZURE_DEPLOY_PASSWORD;

// Silently skip if credentials not configured — never block dev startup
if (!KUDU_USER || !KUDU_PASS) {
  console.log("[pull-live] No Kudu credentials — skipping. Add KUDU_USER + KUDU_PASS to .env.local to auto-sync admin content.");
  process.exit(0);
}

const KUDU_BASE = "https://saurav-portfolio.scm.azurewebsites.net/api/vfs/data/content";
const CONTENT_DIRS = ["blog", "case-studies"];

async function get(url) {
  const auth = Buffer.from(`${KUDU_USER}:${KUDU_PASS}`).toString("base64");
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

console.log("[pull-live] Checking live content...");
let downloaded = 0;
let deleted = 0;

// Fetch deletion manifest from live — admin-deleted files to remove locally
let liveDeleted = new Set();
try {
  const res = await get(`${KUDU_BASE}/deleted.json`);
  if (res) {
    const manifest = await res.json();
    if (Array.isArray(manifest)) liveDeleted = new Set(manifest);
  }
} catch {
  // No manifest or parse error — treat as empty
}

for (const dir of CONTENT_DIRS) {
  // Delete local files that admin deleted on live
  const localDir = path.join(root, "content", dir);
  if (fs.existsSync(localDir)) {
    for (const file of fs.readdirSync(localDir)) {
      if (!file.endsWith(".mdx")) continue;
      if (liveDeleted.has(`${dir}/${file}`)) {
        fs.unlinkSync(path.join(localDir, file));
        console.log(`[pull-live] ✕ deleted ${dir}/${file} (admin-deleted on live)`);
        deleted++;
      }
    }
  }

  // Fetch live listing
  let listing;
  try {
    const res = await get(`${KUDU_BASE}/${dir}/`);
    if (!res) continue;
    listing = await res.json();
  } catch (e) {
    console.warn(`[pull-live] ⚠ Could not list ${dir}/: ${e.message}`);
    continue;
  }

  const liveMdxNames = new Set(
    listing.filter((f) => f.name?.endsWith(".mdx")).map((f) => f.name)
  );

  // Download new / update changed files (skip admin-deleted ones)
  for (const name of liveMdxNames) {
    if (liveDeleted.has(`${dir}/${name}`)) continue;
    const localPath = path.join(root, "content", dir, name);

    try {
      const res = await get(`${KUDU_BASE}/${dir}/${name}`);
      if (!res) continue;
      const liveContent = await res.text();
      const localContent = fs.existsSync(localPath) ? fs.readFileSync(localPath, "utf-8") : null;
      if (localContent === liveContent) continue; // already in sync
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, liveContent, "utf-8");
      const action = localContent ? "↺ updated" : "↓ new";
      console.log(`[pull-live] ${action} ${dir}/${name}`);
      downloaded++;
    } catch (e) {
      console.warn(`[pull-live] ⚠ Failed to download ${dir}/${name}: ${e.message}`);
    }
  }
}

const changes = downloaded + deleted;
if (changes > 0) {
  console.log(`[pull-live] Synced ${changes} change(s) (${downloaded} downloaded, ${deleted} deleted). Consider: git add content/ && git commit -m "chore: sync admin content"`);
} else {
  console.log("[pull-live] Already up to date.");
}
