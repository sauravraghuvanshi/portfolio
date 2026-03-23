import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPostMeta, CaseStudyMeta, Project, Talk, EventMeta, Certification } from "./content";
import { uploadToBlob } from "./azure-storage";

const contentDir = path.join(process.cwd(), "content");
const blogDir = path.join(contentDir, "blog");
const caseStudiesDir = path.join(contentDir, "case-studies");
const projectsFile = path.join(contentDir, "projects.json");
const talksFile = path.join(contentDir, "talks.json");
const eventsFile = path.join(contentDir, "events.json");
const eventsOverridesFile = path.join(contentDir, "events-overrides.json");
const certificationsFile = path.join(contentDir, "certifications.json");

function ensureDirs() {
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
}

function ensureCaseStudiesDir() {
  if (!fs.existsSync(caseStudiesDir)) fs.mkdirSync(caseStudiesDir, { recursive: true });
}

function cleanUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
}

// --- Blog ---

export function saveBlogPost(meta: BlogPostMeta, content: string): void {
  ensureDirs();
  const frontmatter = matter.stringify(content, cleanUndefined(meta as unknown as Record<string, unknown>));
  fs.writeFileSync(path.join(blogDir, `${meta.slug}.mdx`), frontmatter, "utf-8");
}

export function deleteBlogPost(slug: string): boolean {
  const filePath = path.join(blogDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// --- Case Studies ---

export function saveCaseStudy(meta: CaseStudyMeta, content: string): void {
  ensureCaseStudiesDir();
  const frontmatter = matter.stringify(content, cleanUndefined(meta as unknown as Record<string, unknown>));
  fs.writeFileSync(path.join(caseStudiesDir, `${meta.slug}.mdx`), frontmatter, "utf-8");
}

export function deleteCaseStudy(slug: string): boolean {
  const filePath = path.join(caseStudiesDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

// --- Projects ---

function readProjects(): Project[] {
  if (!fs.existsSync(projectsFile)) return [];
  const raw = fs.readFileSync(projectsFile, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Project[];
}

function writeProjects(projects: Project[]): void {
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2), "utf-8");
}

export function saveProject(project: Project): void {
  const projects = readProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    projects[idx] = project;
  } else {
    projects.push(project);
  }
  writeProjects(projects);
}

export function deleteProject(id: string): boolean {
  const projects = readProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  writeProjects(filtered);
  return true;
}

// --- Talks ---

function readTalks(): Talk[] {
  if (!fs.existsSync(talksFile)) return [];
  const raw = fs.readFileSync(talksFile, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Talk[];
}

function writeTalks(talks: Talk[]): void {
  fs.writeFileSync(talksFile, JSON.stringify(talks, null, 2), "utf-8");
}

export function saveTalk(talk: Talk): void {
  const talks = readTalks();
  const idx = talks.findIndex((t) => t.id === talk.id);
  if (idx >= 0) {
    talks[idx] = talk;
  } else {
    talks.push(talk);
  }
  writeTalks(talks);
}

export function deleteTalk(id: string): boolean {
  const talks = readTalks();
  const filtered = talks.filter((t) => t.id !== id);
  if (filtered.length === talks.length) return false;
  writeTalks(filtered);
  return true;
}

// --- Events ---

function readEvents(): EventMeta[] {
  if (!fs.existsSync(eventsFile)) return [];
  const raw = fs.readFileSync(eventsFile, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as EventMeta[];
}

function writeEvents(events: EventMeta[]): void {
  fs.writeFileSync(eventsFile, JSON.stringify(events, null, 2), "utf-8");
}

function readOverrides(): Record<string, Partial<EventMeta>> {
  if (!fs.existsSync(eventsOverridesFile)) return {};
  const raw = fs.readFileSync(eventsOverridesFile, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Record<string, Partial<EventMeta>>;
}

function writeOverrides(overrides: Record<string, Partial<EventMeta>>): void {
  fs.writeFileSync(eventsOverridesFile, JSON.stringify(overrides, null, 2), "utf-8");
}

export function saveEvent(event: EventMeta): void {
  // Update events.json for immediate effect
  const events = readEvents();
  const idx = events.findIndex((e) => e.slug === event.slug);
  if (idx >= 0) {
    events[idx] = event;
  } else {
    events.push(event);
  }
  writeEvents(events);

  // Also persist in overrides so changes survive DOCX regeneration
  const overrides = readOverrides();
  const { slug, ...rest } = event;
  overrides[slug] = rest;
  writeOverrides(overrides);
}

export function deleteEvent(slug: string): boolean {
  // Remove from events.json
  const events = readEvents();
  const filtered = events.filter((e) => e.slug !== slug);
  if (filtered.length === events.length) return false;
  writeEvents(filtered);

  // Remove from overrides
  const overrides = readOverrides();
  delete overrides[slug];
  writeOverrides(overrides);

  return true;
}

// --- Certifications ---

function readCertifications(): Certification[] {
  if (!fs.existsSync(certificationsFile)) return [];
  const raw = fs.readFileSync(certificationsFile, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Certification[];
}

function writeCertifications(certs: Certification[]): void {
  fs.writeFileSync(certificationsFile, JSON.stringify(certs, null, 2), "utf-8");
}

export function saveCertification(cert: Certification): void {
  const certs = readCertifications();
  const idx = certs.findIndex((c) => c.code === cert.code);
  if (idx >= 0) {
    certs[idx] = cert;
  } else {
    certs.push(cert);
  }
  writeCertifications(certs);
}

export function deleteCertification(code: string): boolean {
  const certs = readCertifications();
  const filtered = certs.filter((c) => c.code !== code);
  if (filtered.length === certs.length) return false;
  writeCertifications(filtered);
  return true;
}

// --- Image Upload ---

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export async function saveImage(
  filename: string,
  buffer: Buffer,
  folder?: string,
  slug?: string
): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const finalName = `${Date.now()}-${safe}`;
  const parts = [folder, slug].filter(Boolean);
  const dir = parts.length > 0 ? parts.join("/") : "_uploads";
  const blobPath = `${dir}/${finalName}`;
  const ext = "." + (safe.split(".").pop()?.toLowerCase() || "png");
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return uploadToBlob(blobPath, buffer, contentType);
}
