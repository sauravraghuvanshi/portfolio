/**
 * build-portfolio-rag.mjs
 *
 * Automated RAG pipeline for the AI Writer:
 * 1. Reads all portfolio content (JSON + MDX)
 * 2. Converts to markdown documents
 * 3. Uploads to Foundry Files API
 * 4. Creates a vector store
 * 5. Updates the agent with file_search tool
 *
 * Usage:
 *   node scripts/build-portfolio-rag.mjs          # uses .env.local
 *   AZURE_OPENAI_API_KEY=... node scripts/build-portfolio-rag.mjs
 *
 * Required env vars:
 *   AZURE_FOUNDRY_PROJECT_ENDPOINT — Foundry project endpoint
 *   AZURE_OPENAI_API_KEY           — API key for the AI Services resource
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");

const API_VERSION = "2025-05-15-preview";

// ─── Load .env.local ───────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const PROJECT_ENDPOINT = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
const API_KEY = process.env.AZURE_OPENAI_API_KEY;

if (!PROJECT_ENDPOINT || !API_KEY) {
  console.error(
    "[rag] Missing env vars: AZURE_FOUNDRY_PROJECT_ENDPOINT, AZURE_OPENAI_API_KEY"
  );
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────
function readJson(relPath) {
  const raw = fs.readFileSync(path.join(CONTENT, relPath), "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

function readMdx(relPath) {
  const raw = fs.readFileSync(path.join(CONTENT, relPath), "utf-8").replace(/^\uFEFF/, "");
  // Parse frontmatter (between --- delimiters)
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, body: raw };
  const metaLines = fmMatch[1].split("\n");
  const meta = {};
  for (const line of metaLines) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) {
      let val = m[2].trim().replace(/^["']|["']$/g, "");
      // Handle simple arrays
      if (val.startsWith("[") && val.endsWith("]")) {
        try { val = JSON.parse(val); } catch { /* keep as string */ }
      }
      meta[m[1]] = val;
    }
  }
  return { meta, body: fmMatch[2] };
}

function apiUrl(subPath) {
  const base = PROJECT_ENDPOINT.replace(/\/$/, "");
  return `${base}/${subPath}?api-version=${API_VERSION}`;
}

