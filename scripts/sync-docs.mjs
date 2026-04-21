#!/usr/bin/env node
/**
 * sync-docs.mjs — Single source of truth for keeping docs in sync with content.
 *
 * Runs in two contexts:
 *   1. Local:        node scripts/sync-docs.mjs        (or: npm run sync:docs)
 *   2. CI (Actions): .github/workflows/sync-docs.yml runs this on every push to main
 *
 * What it updates (all via HTML-comment markers so blocks are idempotent):
 *
 *   README.md
 *     <!-- SYNC:STATS:START --> ... <!-- SYNC:STATS:END -->
 *
 *   .claude/project-memory.md
 *     <!-- SYNC:LAST_AUTO_UPDATE:START --> ... <!-- SYNC:LAST_AUTO_UPDATE:END -->
 *     <!-- SYNC:ROUTES:START --> ... <!-- SYNC:ROUTES:END -->
 *     <!-- SYNC:STATS:START --> ... <!-- SYNC:STATS:END -->
 *
 *   .claude/CLAUDE.md
 *     <!-- SYNC:SKILLS:START --> ... <!-- SYNC:SKILLS:END -->
 *     <!-- SYNC:DEPS:START --> ... <!-- SYNC:DEPS:END -->
 *
 *   .claude/architecture.md | lessons.md | patterns.md
 *   .github/copilot-instructions.md
 *     <!-- SYNC:FOOTER:START --> ... <!-- SYNC:FOOTER:END -->  (timestamp + commit)
 *
 * Everything outside the markers is left untouched. If a marker pair is missing,
 * the block is inserted at a sensible fallback anchor (or appended to the file).
 *
 * Exit 0 on success (even when nothing changed).
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const portfolioRoot = resolve(__dirname, "..");
const contentDir = join(portfolioRoot, "content");
const appDir = join(portfolioRoot, "app");
const skillsDir = join(portfolioRoot, ".claude", "skills");

const readmePath = join(portfolioRoot, "README.md");
const memoryPath = join(portfolioRoot, ".claude", "project-memory.md");
const claudeMdPath = join(portfolioRoot, ".claude", "CLAUDE.md");
const archPath = join(portfolioRoot, ".claude", "architecture.md");
const lessonsPath = join(portfolioRoot, ".claude", "lessons.md");
const patternsPath = join(portfolioRoot, ".claude", "patterns.md");
const copilotInstrPath = join(portfolioRoot, ".github", "copilot-instructions.md");
const packageJsonPath = join(portfolioRoot, "package.json");

// ---------- helpers ----------
function readJSON(file) {
  const p = join(contentDir, file);
  if (!existsSync(p)) return [];
  return JSON.parse(readFileSync(p, "utf8").replace(/^\uFEFF/, ""));
}

function readJSONAny(absPath) {
  if (!existsSync(absPath)) return null;
  return JSON.parse(readFileSync(absPath, "utf8").replace(/^\uFEFF/, ""));
}

function countMdx(subdir) {
  const dir = join(contentDir, subdir);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith(".mdx") || f.endsWith(".md")).length;
}

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: portfolioRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Recursively walk a directory and return every `page.tsx` / `route.ts` path
 * as a Next.js App Router URL. Used to generate the routes index block.
 */
function scanAppRoutes(dir = appDir, base = "") {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    // Ignore private folders like `_components`, and grouping like `(public)`.
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue;
      const seg = entry.name.startsWith("(") && entry.name.endsWith(")") ? "" : entry.name;
      results.push(...scanAppRoutes(full, seg ? `${base}/${seg}` : base));
    } else if (entry.isFile()) {
      if (entry.name === "page.tsx" || entry.name === "page.ts" || entry.name === "page.js") {
        results.push({ kind: "page", path: base || "/" });
      } else if (entry.name === "route.ts" || entry.name === "route.js") {
        results.push({ kind: "route", path: base || "/" });
      }
    }
  }
  return results;
}

