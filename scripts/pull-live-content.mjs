/**
 * pull-live-content.mjs
 *
 * Automatically downloads admin-created content from the live Azure App Service
 * persistent storage (/home/data/content) into local content/:
 *   - blog/ + case-studies/ MDX files
 *   - admin-managed JSON (talks, events, projects, certifications, radar, ADRs)
 *
 * The admin panel writes to persistent storage only, so anything added through
 * /admin exists ONLY on live until this script pulls it down. Without the JSON
 * half, admin-created talks and events are invisible on localhost.
 *
 * Runs automatically via `predev` before `npm run dev`.
 * Also available as `npm run pull:live` on demand.
 *
 * - Skips silently if credentials are absent (never blocks dev startup).
 * - MDX: live wins (admin is the source of truth for prose).
 * - JSON: ADDITIVE MERGE ONLY — new records are appended, existing local records
 *   are never overwritten or deleted. See MERGE_SPEC for why.
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

/**
 * Admin-managed JSON to pull down, and how to identify a record inside each file.
 *   nest — property holding the record array, or null when the file IS the array
 *   key  — unique record identifier, or null when the file is a plain map
 *
 * The merge is ADDITIVE ONLY: records present on live but missing locally are
 * appended; existing local records are never overwritten or deleted.
 *
 * That asymmetry is deliberate. Live is ahead of the repo for admin-authored files
 * (talks, events) because the admin panel only ever writes to persistent storage.
 * But the repo is ahead of live for code-authored files (projects.json,
 * tech-radar.json) because sync-content.mjs never overwrites JSON that already
 * exists on Azure. A blanket "live wins" copy would fix the first case by silently
 * regressing the second.
 *
 * Deliberately excluded:
 *   - profile.json / portfolio-rag.json — code-managed & generated; the bundle
 *     always overwrites these on Azure (see sync-content.mjs ALWAYS_OVERWRITE).
 *   - subscribers.json — newsletter PII, must never land in the repo.
 *   - cloud-icons.json, newsletters/, playground-templates/ — live-only runtime
 *     data, not tracked in the repo's content model.
 */
const MERGE_SPEC = {
  "talks.json":            { nest: null,      key: "id" },
  "events.json":           { nest: null,      key: "slug" },
  "events-overrides.json": { nest: null,      key: null },
  "projects.json":         { nest: null,      key: "id" },
  "certifications.json":   { nest: null,      key: "code" },
  "tech-radar.json":       { nest: "entries", key: "id" },
  "decisions.json":        { nest: "entries", key: "id" },
};

/** Strip a UTF-8 BOM — Kudu and Windows editors both emit them. */
const parseJson = (text) => JSON.parse(text.replace(/^\uFEFF/, ""));

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

// ---------------------------------------------------------------------------
// Admin-managed JSON — talks, events, projects, certifications, radar, ADRs.
// These are the files the admin panel writes to; without this pass, anything
// added via /admin stays invisible on localhost. Additive merge only — see
// MERGE_SPEC for why a straight overwrite would be wrong.
// ---------------------------------------------------------------------------
let jsonSynced = 0;

for (const [name, spec] of Object.entries(MERGE_SPEC)) {
  const localPath = path.join(root, "content", name);
  if (!fs.existsSync(localPath)) continue; // not tracked in the repo — nothing to merge into

  let live;
  try {
    const res = await get(`${KUDU_BASE}/${name}`);
    if (!res) continue; // 404 on live — nothing to pull
    live = parseJson(await res.text());
  } catch (e) {
    console.warn(`[pull-live] ⚠ Skipping ${name}: ${e.message}`);
    continue;
  }

  const rawLocal = fs.readFileSync(localPath, "utf-8");
  let local;
  try {
    local = parseJson(rawLocal);
  } catch (e) {
    console.warn(`[pull-live] ⚠ Local ${name} is not valid JSON (${e.message}) — skipping.`);
    continue;
  }

  const added = [];

  if (spec.key === null) {
    // Plain map keyed by slug (events-overrides.json)
    if (!live || typeof live !== "object" || Array.isArray(live)) {
      console.warn(`[pull-live] ⚠ Unexpected shape in ${name} — skipping.`);
      continue;
    }
    for (const [k, v] of Object.entries(live)) {
      if (Object.hasOwn(local, k)) continue;
      local[k] = v;
      added.push(k);
    }
  } else {
    const liveList = spec.nest ? live?.[spec.nest] : live;
    const localList = spec.nest ? local?.[spec.nest] : local;
    if (!Array.isArray(liveList) || !Array.isArray(localList)) {
      console.warn(`[pull-live] ⚠ Unexpected shape in ${name} — skipping.`);
      continue;
    }
    const known = new Set(localList.map((r) => r?.[spec.key]));
    for (const rec of liveList) {
      if (!rec || known.has(rec[spec.key])) continue;
      // Append: the loaders sort newest-first by reverse file order (lib/content.ts),
      // so a record added at the end surfaces at the top of the page.
      localList.push(rec);
      known.add(rec[spec.key]);
      added.push(rec.title || rec.name || rec[spec.key]);
    }
  }

  if (added.length === 0) continue;

  fs.writeFileSync(
    localPath,
    JSON.stringify(local, null, 2) + (rawLocal.endsWith("\n") ? "\n" : ""),
    "utf-8"
  );
  console.log(`[pull-live] + ${name} — added ${added.length}: ${added.join(", ")}`);
  jsonSynced += added.length;
}

const changes = downloaded + deleted + jsonSynced;
if (changes > 0) {
  console.log(`[pull-live] Synced ${changes} change(s) (${downloaded} downloaded, ${deleted} deleted, ${jsonSynced} record(s) added). Consider: git add content/ && git commit -m "chore: sync admin content"`);
} else {
  console.log("[pull-live] Already up to date.");
}
