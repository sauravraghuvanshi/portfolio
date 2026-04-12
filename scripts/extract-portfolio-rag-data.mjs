#!/usr/bin/env node
/**
 * extract-portfolio-rag-data.mjs
 *
 * Extracts all portfolio content into JSONL chunks suitable for RAG indexing.
 * Reads: profile.json, projects.json, events.json, talks.json, certifications.json,
 *        blog/*.mdx, case-studies/*.mdx
 * Outputs: content/portfolio-rag.jsonl (one JSON object per line)
 *
 * Usage: node scripts/extract-portfolio-rag-data.mjs
 * Then upload portfolio-rag.jsonl to Azure Blob Storage for indexing.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "..", "content");
const OUTPUT_FILE = path.join(CONTENT_DIR, "portfolio-rag.jsonl");
const SITE_URL = "https://saurav-portfolio.azurewebsites.net";

const chunks = [];
let chunkId = 0;

function addChunk({ source, title, content, url, tags = [], category = "", date = "" }) {
  chunkId++;
  chunks.push({
    id: `chunk-${chunkId}`,
    source,
    title,
    content: content.trim(),
    url: url || "",
    tags,
    category,
    date,
  });
}

function readJson(filename) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, filename), "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function readMdx(subdir, filename) {
  const raw = fs.readFileSync(path.join(CONTENT_DIR, subdir, filename), "utf-8").replace(/^\uFEFF/, "");
  return raw;
}

function parseFrontmatter(mdxContent) {
  const match = mdxContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: mdxContent };

  const frontmatterRaw = match[1];
  const body = match[2];

  // Simple YAML-like parser for frontmatter
  const meta = {};
  let currentKey = null;
  let currentValue = null;
  for (const line of frontmatterRaw.split("\n")) {
    const kvMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      if (currentKey) meta[currentKey] = currentValue;
      currentKey = kvMatch[1];
      let val = kvMatch[2].trim();
      // Strip quotes
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      // Parse arrays
      if (val.startsWith("[") && val.endsWith("]")) {
        try {
          val = JSON.parse(val.replace(/'/g, '"'));
        } catch {
          val = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^['"]|['"]$/g, ""));
        }
      }
      currentValue = val;
    }
  }
  if (currentKey) meta[currentKey] = currentValue;
  return { meta, body };
}

function stripMdx(body) {
  return body
    .replace(/import\s+.*?from\s+['"].*?['"]\s*;?/g, "") // remove imports
    .replace(/<[^>]+\/>/g, "")       // self-closing JSX
    .replace(/<\/?[A-Z][^>]*>/g, "") // React components
    .replace(/```[\s\S]*?```/g, "[code block]") // code blocks → placeholder
    .replace(/!\[.*?\]\(.*?\)/g, "") // images
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1") // links → text only
    .replace(/#{1,6}\s*/g, "")       // heading markers
    .replace(/[*_]{1,3}/g, "")       // bold/italic
    .replace(/\n{3,}/g, "\n\n")      // collapse newlines
    .trim();
}

