import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPostMeta } from "./content";
import { uploadToBlob } from "./azure-storage";

const contentDir = path.join(process.cwd(), "content");
const blogDir = path.join(contentDir, "blog");

function ensureDirs() {
  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
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
