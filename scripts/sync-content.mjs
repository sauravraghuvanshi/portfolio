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
 *   - FIELD_MERGE files: preserve admin edits, append bundle-only records, and
 *     backfill missing/placeholder fields from the bundle (so code-driven
 *     content added in the repo reaches persistent storage without clobbering
 *     anything the admin has changed).
 *
 * NOTE: nothing invokes this script in production — the running app relies on
 * lib/content-sync-once.ts, which does the same reconciliation lazily on first
 * content read. Keep FIELD_MERGE here in sync with SPECS there.
 */

import fs from "fs";
import path from "path";

const PERSISTENT_DIR = "/home/data/content";
const BUNDLED_DIR = path.join(process.cwd(), "content");

/** Files that are code-managed — always overwrite from bundle. */
const ALWAYS_OVERWRITE = new Set(["profile.json", "portfolio-rag.json"]);

/**
 * JSON files that should be FIELD-MERGED instead of copy-if-missing.
 * Map of filename → merge config:
 *   - key: which field identifies a record in the array
 *   - placeholderValues: values in persistent that should be treated as
 *     "missing" and replaced by bundled values (e.g. "#" for a dead link)
 *   - entriesField: for object-wrapped files ({ edition, entries: [...] }),
 *     the property holding the record array. Omit for top-level arrays.
 *
 * Keep this in sync with SPECS in lib/content-sync-once.ts — that module is
 * what actually runs in production (nothing invokes this script there).
 */
const FIELD_MERGE = {
  "certifications.json": {
    key: "code",
    placeholderValues: { verifyUrl: ["#", "", null, undefined] },
  },
  "projects.json": { key: "id" },
  "talks.json": { key: "id" },
  "events.json": { key: "slug" },
  "tech-radar.json": { key: "id", entriesField: "entries" },
  "decisions.json": { key: "id", entriesField: "entries" },
};

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

function isMissing(value, placeholders) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (placeholders && placeholders.includes(value)) return true;
  return false;
}

/**
 * Field-merge an array-of-objects JSON file (or an object wrapping one under
 * `config.entriesField`).
 * For each record in the bundle:
 *   - Match by `key`. If not present in persistent → append (treat as new).
 *   - If present → backfill any field where persistent is missing/placeholder.
 * Records present only in persistent (e.g. admin-added) are kept as-is.
 * Writes back ONLY if something changed.
 */
function fieldMergeArrayJson(srcPath, destPath, config) {
  const filename = path.basename(srcPath);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`[sync-content] ADD ${filename} (field-merge target missing — seeded from bundle)`);
    return;
  }

  let bundled, persistent;
  try {
    bundled = JSON.parse(fs.readFileSync(srcPath, "utf-8").replace(/^\uFEFF/, ""));
    persistent = JSON.parse(fs.readFileSync(destPath, "utf-8").replace(/^\uFEFF/, ""));
  } catch (e) {
    console.error(`[sync-content] FIELD-MERGE failed to parse ${filename}: ${e.message}. Skipping.`);
    return;
  }
  // Unwrap object-shaped files ({ edition, entries: [...] }) down to the array.
  // `persistentRecords` stays a live reference into `persistent`, so mutating it
  // updates the wrapper we write back.
  const pick = (v) => (config.entriesField ? v?.[config.entriesField] : v);
  const bundledRecords = pick(bundled);
  const persistentRecords = pick(persistent);
  if (!Array.isArray(bundledRecords) || !Array.isArray(persistentRecords)) {
    console.error(`[sync-content] FIELD-MERGE expected array for ${filename}. Skipping.`);
    return;
  }

  const { key, placeholderValues = {} } = config;
  const persistentByKey = new Map(persistentRecords.map((r) => [r?.[key], r]));
  let changes = 0;

  for (const bRecord of bundledRecords) {
    const id = bRecord?.[key];
    if (id == null) continue;
    const pRecord = persistentByKey.get(id);
    if (!pRecord) {
      // Append new record from bundle
      persistentRecords.push({ ...bRecord });
      persistentByKey.set(id, bRecord);
      changes++;
      console.log(`[sync-content] MERGE ${filename}: + new ${key}=${id}`);
      continue;
    }
    // Backfill missing fields + replace placeholders
    for (const [field, bValue] of Object.entries(bRecord)) {
      if (bValue === undefined) continue;
      const pValue = pRecord[field];
      const placeholders = placeholderValues[field];
      // Only replace if persistent is missing AND bundled has a real value.
      if (isMissing(pValue, placeholders) && !isMissing(bValue, placeholders)) {
        pRecord[field] = bValue;
        changes++;
        console.log(`[sync-content] MERGE ${filename}: ${key}=${id} set ${field}`);
      }
    }
  }

  if (changes > 0) {
    fs.writeFileSync(destPath, JSON.stringify(persistent, null, 2) + "\n", "utf-8");
    console.log(`[sync-content] FIELD-MERGE ${filename}: ${changes} change(s) written`);
  } else {
    console.log(`[sync-content] FIELD-MERGE ${filename}: no changes`);
  }
}

/**
 * Deletion manifest — admin-deleted files recorded in deleted.json.
 * These must NOT be restored from the bundle.
 */
const deletedManifestPath = path.join(PERSISTENT_DIR, "deleted.json");
function readDeletedManifest() {
  try {
    if (!fs.existsSync(deletedManifestPath)) return new Set();
    return new Set(JSON.parse(fs.readFileSync(deletedManifestPath, "utf-8").replace(/^\uFEFF/, "")));
  } catch {
    return new Set();
  }
}

function syncDir(srcDir, destDir, deletedSet, relativeBase = "") {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });

  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const relativePath = relativeBase ? `${relativeBase}/${entry}` : entry;

    if (fs.statSync(srcPath).isDirectory()) {
      syncDir(srcPath, destPath, deletedSet, relativePath);
    } else if (deletedSet.has(relativePath)) {
      console.log(`[sync-content] SKIP ${relativePath} (admin-deleted)`);
    } else if (ALWAYS_OVERWRITE.has(entry)) {
      copyFileAlways(srcPath, destPath);
    } else if (FIELD_MERGE[entry]) {
      fieldMergeArrayJson(srcPath, destPath, FIELD_MERGE[entry]);
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
const deletedSet = readDeletedManifest();
if (deletedSet.size > 0) {
  console.log(`[sync-content] ${deletedSet.size} admin-deleted file(s) will be skipped.`);
}
syncDir(BUNDLED_DIR, PERSISTENT_DIR, deletedSet);
console.log("[sync-content] Done.");
