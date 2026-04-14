import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";

const contentDir = path.join(process.cwd(), "content");

export function normalizeCategory(cat: unknown): string[] {
  if (Array.isArray(cat)) return cat.filter((c): c is string => typeof c === "string");
  if (typeof cat === "string" && cat.trim()) return [cat.trim()];
  return [];
}

export interface CaseStudyMeta {
  title: string;
  subtitle: string;
  slug: string;
  tags: string[];
  category: string[];
  timeline: string;
  role: string;
  client: string;
  featured: boolean;
  coverImage: string;
  metrics: { value: string; label: string }[];
}

export interface CaseStudy extends CaseStudyMeta {
  content: string;
}

export function getCaseStudySlugs(): string[] {
  const caseStudiesDir = path.join(contentDir, "case-studies");
  if (!fs.existsSync(caseStudiesDir)) return [];
  return fs
    .readdirSync(caseStudiesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(".mdx", ""));
}

export function getCaseStudy(slug: string): CaseStudy | null {
  const filePath = path.join(contentDir, "case-studies", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { ...(data as CaseStudyMeta), category: normalizeCategory(data.category), content };
}

export const getAllCaseStudies = cache(function getAllCaseStudies(): CaseStudy[] {
  const slugs = getCaseStudySlugs();
  return slugs
    .map((slug) => getCaseStudy(slug))
    .filter((cs): cs is CaseStudy => cs !== null)
    .sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
});

export function getFeaturedCaseStudies(): CaseStudy[] {
  return getAllCaseStudies().filter((cs) => cs.featured);
}

export const getProfile = cache(function getProfile() {
  const filePath = path.join(contentDir, "profile.json");
  if (!fs.existsSync(filePath)) return { name: "", title: "", summary: "", social: {}, skills: [], experience: [] };
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
});

export interface Project {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  tags: string[];
  category: string[];
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  year: number;
}

export const getProjects = cache(function getProjects(): Project[] {
  const filePath = path.join(contentDir, "projects.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return (JSON.parse(raw) as Project[]).map((p) => ({
    ...p,
    category: normalizeCategory(p.category),
  }));
});

export function getFeaturedProjects(): Project[] {
  return getProjects().filter((p) => p.featured);
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

export interface Certification {
  code: string;
  name: string;
  issuer: string;
  year: number;
  verifyUrl: string;
  badge: string;
  color: string;
}

export const getCertifications = cache(function getCertifications(): Certification[] {
  const filePath = path.join(contentDir, "certifications.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Certification[];
});

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export interface EventLocation {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export interface EventMeta {
  slug: string;
  title: string;
  year: number;
  format: string;
  topic: string;
  tags: string[];
  summary: string;
  highlights: string[];
  impact: string[];
  coverImage: string | null;
  coverImagePosition?: "top" | "center" | "bottom";
  images: string[];
  featured?: boolean;
  location?: EventLocation | null;
}

export type Event = EventMeta;

export interface CityCluster {
  city: string;
  country: string;
  lat: number;
  lng: number;
  events: Event[];
}

export function getEventClusters(events: Event[]): CityCluster[] {
  const map = new Map<string, CityCluster>();
  for (const e of events) {
    if (!e.location) continue;
    const key = `${e.location.city}|${e.location.country}`;
    if (!map.has(key)) {
      map.set(key, {
        city: e.location.city,
        country: e.location.country,
        lat: e.location.lat,
        lng: e.location.lng,
        events: [],
      });
    }
    map.get(key)!.events.push(e);
  }
  return Array.from(map.values());
}

export const getEvents = cache(function getEvents(): Event[] {
  const filePath = path.join(contentDir, "events.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Event[];
});

export function getEvent(slug: string): Event | null {
  return getEvents().find((e) => e.slug === slug) ?? null;
}

// ---------------------------------------------------------------------------
// Talks
// ---------------------------------------------------------------------------

export interface Talk {
  id: string;
  title: string;
  topic: string;
  description?: string;
  featured: boolean;
}

export const getTalks = cache(function getTalks(): Talk[] {
  const filePath = path.join(contentDir, "talks.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Talk[];
});

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogPostMeta {
  title: string;
  slug: string;
  description: string;
  date: string;
  updated?: string;
  category: string[];
  tags: string[];
  coverImage?: string;
  featured: boolean;
  status: "published" | "draft";
  readingTime?: string;
  externalUrl?: string;
  externalSource?: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

function computeReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

export function getBlogSlugs(): string[] {
  const blogDir = path.join(contentDir, "blog");
  if (!fs.existsSync(blogDir)) return [];
  return fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(".mdx", ""));
}

export function getBlogPost(slug: string): BlogPost | null {
  const filePath = path.join(contentDir, "blog", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const { data, content } = matter(raw);
  const meta = data as BlogPostMeta;
  meta.category = normalizeCategory(meta.category);
  if (!meta.readingTime) {
    meta.readingTime = computeReadingTime(content);
  }
  return { ...meta, content };
}

export const getAllBlogPosts = cache(function getAllBlogPosts(includeDrafts = false): BlogPost[] {
  const slugs = getBlogSlugs();
  return slugs
    .map((slug) => getBlogPost(slug))
    .filter((post): post is BlogPost => {
      if (!post) return false;
      if (!includeDrafts && post.status === "draft") return false;
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      return diff !== 0 ? diff : a.slug.localeCompare(b.slug);
    });
});

export function getFeaturedBlogPosts(): BlogPost[] {
  return getAllBlogPosts().filter((post) => post.featured).slice(0, 3);
}
