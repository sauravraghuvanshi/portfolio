/**
 * RAG Pipeline — Extract, cleanup, upload, index
 *
 * Reusable module that can be called from:
 *   - API route (POST /api/admin/reindex)
 *   - Standalone script (scripts/build-portfolio-rag.mjs)
 */

import {
  getProfile,
  getProjects,
  getEvents,
  getTalks,
  getCertifications,
  getAllBlogPosts,
  getAllCaseStudies,
} from "@/lib/content";

const API_VERSION = "2025-05-15-preview";
const VECTOR_STORE_NAME = "portfolio-content";

const isDev = process.env.NODE_ENV === "development";
const log = isDev ? console.log : () => {};

interface RagDocument {
  name: string;
  content: string;
}

export interface PipelineResult {
  status: "success" | "error";
  vectorStoreId?: string;
  documentsCount?: number;
  error?: string;
}

// ─── Foundry API helpers ──────────────────────────────────────────

function apiUrl(endpoint: string, subPath: string): string {
  return `${endpoint.replace(/\/$/, "")}/${subPath}?api-version=${API_VERSION}`;
}

async function apiFetch(
  endpoint: string,
  apiKey: string,
  subPath: string,
  options: RequestInit = {}
) {
  const url = apiUrl(endpoint, subPath);
  const res = await fetch(url, {
    ...options,
    headers: { "api-key": apiKey, ...options.headers },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status} at ${subPath}: ${text}`);
  }
  return res.json();
}

async function uploadFile(
  endpoint: string,
  apiKey: string,
  name: string,
  content: string
) {
  const url = apiUrl(endpoint, "openai/files");
  const blob = new Blob([content], { type: "text/markdown" });
  const form = new FormData();
  form.append("file", blob, name);
  form.append("purpose", "assistants");

  const res = await fetch(url, {
    method: "POST",
    headers: { "api-key": apiKey },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload ${name}: ${res.status} — ${text}`);
  }
  return res.json();
}

async function deleteResource(
  endpoint: string,
  apiKey: string,
  subPath: string
) {
  const url = apiUrl(endpoint, subPath);
  const res = await fetch(url, {
    method: "DELETE",
    headers: { "api-key": apiKey },
  });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`Delete ${subPath}: ${res.status} — ${text}`);
  }
}

async function pollVectorStore(
  endpoint: string,
  apiKey: string,
  vsId: string,
  timeoutMs = 120_000
) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const vs = await apiFetch(endpoint, apiKey, `openai/vector_stores/${vsId}`);
    if (vs.status === "completed") return vs;
    if (vs.status === "failed" || vs.status === "cancelled") {
      throw new Error(`Vector store ${vsId} ${vs.status}`);
    }
    log(`[reindex] Vector store status: ${vs.status} — waiting...`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Vector store polling timed out after ${timeoutMs}ms`);
}

// ─── Content extraction ───────────────────────────────────────────

function extractProfile(): RagDocument {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = getProfile() as any;
  const lines: string[] = [
    `# Saurav Raghuvanshi — Profile & Experience`,
    `Content-Type: profile`,
    `Portfolio-URL: https://saurav-portfolio.azurewebsites.net`,
    ``,
    `## About`,
    `**${p.name}** — ${p.title} at ${p.company}`,
    `Location: ${p.location}`,
    `Tagline: "${p.tagline}"`,
    ``,
    p.summary || "",
    ``,
    p.aboutLong || "",
    ``,
    `## Mission`,
    p.missionStatement || "",
    ``,
    `## What I'm Known For`,
    ...(p.whatImKnownFor || []).map((w: string) => `- ${w}`),
    ``,
    `## Credibility Stats`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(p.credibilityStats || []).map((s: any) => `- ${s.value} ${s.label}`),
    ``,
    `## Skills`,
  ];

  for (const [cat, info] of Object.entries(p.skills || {})) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines.push(`### ${cat}`, ((info as any).items || []).join(", "), ``);
  }

  lines.push(`## Experience`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const exp of (p.experience || []) as any[]) {
    lines.push(
      `### ${exp.role} at ${exp.company} (${exp.period})`,
      exp.summary,
      `Technologies: ${(exp.technologies || []).join(", ")}`,
      ``
    );
    if (exp.stats?.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lines.push(...exp.stats.map((s: any) => `- ${s.value} ${s.label}`), ``);
    }
    if (exp.highlights?.length) {
      lines.push(...exp.highlights.map((h: string) => `- ${h}`), ``);
    }
  }

  if (p.testimonials?.length) {
    lines.push(`## Testimonials`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const t of p.testimonials as any[]) {
      lines.push(
        `> "${t.quote}" — ${t.author}, ${t.role} at ${t.company}`,
        ``
      );
    }
  }

  if (p.community?.length) {
    lines.push(`## Community Roles`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const c of p.community as any[]) {
      lines.push(`- **${c.role}** at ${c.org}: ${c.description}`);
    }
    lines.push(``);
  }

  if (p.speaking?.length) {
    lines.push(`## Speaking Engagements (from profile)`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const s of p.speaking as any[]) {
      lines.push(`- "${s.title}" at ${s.event} (${s.year}, ${s.type})`);
    }
    lines.push(``);
  }

  if (p.research?.length) {
    lines.push(`## Research`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of p.research as any[]) {
      lines.push(`- "${r.title}" — ${r.publisher}, ${r.year}`);
    }
  }

  return { name: "profile-and-experience.md", content: lines.join("\n") };
}

