/**
 * content-sync-once.ts — Lazy, idempotent reconciliation of bundled content
 * into the Azure persistent volume, run on first access from the server.
 *
 * Why: production reads `/home/data/content` (Azure Files), NOT the deployed
 * bundle — that's what makes admin-panel edits survive zipdeploy. The flip
 * side is that content committed to `content/*.json` in the repo reaches the
 * zip and the build-time prerender (sitemap) but never the running pages.
 * sync-content.mjs exists to reconcile the two, but nothing invokes it in
 * production. This makes the sync self-healing: the first time a content
 * getter runs after a deploy, it reconciles the bundle into the volume.
 *
 * Two modes:
 *   - merge (default): append bundle-only records, backfill fields that are
 *     missing/placeholder in the persistent copy. Admin edits always win.
 *   - overwrite: copy the bundle over the persistent file wholesale. Only for
 *     code-managed files that no admin route writes.
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
  /** Field that identifies a record within the array. */
  key: string;
  /** Persistent values to treat as "missing" and replace from the bundle. */
  placeholderValues?: Placeholders;
  /**
   * For object-wrapped files (e.g. `{ edition, entries: [...] }`), the property
   * holding the record array. Omit for files that are a top-level array.
   */
  entriesField?: string;
}

const SPECS = {
  "certifications.json": {
    key: "code",
    placeholderValues: { verifyUrl: ["#", "", null] },
  },
  // Events added in the repo (committed to content/events.json) must reach
  // /home/data/content/events.json, otherwise they exist in the bundle and the
  // sitemap but never render — the page getters read the persistent copy.
  "events.json": { key: "slug" },
  "projects.json": { key: "id" },
  "talks.json": { key: "id" },
  // Object-wrapped: the records live under `entries`, so a plain array merge
  // would silently no-op on these two.
  "tech-radar.json": { key: "id", entriesField: "entries" },
  "decisions.json": { key: "id", entriesField: "entries" },
} satisfies Record<string, MergeSpec>;

/**
 * Code-managed files with no admin write path — the bundle is the source of
 * truth, so replace the persistent copy outright.
 */
const OVERWRITE = ["profile.json"] as const;

export type SyncableFile = keyof typeof SPECS | (typeof OVERWRITE)[number];

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

/** Resolve bundle/persistent paths, or null when there is nothing to do. */
function resolvePaths(file: string) {
  const bundledPath = path.join(bundledContentDir, file);
  const persistentPath = path.join(contentDir, file);
  if (!fs.existsSync(bundledPath)) return null; // nothing to sync from
  // Local dev: contentDir === bundledContentDir, so this is a no-op.
  if (path.resolve(bundledPath) === path.resolve(persistentPath)) return null;
  return { bundledPath, persistentPath };
}

/** Seed a missing persistent file straight from the bundle. */
function seed(bundledPath: string, persistentPath: string, file: string) {
  fs.mkdirSync(path.dirname(persistentPath), { recursive: true });
  fs.copyFileSync(bundledPath, persistentPath);
  console.log(`[content-sync] seeded ${file} from bundle`);
}

function overwrite(file: string) {
  const paths = resolvePaths(file);
  if (!paths) return;
  fs.mkdirSync(path.dirname(paths.persistentPath), { recursive: true });
  fs.copyFileSync(paths.bundledPath, paths.persistentPath);
  console.log(`[content-sync] overwrote ${file} from bundle`);
}

function fieldMerge(file: string, spec: MergeSpec) {
  const paths = resolvePaths(file);
  if (!paths) return;
  const { bundledPath, persistentPath } = paths;

  if (!fs.existsSync(persistentPath)) {
    seed(bundledPath, persistentPath, file);
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

  // Unwrap object-shaped files ({ edition, entries: [...] }) down to the array.
  // `persistentRecords` stays a live reference into `persistent`, so mutating
  // it updates the wrapper we write back.
  const pick = (v: unknown) =>
    spec.entriesField ? (v as Record<string, unknown> | null)?.[spec.entriesField] : v;
  const bundledRecords = pick(bundled);
  const persistentRecords = pick(persistent);
  if (!Array.isArray(bundledRecords) || !Array.isArray(persistentRecords)) {
    console.warn(`[content-sync] ${file}: expected an array of records — skipping`);
    return;
  }

  const { key, placeholderValues = {} } = spec;
  const byKey = new Map<unknown, Record<string, unknown>>(
    persistentRecords.map((r) => [(r as Record<string, unknown>)?.[key], r as Record<string, unknown>])
  );
  let changes = 0;

  for (const bRecord of bundledRecords as Record<string, unknown>[]) {
    const id = bRecord[key];
    if (id == null) continue;
    const pRecord = byKey.get(id);
    if (!pRecord) {
      persistentRecords.push({ ...bRecord });
      byKey.set(id, bRecord);
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
 * Ensure a bundled content file has been reconciled into the persistent volume
 * at least once this process. Safe no-op after the first call, and on local dev.
 */
export function ensureContentSynced(file: SyncableFile) {
  if (synced.has(file)) return;
  synced.add(file);
  try {
    if ((OVERWRITE as readonly string[]).includes(file)) overwrite(file);
    else fieldMerge(file, SPECS[file as keyof typeof SPECS]);
  } catch (e) {
    console.warn(`[content-sync] ${file}: unexpected error — ${(e as Error).message}`);
  }
}