function scanSkills() {
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => {
      const skillFile = join(skillsDir, e.name, "SKILL.md");
      let title = e.name;
      if (existsSync(skillFile)) {
        const first = readFileSync(skillFile, "utf8").split("\n").find((l) => l.startsWith("# "));
        if (first) title = first.replace(/^#\s+/, "").trim();
      }
      return { slug: e.name, title };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * Replace the block between `startMarker` and `endMarker` with `replacement`.
 * If markers are missing, insert after `fallbackAnchor`, else prepend to file.
 * Returns the new file contents (identical if nothing needed doing).
 */
function upsertBlock(source, startMarker, endMarker, replacement, fallbackAnchor) {
  const startIdx = source.indexOf(startMarker);
  const endIdx = source.indexOf(endMarker);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = source.slice(0, startIdx);
    const after = source.slice(endIdx + endMarker.length);
    return before + replacement + after;
  }
  if (fallbackAnchor) {
    const anchorIdx = source.indexOf(fallbackAnchor);
    if (anchorIdx !== -1) {
      const insertAt = anchorIdx + fallbackAnchor.length;
      return source.slice(0, insertAt) + "\n\n" + replacement + "\n" + source.slice(insertAt);
    }
  }
  return source.trimEnd() + "\n\n" + replacement + "\n";
}

// ---------- 1. Gather stats ----------
const certifications = readJSON("certifications.json");
const projects = readJSON("projects.json");
const talks = readJSON("talks.json");
const events = readJSON("events.json");
const profile = (() => {
  try { return readJSON("profile.json"); } catch { return {}; }
})();
const speakingCount = Array.isArray(profile?.speaking) ? profile.speaking.length : 0;
const blogCount = countMdx("blog");
const caseStudyCount = countMdx("case-studies");

const stats = {
  certifications: certifications.length,
  projects: projects.length,
  caseStudies: caseStudyCount,
  blogPosts: blogCount,
  talks: talks.length,
  events: events.length,
  speakingEngagements: speakingCount,
};

const routes = scanAppRoutes();
const publicPages = routes.filter((r) => r.kind === "page" && !r.path.startsWith("/admin") && !r.path.startsWith("/api"));
const adminPages = routes.filter((r) => r.kind === "page" && r.path.startsWith("/admin"));
const apiRoutes = routes.filter((r) => r.kind === "route");

const skills = scanSkills();
const pkg = readJSONAny(packageJsonPath) || {};

const lastCommit = git('log -1 --pretty="%h %s"').replace(/^"|"$/g, "") || "(no git history)";
const lastCommitIso = git("log -1 --pretty=%cI") || new Date().toISOString();
const now = new Date().toISOString();
const today = now.split("T")[0];

// ---------- 2. Build blocks ----------

const statsBlock = [
  "<!-- SYNC:STATS:START -->",
  "<!-- Auto-generated by scripts/sync-docs.mjs — do not edit by hand -->",
  "",
  "## Content at a Glance",
  "",
  "| Area | Count |",
  "|---|---|",
  `| Certifications | ${stats.certifications} |`,
  `| Projects | ${stats.projects} |`,
  `| Case Studies | ${stats.caseStudies} |`,
  `| Blog Posts | ${stats.blogPosts} |`,
  `| YouTube Talks | ${stats.talks} |`,
  `| Events | ${stats.events} |`,
  `| Speaking Engagements | ${stats.speakingEngagements} |`,
  "",
  `_Last synced: ${today}_`,
  "",
  "<!-- SYNC:STATS:END -->",
].join("\n");

function renderRouteList(list, kind) {
  if (!list.length) return "_(none)_";
  return list
    .map((r) => `- \`${r.path}\`${kind === "route" ? "" : ""}`)
    .join("\n");
}

const routesBlock = [
  "<!-- SYNC:ROUTES:START -->",
  "<!-- Auto-generated by scripts/sync-docs.mjs — do not edit by hand -->",
  "",
  "### Auto-Synced Route Inventory",
  "",
  `**Public pages (${publicPages.length}):**`,
  "",
  renderRouteList(publicPages, "page"),
  "",
  `**Admin pages (${adminPages.length}):**`,
  "",
  renderRouteList(adminPages, "page"),
  "",
  `**API routes (${apiRoutes.length}):**`,
  "",
  renderRouteList(apiRoutes, "route"),
  "",
  `_Last synced: ${today}_`,
  "",
  "<!-- SYNC:ROUTES:END -->",
].join("\n");

const lastAutoBlock = [
  "<!-- SYNC:LAST_AUTO_UPDATE:START -->",
  "<!-- Auto-generated by scripts/sync-docs.mjs — manual session summaries go ABOVE this block -->",
  "",
  "### Last Auto-Sync",
  "",
  `- **Synced at:** ${now}`,
  `- **Last commit:** \`${lastCommit}\``,
  `- **Commit date:** ${lastCommitIso}`,
  `- **Content counts:** ${stats.certifications} certs · ${stats.projects} projects · ${stats.caseStudies} case studies · ${stats.blogPosts} blog posts · ${stats.talks} talks · ${stats.events} events · ${stats.speakingEngagements} speaking`,
  `- **Route counts:** ${publicPages.length} public · ${adminPages.length} admin · ${apiRoutes.length} API`,
  "",
  "<!-- SYNC:LAST_AUTO_UPDATE:END -->",
].join("\n");

const skillsBlock = [
  "<!-- SYNC:SKILLS:START -->",
  "<!-- Auto-generated by scripts/sync-docs.mjs — scans .claude/skills/*/SKILL.md -->",
  "",
  "### Available Skills (auto-indexed)",
  "",
  skills.length
    ? skills.map((s) => `- **\`${s.slug}\`** — ${s.title} (\`.claude/skills/${s.slug}/SKILL.md\`)`).join("\n")
    : "_(no skills found)_",
  "",
  `_Last synced: ${today}_`,
  "",
  "<!-- SYNC:SKILLS:END -->",
].join("\n");

function prodDepLines(limit = 20) {
  const d = pkg.dependencies || {};
  return Object.entries(d)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, limit)
    .map(([name, ver]) => `- \`${name}\`: \`${ver}\``);
}

const depsBlock = [
  "<!-- SYNC:DEPS:START -->",
  "<!-- Auto-generated by scripts/sync-docs.mjs — snapshot of package.json dependencies -->",
  "",
  "### Core Dependencies (auto-synced)",
  "",
  ...prodDepLines(50),
  "",
  `_Last synced: ${today} · Node engines: \`${pkg.engines?.node || "not specified"}\`_`,
  "",
  "<!-- SYNC:DEPS:END -->",
].join("\n");

const footerBlock = [
  "<!-- SYNC:FOOTER:START -->",
  "",
  "---",
  "",
  `_**Last auto-synced:** ${now} · commit \`${lastCommit}\` · via [\`scripts/sync-docs.mjs\`](../scripts/sync-docs.mjs)_`,
  "",
  "<!-- SYNC:FOOTER:END -->",
].join("\n");

// ---------- 3. Apply edits ----------
const targets = [
  {
    file: readmePath,
    edits: [
      { start: "<!-- SYNC:STATS:START -->", end: "<!-- SYNC:STATS:END -->", body: statsBlock, anchor: "**Live site:** https://saurav-portfolio.azurewebsites.net" },
    ],
  },
  {
    file: memoryPath,
    edits: [
      { start: "<!-- SYNC:STATS:START -->", end: "<!-- SYNC:STATS:END -->", body: statsBlock, anchor: "## Last Session Summary" },
      { start: "<!-- SYNC:ROUTES:START -->", end: "<!-- SYNC:ROUTES:END -->", body: routesBlock, anchor: "## All Routes" },
      { start: "<!-- SYNC:LAST_AUTO_UPDATE:START -->", end: "<!-- SYNC:LAST_AUTO_UPDATE:END -->", body: lastAutoBlock, anchor: "## Last Session Summary" },
    ],
  },
  {
    file: claudeMdPath,
    edits: [
      { start: "<!-- SYNC:SKILLS:START -->", end: "<!-- SYNC:SKILLS:END -->", body: skillsBlock, anchor: "# Portfolio — Claude Code Instructions" },
      { start: "<!-- SYNC:DEPS:START -->", end: "<!-- SYNC:DEPS:END -->", body: depsBlock, anchor: "# Portfolio — Claude Code Instructions" },
      { start: "<!-- SYNC:FOOTER:START -->", end: "<!-- SYNC:FOOTER:END -->", body: footerBlock, anchor: null },
    ],
  },
  {
    file: archPath,
    edits: [{ start: "<!-- SYNC:FOOTER:START -->", end: "<!-- SYNC:FOOTER:END -->", body: footerBlock, anchor: null }],
  },
  {
    file: lessonsPath,
    edits: [{ start: "<!-- SYNC:FOOTER:START -->", end: "<!-- SYNC:FOOTER:END -->", body: footerBlock, anchor: null }],
  },
  {
    file: patternsPath,
    edits: [{ start: "<!-- SYNC:FOOTER:START -->", end: "<!-- SYNC:FOOTER:END -->", body: footerBlock, anchor: null }],
  },
  {
    file: copilotInstrPath,
    edits: [
      { start: "<!-- SYNC:SKILLS:START -->", end: "<!-- SYNC:SKILLS:END -->", body: skillsBlock, anchor: "# Portfolio — Copilot Workspace Instructions" },
      { start: "<!-- SYNC:FOOTER:START -->", end: "<!-- SYNC:FOOTER:END -->", body: footerBlock, anchor: null },
    ],
  },
];

const changed = [];
for (const target of targets) {
  if (!existsSync(target.file)) continue;
  let source = readFileSync(target.file, "utf8");
  const original = source;
  for (const edit of target.edits) {
    source = upsertBlock(source, edit.start, edit.end, edit.body, edit.anchor);
  }
  if (source !== original) {
    writeFileSync(target.file, source, "utf8");
    changed.push(relative(portfolioRoot, target.file).replace(/\\/g, "/"));
  }
}

// ---------- 4. Report ----------
console.log(JSON.stringify({ stats, skills: skills.length, routes: { public: publicPages.length, admin: adminPages.length, api: apiRoutes.length }, changedFiles: changed, lastCommit }, null, 2));