function chunkByHeadings(body, maxChars = 3000) {
  const sections = body.split(/(?=^## )/m);
  const result = [];
  let current = "";

  for (const section of sections) {
    if (current.length + section.length > maxChars && current.length > 0) {
      result.push(current.trim());
      current = section;
    } else {
      current += "\n\n" + section;
    }
  }
  if (current.trim().length > 0) {
    result.push(current.trim());
  }
  return result;
}

// ──────────────────────────────────────────────
// 1. Profile data
// ──────────────────────────────────────────────
console.log("[extract] Reading profile.json...");
const profile = readJson("profile.json");

// Profile overview
addChunk({
  source: "profile",
  title: `${profile.name} — Overview`,
  content: [
    `Name: ${profile.name}`,
    `Title: ${profile.title} at ${profile.company}`,
    `Location: ${profile.location}`,
    `Tagline: ${profile.tagline}`,
    `Summary: ${profile.summary}`,
    `About: ${profile.aboutLong}`,
    `Mission: ${profile.missionStatement}`,
    `Known For: ${profile.whatImKnownFor.join("; ")}`,
    `Stats: ${profile.credibilityStats.map((s) => `${s.value} ${s.label}`).join(", ")}`,
  ].join("\n"),
  url: SITE_URL,
  tags: ["profile", "overview"],
  category: "Profile",
});

// Skills
addChunk({
  source: "profile",
  title: `${profile.name} — Skills & Expertise`,
  content: Object.entries(profile.skills)
    .map(([cat, data]) => `${cat}: ${data.items.join(", ")}`)
    .join("\n"),
  url: `${SITE_URL}/resume`,
  tags: ["skills", "expertise"],
  category: "Profile",
});

// Experience (1 chunk per role)
for (const exp of profile.experience) {
  addChunk({
    source: "profile",
    title: `${profile.name} — ${exp.role} at ${exp.company}`,
    content: [
      `Role: ${exp.role}`,
      `Company: ${exp.company}`,
      `Period: ${exp.period}`,
      `Summary: ${exp.summary}`,
      `Technologies: ${exp.technologies.join(", ")}`,
      `Stats: ${exp.stats.map((s) => `${s.value} ${s.label}`).join(", ")}`,
      `Key Highlights:\n${exp.highlights.map((h) => `- ${h}`).join("\n")}`,
    ].join("\n"),
    url: `${SITE_URL}/resume`,
    tags: ["experience", "career", exp.company.toLowerCase()],
    category: "Experience",
  });
}

// Community & speaking
addChunk({
  source: "profile",
  title: `${profile.name} — Community & Speaking`,
  content: [
    "Community Roles:",
    ...profile.community.map((c) => `- ${c.role} at ${c.org}: ${c.description}`),
    "\nSpeaking Engagements:",
    ...profile.speaking.map((s) => `- ${s.title} at ${s.event} (${s.year}, ${s.type})`),
  ].join("\n"),
  url: `${SITE_URL}/events`,
  tags: ["community", "speaking", "leadership"],
  category: "Community",
});

// ──────────────────────────────────────────────
// 2. Projects
// ──────────────────────────────────────────────
console.log("[extract] Reading projects.json...");
const projects = readJson("projects.json");

for (const proj of projects) {
  addChunk({
    source: "project",
    title: proj.title,
    content: [
      `Project: ${proj.title}`,
      `Category: ${proj.category}`,
      `Year: ${proj.year}`,
      `Description: ${proj.description}`,
      `Outcomes: ${proj.outcomes.join("; ")}`,
      `Tech Stack: ${proj.techStack.join(", ")}`,
      proj.featured ? "Featured project" : "",
    ]
      .filter(Boolean)
      .join("\n"),
    url: `${SITE_URL}/projects`,
    tags: proj.tags,
    category: proj.category,
    date: `${proj.year}`,
  });
}

// ──────────────────────────────────────────────
// 3. Events
// ──────────────────────────────────────────────
console.log("[extract] Reading events.json...");
const events = readJson("events.json");

for (const evt of events) {
  const location = evt.location
    ? `${evt.location.city}, ${evt.location.country}`
    : "Virtual";
  addChunk({
    source: "event",
    title: evt.title,
    content: [
      `Event: ${evt.title}`,
      `Year: ${evt.year}`,
      `Format: ${evt.format}`,
      `Topic: ${evt.topic}`,
      `Location: ${location}`,
      evt.summary ? `Summary: ${evt.summary}` : "",
      evt.highlights?.length ? `Highlights: ${evt.highlights.join("; ")}` : "",
      evt.impact?.length ? `Impact: ${evt.impact.join("; ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    url: `${SITE_URL}/events/${evt.slug}`,
    tags: evt.tags || [],
    category: evt.format,
    date: `${evt.year}`,
  });
}

// ──────────────────────────────────────────────
// 4. Talks
// ──────────────────────────────────────────────
console.log("[extract] Reading talks.json...");
const talks = readJson("talks.json");

for (const talk of talks) {
  addChunk({
    source: "talk",
    title: talk.title,
    content: [
      `Talk: ${talk.title}`,
      `Topic: ${talk.topic}`,
      talk.description ? `Description: ${talk.description}` : "",
      `YouTube: https://www.youtube.com/watch?v=${talk.id}`,
      talk.featured ? "Featured talk" : "",
    ]
      .filter(Boolean)
      .join("\n"),
    url: `https://www.youtube.com/watch?v=${talk.id}`,
    tags: [talk.topic],
    category: "Talk",
  });
}

// ──────────────────────────────────────────────
// 5. Certifications (combined chunk)
// ──────────────────────────────────────────────
console.log("[extract] Reading certifications.json...");
const certs = readJson("certifications.json");

addChunk({
  source: "certification",
  title: `${profile.name} — Certifications`,
  content: certs
    .map((c) => `- ${c.name} (${c.code}) — ${c.issuer}, ${c.year}`)
    .join("\n"),
  url: `${SITE_URL}/resume`,
  tags: ["certifications", "credentials"],
  category: "Certification",
});

// ──────────────────────────────────────────────
// 6. Blog posts (chunked by headings)
// ──────────────────────────────────────────────
console.log("[extract] Reading blog posts...");
const blogDir = path.join(CONTENT_DIR, "blog");
if (fs.existsSync(blogDir)) {
  const blogFiles = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));
  for (const file of blogFiles) {
    const raw = readMdx("blog", file);
    const { meta, body } = parseFrontmatter(raw);
    if (meta.status === "draft") continue; // skip drafts

    const cleanBody = stripMdx(body);
    const slug = meta.slug || file.replace(".mdx", "");
    const sections = chunkByHeadings(cleanBody);

    for (let i = 0; i < sections.length; i++) {
      addChunk({
        source: "blog",
        title: `${meta.title || slug}${sections.length > 1 ? ` (Part ${i + 1})` : ""}`,
        content: [
          i === 0 ? `Blog Post: ${meta.title || slug}` : "",
          i === 0 && meta.description ? `Description: ${meta.description}` : "",
          i === 0 && meta.date ? `Published: ${meta.date}` : "",
          sections[i],
        ]
          .filter(Boolean)
          .join("\n"),
        url: `${SITE_URL}/blog/${slug}`,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        category: Array.isArray(meta.category) ? meta.category.join(", ") : meta.category || "Blog",
        date: meta.date || "",
      });
    }
  }
}

