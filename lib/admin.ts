import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPostMeta } from "./content";

const contentDir = path.join(process.cwd(), "content");
const blogDir = path.join(contentDir, "blog");
const imageDir = path.join(process.cwd(), "public", "blog", "images");

function ensureDirs() {
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
  if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });
}

export function saveBlogPost(meta: BlogPostMeta, content: string): void {
  ensureDirs();
  // Remove undefined values so gray-matter doesn't serialize them as "undefined"
  const cleanMeta: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value !== undefined) {
      cleanMeta[key] = value;
    }
  }
  const frontmatter = matter.stringify(content, cleanMeta);
  fs.writeFileSync(path.join(blogDir, `${meta.slug}.mdx`), frontmatter, "utf-8");
}

export function deleteBlogPost(slug: string): boolean {
  const filePath = path.join(blogDir, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function saveImage(filename: string, buffer: Buffer): string {
  ensureDirs();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  const finalName = `${Date.now()}-${safe}`;
  fs.writeFileSync(path.join(imageDir, finalName), buffer);
  return `/blog/images/${finalName}`;
}