function extractProjectsDocs(): RagDocument {
  const projects = getProjects();
  const lines: string[] = [
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

function extractEventsDocs(): RagDocument {
  const events = getEvents();
  const lines: string[] = [
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
      lines.push(
        `### Highlights`,
        ...e.highlights.map((h) => `- ${h}`),
        ``
      );
    }
    if (e.impact?.length) {
      lines.push(`### Impact`, ...e.impact.map((i) => `- ${i}`), ``);
    }
  }

  return { name: "events-and-speaking.md", content: lines.join("\n") };
}

function extractTalksDocs(): RagDocument {
  const talks = getTalks();
  const lines: string[] = [
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

function extractCertificationsDocs(): RagDocument {
  const certs = getCertifications();
  const lines: string[] = [
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

function extractBlogPostsDocs(): RagDocument[] {
  const posts = getAllBlogPosts(true);
  return posts.map((post) => {
    const header = [
      `# ${post.title}`,
      `Content-Type: blog-post`,
      `Slug: ${post.slug}`,
      post.date ? `Date: ${post.date}` : "",
      post.category?.length ? `Category: ${post.category.join(", ")}` : "",
      post.tags?.length ? `Tags: ${post.tags.join(", ")}` : "",
      post.description ? `Description: ${post.description}` : "",
      `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/blog/${post.slug}`,
      ``,
    ]
      .filter(Boolean)
      .join("\n");

    return { name: `blog-${post.slug}.md`, content: `${header}\n${post.content}` };
  });
}

function extractCaseStudiesDocs(): RagDocument[] {
  const studies = getAllCaseStudies();
  return studies.map((cs) => {
    const header = [
      `# ${cs.title}`,
      `Content-Type: case-study`,
      `Slug: ${cs.slug}`,
      cs.subtitle ? `Subtitle: ${cs.subtitle}` : "",
      cs.client ? `Client: ${cs.client}` : "",
      cs.role ? `Role: ${cs.role}` : "",
      cs.timeline ? `Timeline: ${cs.timeline}` : "",
      cs.tags?.length ? `Tags: ${cs.tags.join(", ")}` : "",
      `Portfolio-URL: https://saurav-portfolio.azurewebsites.net/case-studies/${cs.slug}`,
      ``,
    ]
      .filter(Boolean)
      .join("\n");

    return { name: `case-study-${cs.slug}.md`, content: `${header}\n${cs.content}` };
  });
}

// ─── Main pipeline ────────────────────────────────────────────────

export async function runRagPipeline(): Promise<PipelineResult> {
  const projectEndpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;

  if (!projectEndpoint || !apiKey) {
    return {
      status: "error",
      error: "Missing AZURE_FOUNDRY_PROJECT_ENDPOINT or AZURE_OPENAI_API_KEY",
    };
  }

  const ep = projectEndpoint;

  // Step 1: Extract content
  log("[reindex] Extracting portfolio content...");
  const docs: RagDocument[] = [
    extractProfile(),
    extractProjectsDocs(),
    extractEventsDocs(),
    extractTalksDocs(),
    extractCertificationsDocs(),
    ...extractBlogPostsDocs(),
    ...extractCaseStudiesDocs(),
  ];
  log(`[reindex] Generated ${docs.length} documents`);

  // Step 2: Snapshot old resources for cleanup AFTER agent is updated
  let oldStoreIds: string[] = [];
  let oldFileIds: string[] = [];
  try {
    const stores = await apiFetch(ep, apiKey, "openai/vector_stores");
    const storeList = stores.data || stores;
    oldStoreIds = (Array.isArray(storeList) ? storeList : [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((s: any) => s.name === VECTOR_STORE_NAME)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((s: any) => s.id);

    const files = await apiFetch(ep, apiKey, "openai/files");
    const fileList = files.data || files;
    oldFileIds = (Array.isArray(fileList) ? fileList : [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((f: any) => f.purpose === "assistants")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((f: any) => f.id);
    log(
      `[reindex] Found ${oldStoreIds.length} old stores, ${oldFileIds.length} old files to cleanup later`
    );
  } catch (err) {
    log(
      `[reindex] Could not list old resources: ${err instanceof Error ? err.message : err}`
    );
  }

  // Step 3: Upload new files
  log("[reindex] Uploading files...");
  const fileIds: string[] = [];
  for (const doc of docs) {
    try {
      const result = await uploadFile(ep, apiKey, doc.name, doc.content);
      fileIds.push(result.id);
    } catch (err) {
      console.error(
        `[reindex]   Upload failed ${doc.name}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  if (fileIds.length === 0) {
    return { status: "error", error: "No files uploaded" };
  }
  log(`[reindex] Uploaded ${fileIds.length} files`);

  // Step 4: Create new vector store
  log("[reindex] Creating vector store...");
  const vs = await apiFetch(ep, apiKey, "openai/vector_stores", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: VECTOR_STORE_NAME, file_ids: fileIds }),
  });

  // Step 5: Poll until ready
  log(`[reindex] Polling vector store ${vs.id}...`);
  const readyVs = await pollVectorStore(ep, apiKey, vs.id);
  log(
    `[reindex] Vector store ready — ${readyVs.file_counts?.completed ?? "?"} files indexed`
  );

  // Step 6: Update agent to point to NEW vector store
  const agentName =
    process.env.AZURE_FOUNDRY_AGENT_NAME ||
    "saurav-portfolio-ai-project-agent";

  try {
    const agent = await apiFetch(ep, apiKey, `agents/${agentName}`);
    const existingTools = (
      agent.versions?.latest?.definition?.tools || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ).filter((t: any) => t.type !== "file_search");

    const agentDef = agent.versions?.latest?.definition || {};
    await apiFetch(ep, apiKey, `agents/${agentName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        definition: {
          kind: agentDef.kind || "prompt",
          model: agentDef.model || "gpt-4o",
          tools: [
            ...existingTools,
            { type: "file_search", vector_store_ids: [vs.id] },
          ],
        },
      }),
    });
    log(`[reindex] Agent updated with vector store ${vs.id}`);
  } catch (err) {
    log(
      `[reindex] Agent update failed (update manually): ${err instanceof Error ? err.message : err}`
    );
    log(`[reindex] Vector store ID: ${vs.id}`);
  }

  // Step 7: Cleanup old vector stores and files (safe — agent already points to new one)
  log("[reindex] Cleaning up old resources...");
  for (const id of oldStoreIds) {
    try {
      await deleteResource(ep, apiKey, `openai/vector_stores/${id}`);
      log(`[reindex]   Deleted old vector store: ${id}`);
    } catch {
      /* ignore cleanup errors */
    }
  }
  // Don't delete new files — only delete files NOT in the new set
  const newFileSet = new Set(fileIds);
  for (const id of oldFileIds) {
    if (newFileSet.has(id)) continue;
    try {
      await deleteResource(ep, apiKey, `openai/files/${id}`);
    } catch {
      /* ignore cleanup errors */
    }
  }
  log(
    `[reindex] Cleaned ${oldStoreIds.length} old stores, ${oldFileIds.filter((id) => !newFileSet.has(id)).length} old files`
  );

  log(`[reindex] Pipeline complete!`);
  return {
    status: "success",
    vectorStoreId: vs.id,
    documentsCount: fileIds.length,
  };
}