// ──────────────────────────────────────────────
// 7. Case studies (chunked by headings)
// ──────────────────────────────────────────────
console.log("[extract] Reading case studies...");
const caseDir = path.join(CONTENT_DIR, "case-studies");
if (fs.existsSync(caseDir)) {
  const caseFiles = fs.readdirSync(caseDir).filter((f) => f.endsWith(".mdx"));
  for (const file of caseFiles) {
    const raw = readMdx("case-studies", file);
    const { meta, body } = parseFrontmatter(raw);

    const cleanBody = stripMdx(body);
    const slug = meta.slug || file.replace(".mdx", "");
    const sections = chunkByHeadings(cleanBody);

    for (let i = 0; i < sections.length; i++) {
      addChunk({
        source: "case-study",
        title: `${meta.title || slug}${sections.length > 1 ? ` (Part ${i + 1})` : ""}`,
        content: [
          i === 0 ? `Case Study: ${meta.title || slug}` : "",
          i === 0 && meta.subtitle ? `Subtitle: ${meta.subtitle}` : "",
          i === 0 && meta.role ? `Role: ${meta.role}` : "",
          i === 0 && meta.client ? `Client: ${meta.client}` : "",
          i === 0 && meta.timeline ? `Timeline: ${meta.timeline}` : "",
          i === 0 && meta.metrics
            ? `Metrics: ${JSON.stringify(meta.metrics)}`
            : "",
          sections[i],
        ]
          .filter(Boolean)
          .join("\n"),
        url: `${SITE_URL}/case-studies/${slug}`,
        tags: Array.isArray(meta.tags) ? meta.tags : [],
        category: Array.isArray(meta.category) ? meta.category.join(", ") : meta.category || "Case Study",
        date: meta.timeline || "",
      });
    }
  }
}

// ──────────────────────────────────────────────
// Write output
// ──────────────────────────────────────────────
const jsonl = chunks.map((c) => JSON.stringify(c)).join("\n");
fs.writeFileSync(OUTPUT_FILE, jsonl, "utf-8");

console.log(`[extract] Done! ${chunks.length} chunks written to ${OUTPUT_FILE}`);
console.log(`[extract] Sources: ${[...new Set(chunks.map((c) => c.source))].join(", ")}`);
console.log(`[extract] File size: ${(Buffer.byteLength(jsonl) / 1024).toFixed(1)} KB`);
