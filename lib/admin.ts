import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPostMeta, CaseStudyMeta, Project } from "./content";
import { uploadToBlob } from "./azure-storage";

const contentDir = path.join(process.cwd(), "content");
const blogDir = path.join(contentDir, "blog");
const caseStudiesDir = path.join(contentDir, "case-studies");
const projectsFile = path.join(contentDir, "projects.json");

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
  slug?: string
): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const finalName = `${Date.now()}-${safe}`;
  const folder = slug || "_uploads";
  const blobPath = `${folder}/${finalName}`;
  const ext = "." + (safe.split(".").pop()?.toLowerCase() || "png");
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return uploadToBlob(blobPath, buffer, contentType);
}
