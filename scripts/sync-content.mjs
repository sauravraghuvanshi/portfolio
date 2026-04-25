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
 *   - certifications.json: FIELD-MERGE — preserves admin edits, backfills
 *     missing/placeholder fields from the bundle (so code-driven enrichment
 *     like new verifyUrl / credentialId values reach persistent storage
 *     without clobbering anything the admin has changed).
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
 */
const FIELD_MERGE = {
  "certifications.json": {
    key: "code",
    placeholderValues: { verifyUrl: ["#", "", null, undefined] },
  },
  "projects.json": { key: "id" },
  "talks.json": { key: "id" },
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
 * Field-merge an array-of-objects JSON file.
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
  if (!Array.isArray(bundled) || !Array.isArray(persistent)) {
    console.error(`[sync-content] FIELD-MERGE expected array for ${filename}. Skipping.`);
    return;
  }

  const { key, placeholderValues = {} } = config;
  const persistentByKey = new Map(persistent.map((r) => [r?.[key], r]));
  let changes = 0;

  for (const bRecord of bundled) {
    const id = bRecord?.[key];
    if (id == null) continue;
    const pRecord = persistentByKey.get(id);
    if (!pRecord) {
      // Append new record from bundle
      persistent.push({ ...bRecord });
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
syncDir(BUNDLED_DIR, PERSISTENT_DIR);
console.log("[sync-content] Done.");
