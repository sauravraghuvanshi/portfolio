/**
 * content-sync-once.ts — Lazy, idempotent field-merge of bundled content
 * into the Azure persistent volume, run on first access from the server.
 *
 * Why: sync-content.mjs is intended to run at startup but isn't currently
 * wired into the standalone entry. This makes the sync self-healing: the
 * first time a content getter runs after a deploy, it field-merges bundled
 * values into `/home/data/content/<file>.json`, preserving admin-edited
 * values and replacing only missing/placeholder fields.
 *
 * Called from `lib/content.ts` getters. Cheap: each file syncs at most once
 * per process, behind a module-level flag. Safe: any failure is logged and
 * swallowed — the caller still sees whatever's on disk.
 */
import fs from "node:fs";
import path from "node:path";
import { contentDir, bundledContentDir } from "./content-dir";

type Placeholders = Record<string, unknown[]>;

interface MergeSpec {
  key: string;
  placeholderValues?: Placeholders;
}

const SPECS: Record<string, MergeSpec> = {
  "certifications.json": {
    key: "code",
    placeholderValues: { verifyUrl: ["#", "", null] },
  },
};

const synced = new Set<string>();

function isMissing(value: unknown, placeholders?: unknown[]) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (placeholders && placeholders.includes(value)) return true;
  return false;
}

function readJson(p: string): unknown {
  return JSON.parse(fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, ""));
}

function fieldMerge(file: string, spec: MergeSpec) {
  const bundledPath = path.join(bundledContentDir, file);
  const persistentPath = path.join(contentDir, file);

  if (!fs.existsSync(bundledPath)) return; // nothing to merge from
  // If contentDir === bundledContentDir (local dev), do nothing.
  if (path.resolve(bundledPath) === path.resolve(persistentPath)) return;

  if (!fs.existsSync(persistentPath)) {
    fs.mkdirSync(path.dirname(persistentPath), { recursive: true });
    fs.copyFileSync(bundledPath, persistentPath);
    console.log(`[content-sync] seeded ${file} from bundle`);
    return;
  }

  let bundled: unknown, persistent: unknown;
  try {
    bundled = readJson(bundledPath);
    persistent = readJson(persistentPath);
  } catch (e) {
    console.warn(`[content-sync] ${file}: parse failed — ${(e as Error).message}`);
    return;
  }
  if (!Array.isArray(bundled) || !Array.isArray(persistent)) return;

  const { key, placeholderValues = {} } = spec;
  const byKey = new Map<unknown, Record<string, unknown>>(
    persistent.map((r) => [(r as Record<string, unknown>)?.[key], r as Record<string, unknown>])
  );
  let changes = 0;

  for (const bRecord of bundled as Record<string, unknown>[]) {
    const id = bRecord[key];
    if (id == null) continue;
    const pRecord = byKey.get(id);
    if (!pRecord) {
      (persistent as Record<string, unknown>[]).push({ ...bRecord });
      changes++;
      continue;
    }
    for (const [field, bValue] of Object.entries(bRecord)) {
      if (bValue === undefined) continue;
      const placeholders = placeholderValues[field];
      if (isMissing(pRecord[field], placeholders) && !isMissing(bValue, placeholders)) {
        pRecord[field] = bValue;
        changes++;
      }
    }
  }

  if (changes > 0) {
    try {
      fs.writeFileSync(persistentPath, JSON.stringify(persistent, null, 2) + "\n", "utf-8");
      console.log(`[content-sync] field-merged ${file}: ${changes} change(s)`);
    } catch (e) {
      console.warn(`[content-sync] ${file}: write failed — ${(e as Error).message}`);
    }
  }
}

/**
 * Ensure a bundled content file has been field-merged into the persistent
 * volume at least once this process. Safe no-op after the first call.
 */
export function ensureContentSynced(file: keyof typeof SPECS) {
  if (synced.has(file)) return;
  synced.add(file);
  try {
    fieldMerge(file, SPECS[file]);
  } catch (e) {
    console.warn(`[content-sync] ${file}: unexpected error — ${(e as Error).message}`);
  }
}