async function apiFetch(subPath, options = {}) {
  const url = apiUrl(subPath);
  const res = await fetch(url, {
    ...options,
    headers: {
      "api-key": API_KEY,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} at ${subPath}: ${text}`);
  }
  return res.json();
}

// ─── Content Extraction ────────────────────────────────────────────
function extractProfile() {
  const p = readJson("profile.json");
  const lines = [
    `# Saurav Raghuvanshi — Profile & Experience`,
    `Content-Type: profile`,
    `Portfolio-URL: https://saurav-portfolio.azurewebsites.net`,
    ``,
    `## About`,
    `**${p.name}** — ${p.title} at ${p.company}`,
    `Location: ${p.location}`,
    `Tagline: "${p.tagline}"`,
    ``,
    p.summary,
    ``,
    p.aboutLong,
    ``,
    `## Mission`,
    p.missionStatement,
    ``,
    `## What I'm Known For`,
    ...(p.whatImKnownFor || []).map((w) => `- ${w}`),
    ``,
    `## Credibility Stats`,
    ...(p.credibilityStats || []).map((s) => `- ${s.value} ${s.label}`),
    ``,
    `## Skills`,
  ];

  for (const [cat, info] of Object.entries(p.skills || {})) {
    lines.push(`### ${cat}`, (info.items || []).join(", "), ``);
  }

  lines.push(`## Experience`);
  for (const exp of p.experience || []) {
    lines.push(
      `### ${exp.role} at ${exp.company} (${exp.period})`,
      exp.summary,
      `Technologies: ${(exp.technologies || []).join(", ")}`,
      ``
    );
    if (exp.stats?.length) {
      lines.push(...exp.stats.map((s) => `- ${s.value} ${s.label}`), ``);
    }
    if (exp.highlights?.length) {
      lines.push(...exp.highlights.map((h) => `- ${h}`), ``);
    }
  }

  if (p.testimonials?.length) {
    lines.push(`## Testimonials`);
    for (const t of p.testimonials) {
      lines.push(`> "${t.quote}" — ${t.author}, ${t.role} at ${t.company}`, ``);
    }
  }

  if (p.community?.length) {
    lines.push(`## Community Roles`);
    for (const c of p.community) {
      lines.push(`- **${c.role}** at ${c.org}: ${c.description}`);
    }
    lines.push(``);
  }

  if (p.speaking?.length) {
    lines.push(`## Speaking Engagements (from profile)`);
    for (const s of p.speaking) {
      lines.push(`- "${s.title}" at ${s.event} (${s.year}, ${s.type})`);
    }
    lines.push(``);
  }

  if (p.research?.length) {
    lines.push(`## Research`);
    for (const r of p.research) {
      lines.push(`- "${r.title}" — ${r.publisher}, ${r.year}`);
    }
  }

  return { name: "profile-and-experience.md", content: lines.join("\n") };
}

function extractProjects() {
  const projects = readJson("projects.json");
  const lines = [
    `# Saurav Raghuvanshi — Projects`,
    `Content-Type: projects`,
    `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/projects`,
    ``,
  ];

  for (const p of projects) {
    lines.push(
      `## ${p.title}`,
      p.description,
      ``,
      `Category: ${p.category} | Year: ${p.year} | Featured: ${p.featured}`,
      `Tech Stack: ${(p.techStack || []).join(", ")}`,
      `Tags: ${(p.tags || []).join(", ")}`,
      ``
    );
    if (p.outcomes?.length) {
      lines.push(`### Outcomes`, ...p.outcomes.map((o) => `- ${o}`), ``);
    }
  }

  return { name: "projects.md", content: lines.join("\n") };
}

function extractEvents() {
  const events = readJson("events.json");
  const lines = [
    `# Saurav Raghuvanshi — Speaking Events & Community`,
    `Content-Type: events`,
    `Total Events: ${events.length}`,
    `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/events`,
    ``,
  ];

  for (const e of events) {
    const loc = e.location
      ? `${e.location.city}, ${e.location.country}`
      : "Virtual";
    lines.push(
      `## ${e.title} (${e.year})`,
      `Format: ${e.format} | Topic: ${e.topic} | Location: ${loc}`,
      `Tags: ${(e.tags || []).join(", ")}`,
      ``,
      e.summary || "",
      ``
    );
    if (e.highlights?.length) {
      lines.push(`### Highlights`, ...e.highlights.map((h) => `- ${h}`), ``);
    }
    if (e.impact?.length) {
      lines.push(`### Impact`, ...e.impact.map((i) => `- ${i}`), ``);
    }
  }

  return { name: "events-and-speaking.md", content: lines.join("\n") };
}

function extractTalks() {
  const talks = readJson("talks.json");
  const lines = [
    `# Saurav Raghuvanshi — YouTube Talks`,
    `Content-Type: talks`,
    `Total Talks: ${talks.length}`,
    `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/talks`,
    ``,
  ];

  for (const t of talks) {
    lines.push(
      `## ${t.title}`,
      `Topic: ${t.topic} | Featured: ${t.featured}`,
      `YouTube: https://www.youtube.com/watch?v=${t.id}`,
      t.description ? `Description: ${t.description}` : "",
      ``
    );
  }

  return { name: "talks.md", content: lines.join("\n") };
}

function extractCertifications() {
  const certs = readJson("certifications.json");
  const lines = [
    `# Saurav Raghuvanshi — Certifications`,
    `Content-Type: certifications`,
    `Total Certifications: ${certs.length}`,
    ``,
  ];

  for (const c of certs) {
    lines.push(`- **${c.name}** (${c.code}) — ${c.issuer}, ${c.year}`);
  }

  return { name: "certifications.md", content: lines.join("\n") };
}

function extractBlogPosts() {
  const blogDir = path.join(CONTENT, "blog");
  if (!fs.existsSync(blogDir)) return [];

  const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const { meta, body } = readMdx(path.join("blog", file));
    const slug = file.replace(/\.mdx$/, "");
    const header = [
      `# ${meta.title || slug}`,
      `Content-Type: blog-post`,
      `Slug: ${slug}`,
      meta.date ? `Date: ${meta.date}` : "",
      meta.category ? `Category: ${meta.category}` : "",
      meta.tags ? `Tags: ${Array.isArray(meta.tags) ? meta.tags.join(", ") : meta.tags}` : "",
      meta.description ? `Description: ${meta.description}` : "",
      `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/blog/${slug}`,
      ``,
    ]
      .filter(Boolean)
      .join("\n");

    return { name: `blog-${slug}.md`, content: `${header}\n${body}` };
  });
}

function extractCaseStudies() {
  const csDir = path.join(CONTENT, "case-studies");
  if (!fs.existsSync(csDir)) return [];

  const files = fs.readdirSync(csDir).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const { meta, body } = readMdx(path.join("case-studies", file));
    const slug = file.replace(/\.mdx$/, "");
    const header = [
      `# ${meta.title || slug}`,
      `Content-Type: case-study`,
      `Slug: ${slug}`,
      meta.subtitle ? `Subtitle: ${meta.subtitle}` : "",
      meta.client ? `Client: ${meta.client}` : "",
      meta.role ? `Role: ${meta.role}` : "",
      meta.timeline ? `Timeline: ${meta.timeline}` : "",
      meta.tags ? `Tags: ${Array.isArray(meta.tags) ? meta.tags.join(", ") : meta.tags}` : "",
      `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/case-studies/${slug}`,
      ``,
    ]
      .filter(Boolean)
      .join("\n");

    return { name: `case-study-${slug}.md`, content: `${header}\n${body}` };
  });
}

