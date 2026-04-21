import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import fs from "node:fs";
import path from "node:path";
import { contentDir, bundledContentDir } from "@/lib/content-dir";
import { revalidatePath } from "next/cache";

/**
 * POST /api/admin/sync-content
 *
 * Force-resyncs a bundled content file (from the deployed bundle) into the
 * persistent `/home/data/content/` volume on Azure App Service. This is the
 * escape hatch for cases where the startup field-merge in sync-content.mjs
 * doesn't pull in a code-driven change you care about (e.g. you want to
 * replace admin-edited values with the bundled ones).
 *
 * Body: { file: "certifications.json", mode: "merge" | "overwrite" }
 *   - merge (default): field-merge bundled → persistent (safe; keeps admin edits)
 *   - overwrite: fully replace persistent with bundled (destructive)
 *
 * Auth: requires signed-in admin session.
 */

const ALLOWED_FILES = new Set([
  "certifications.json",
  "projects.json",
  "talks.json",
  "events-overrides.json",
]);

const FIELD_MERGE_KEYS: Record<string, { key: string; placeholderValues?: Record<string, unknown[]> }> = {
  "certifications.json": {
    key: "code",
    placeholderValues: { verifyUrl: ["#", "", null] },
  },
  "projects.json": { key: "slug" },
  "talks.json": { key: "id" },
};

function isMissing(value: unknown, placeholders?: unknown[]) {
  if (value === undefined || value === null) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (placeholders && placeholders.includes(value)) return true;
  return false;
}

function readJson(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf-8").replace(/^\uFEFF/, ""));
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { file?: string; mode?: "merge" | "overwrite" };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const file = String(body?.file || "").trim();
  const mode = (body?.mode === "overwrite" ? "overwrite" : "merge") as "merge" | "overwrite";

  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: `File not in allowlist. Allowed: ${Array.from(ALLOWED_FILES).join(", ")}` }, { status: 400 });
  }

  const bundledPath = path.join(bundledContentDir, file);
  const persistentPath = path.join(contentDir, file);

  if (!fs.existsSync(bundledPath)) {
    return NextResponse.json({ error: `Bundled file not found: ${bundledPath}` }, { status: 404 });
  }

  try {
    if (mode === "overwrite" || !fs.existsSync(persistentPath)) {
      fs.mkdirSync(path.dirname(persistentPath), { recursive: true });
      fs.copyFileSync(bundledPath, persistentPath);
      revalidatePath("/", "layout");
      return NextResponse.json({
        ok: true,
        mode: "overwrite",
        file,
        message: `${file} overwritten from bundle.`,
      });
    }

    const mergeCfg = FIELD_MERGE_KEYS[file];
    if (!mergeCfg) {
      return NextResponse.json({ error: `No merge config for ${file}. Use mode=overwrite.` }, { status: 400 });
    }
    const bundled = readJson(bundledPath);
    const persistent = readJson(persistentPath);
    if (!Array.isArray(bundled) || !Array.isArray(persistent)) {
      return NextResponse.json({ error: "Field-merge expects arrays" }, { status: 400 });
    }

    const { key, placeholderValues = {} } = mergeCfg;
    const byKey = new Map(persistent.map((r: Record<string, unknown>) => [r?.[key], r]));
    const changes: string[] = [];

    for (const bRecord of bundled as Record<string, unknown>[]) {
      const id = bRecord[key];
      if (id == null) continue;
      const pRecord = byKey.get(id);
      if (!pRecord) {
        persistent.push({ ...bRecord });
        changes.push(`+ new ${key}=${id}`);
        continue;
      }
      for (const [field, bValue] of Object.entries(bRecord)) {
        if (bValue === undefined) continue;
        const placeholders = placeholderValues[field];
        if (isMissing(pRecord[field], placeholders) && !isMissing(bValue, placeholders)) {
          pRecord[field] = bValue;
          changes.push(`${key}=${id} set ${field}`);
        }
      }
    }

    fs.writeFileSync(persistentPath, JSON.stringify(persistent, null, 2) + "\n", "utf-8");
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, mode, file, changes, count: changes.length });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
