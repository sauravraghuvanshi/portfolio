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
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
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

let downloaded = 0;

for (const dir of CONTENT_DIRS) {
  let listing;
  try {
    const res = await get(`${KUDU_BASE}/${dir}/`);
    if (!res) continue;
    listing = await res.json();
  } catch {
    // Network issue or directory doesn't exist yet — skip quietly
    continue;
  }

  const mdxFiles = listing.filter((f) => f.name?.endsWith(".mdx"));

  for (const file of mdxFiles) {
    const localPath = path.join(root, "content", dir, file.name);
    if (fs.existsSync(localPath)) continue;

    try {
      const res = await get(`${KUDU_BASE}/${dir}/${file.name}`);
      if (!res) continue;
      const content = await res.text();
      fs.mkdirSync(path.dirname(localPath), { recursive: true });
      fs.writeFileSync(localPath, content, "utf-8");
      console.log(`[pull-live] ↓ ${dir}/${file.name}`);
      downloaded++;
    } catch {
      // Skip individual file failures — don't block dev
    }
  }
}

if (downloaded > 0) {
  console.log(`[pull-live] Synced ${downloaded} admin-created file(s). Consider: git add content/ && git commit -m "chore: sync admin content"`);
}