// ─── Upload & Index ────────────────────────────────────────────────
async function uploadFile(name, content) {
  const url = apiUrl("openai/files");
  const blob = new Blob([content], { type: "text/markdown" });
  const form = new FormData();
  form.append("file", blob, name);
  form.append("purpose", "assistants");

  const res = await fetch(url, {
    method: "POST",
    headers: { "api-key": API_KEY },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed for ${name}: ${res.status} — ${text}`);
  }

  return res.json();
}

async function createVectorStore(name, fileIds) {
  return apiFetch("openai/vector_stores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, file_ids: fileIds }),
  });
}

async function pollVectorStore(vsId, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const vs = await apiFetch(`openai/vector_stores/${vsId}`);
    if (vs.status === "completed") return vs;
    if (vs.status === "failed" || vs.status === "cancelled") {
      throw new Error(`Vector store ${vsId} ${vs.status}`);
    }
    console.log(`[rag]   Vector store status: ${vs.status} — waiting...`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Vector store polling timed out after ${timeoutMs}ms`);
}

async function listAssistants() {
  return apiFetch("openai/assistants");
}

async function updateAssistant(assistantId, patch) {
  return apiFetch(`openai/assistants/${assistantId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// ─── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log("[rag] Starting portfolio RAG data pipeline...");
  console.log(`[rag] Project endpoint: ${PROJECT_ENDPOINT}`);

  // Step 1: Extract content
  console.log("[rag] Step 1: Extracting portfolio content into markdown...");
  const docs = [
    extractProfile(),
    extractProjects(),
    extractEvents(),
    extractTalks(),
    extractCertifications(),
    ...extractBlogPosts(),
    ...extractCaseStudies(),
  ];

  console.log(`[rag]   Generated ${docs.length} documents:`);
  for (const d of docs) {
    console.log(`[rag]     - ${d.name} (${(d.content.length / 1024).toFixed(1)} KB)`);
  }

  // Step 2: Upload files
  console.log("[rag] Step 2: Uploading files to Foundry...");
  const fileIds = [];
  for (const doc of docs) {
    try {
      const result = await uploadFile(doc.name, doc.content);
      fileIds.push(result.id);
      console.log(`[rag]   ✓ ${doc.name} → ${result.id}`);
    } catch (err) {
      console.error(`[rag]   ✗ ${doc.name}: ${err.message}`);
    }
  }

  if (fileIds.length === 0) {
    console.error("[rag] No files uploaded. Aborting.");
    process.exit(1);
  }

  // Step 3: Create vector store
  console.log("[rag] Step 3: Creating vector store...");
  const vs = await createVectorStore("portfolio-content", fileIds);
  console.log(`[rag]   Vector store ID: ${vs.id}, status: ${vs.status}`);

  // Step 4: Poll until ready
  console.log("[rag] Step 4: Waiting for vector store indexing...");
  const readyVs = await pollVectorStore(vs.id);
  console.log(
    `[rag]   ✓ Vector store ready — ${readyVs.file_counts?.completed ?? "?"} files indexed`
  );

  // Step 5: Find and update agent
  console.log("[rag] Step 5: Updating agent with file_search tool...");
  const agentName = process.env.AZURE_FOUNDRY_AGENT_NAME || "saurav-portfolio-ai-project-agent";

  try {
    const assistants = await listAssistants();
    const agentList = assistants.data || assistants;
    const agent = agentList.find(
      (a) => a.name === agentName || a.id === agentName
    );

    if (!agent) {
      console.log(`[rag]   Agent "${agentName}" not found in assistants list.`);
      console.log(`[rag]   Vector store ID for manual configuration: ${vs.id}`);
      console.log(`[rag]   Add file_search tool with this vector store in the Foundry portal.`);
    } else {
      const existingTools = (agent.tools || []).filter(
        (t) => t.type !== "file_search"
      );
      await updateAssistant(agent.id, {
        tools: [...existingTools, { type: "file_search" }],
        tool_resources: {
          file_search: { vector_store_ids: [vs.id] },
        },
      });
      console.log(`[rag]   ✓ Agent "${agentName}" updated with file_search tool`);
    }
  } catch (err) {
    console.log(`[rag]   Could not update agent via API: ${err.message}`);
    console.log(`[rag]   Vector store ID for manual configuration: ${vs.id}`);
  }

  // Summary
  console.log(`\n[rag] ✅ Pipeline complete!`);
  console.log(`[rag]   Documents uploaded: ${fileIds.length}`);
  console.log(`[rag]   Vector store ID: ${vs.id}`);
  console.log(`[rag]   Vector store status: ${readyVs.status}`);
}

main().catch((err) => {
  console.error("[rag] Fatal error:", err);
  process.exit(1);
});
