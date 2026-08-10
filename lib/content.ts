import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cache } from "react";
import { contentDir } from "./content-dir";
import { ensureContentSynced } from "./content-sync-once";

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
  status: "published" | "draft";
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
  return { ...(data as CaseStudyMeta), category: normalizeCategory(data.category), status: (data.status as "published" | "draft") ?? "published", content };
}

export const getAllCaseStudies = cache(function getAllCaseStudies(includeDrafts = false): CaseStudy[] {
  const slugs = getCaseStudySlugs();
  const all = slugs
    .map((slug) => getCaseStudy(slug))
    .filter((cs): cs is CaseStudy => {
      if (!cs) return false;
      if (!includeDrafts && cs.status === "draft") return false;
      return true;
    });
  // Newest-first within each featured tier: reverse the natural order so the most
  // recently added file (admin appends) surfaces at the top, then keep featured ahead.
  const indexed = all.map((cs, i) => ({ cs, i }));
  indexed.sort((a, b) => {
    if (a.cs.featured !== b.cs.featured) return a.cs.featured ? -1 : 1;
    return b.i - a.i;
  });
  return indexed.map(({ cs }) => cs);
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
  status: "published" | "draft";
  year: number;
}

export const getProjects = cache(function getProjects(includeDrafts = false): Project[] {
  const filePath = path.join(contentDir, "projects.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const all = (JSON.parse(raw) as Project[])
    .map((p) => ({
      ...p,
      category: normalizeCategory(p.category),
      status: p.status ?? "published" as const,
    }))
    .filter((p) => includeDrafts || p.status !== "draft");
  // Newest-first: featured tier, then year desc, then reverse file order for ties.
  const indexed = all.map((p, i) => ({ p, i }));
  indexed.sort((a, b) => {
    if (a.p.featured !== b.p.featured) return a.p.featured ? -1 : 1;
    if (a.p.year !== b.p.year) return (b.p.year ?? 0) - (a.p.year ?? 0);
    return b.i - a.i;
  });
  return indexed.map(({ p }) => p);
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
  credentialId?: string;
  featured: boolean;
  status: "published" | "draft";
}

export const getCertifications = cache(function getCertifications(includeDrafts = false): Certification[] {
  ensureContentSynced("certifications.json");
  const filePath = path.join(contentDir, "certifications.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const all = (JSON.parse(raw) as Certification[])
    .map((c) => ({
      ...c,
      featured: c.featured ?? false,
      status: c.status ?? "published" as const,
    }))
    .filter((c) => includeDrafts || c.status !== "draft");
  // Newest-first: featured tier, then year desc, then reverse file order for ties.
  const indexed = all.map((c, i) => ({ c, i }));
  indexed.sort((a, b) => {
    if (a.c.featured !== b.c.featured) return a.c.featured ? -1 : 1;
    if (a.c.year !== b.c.year) return (b.c.year ?? 0) - (a.c.year ?? 0);
    return b.i - a.i;
  });
  return indexed.map(({ c }) => c);
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
  status?: "published" | "draft";
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

export const getEvents = cache(function getEvents(includeDrafts = false): Event[] {
  ensureContentSynced("events.json");
  const filePath = path.join(contentDir, "events.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const all = (JSON.parse(raw) as Event[])
    .map((e) => ({
      ...e,
      status: e.status ?? "published" as const,
    }))
    .filter((e) => includeDrafts || e.status !== "draft");
  // Newest-first: featured tier, then year desc, then reverse file order for ties.
  const indexed = all.map((e, i) => ({ e, i }));
  indexed.sort((a, b) => {
    const aFeat = !!a.e.featured;
    const bFeat = !!b.e.featured;
    if (aFeat !== bFeat) return aFeat ? -1 : 1;
    if (a.e.year !== b.e.year) return (b.e.year ?? 0) - (a.e.year ?? 0);
    return b.i - a.i;
  });
  return indexed.map(({ e }) => e);
});

export function getEvent(slug: string, includeDrafts = false): Event | null {
  return getEvents(includeDrafts).find((e) => e.slug === slug) ?? null;
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
  status: "published" | "draft";
}

export const getTalks = cache(function getTalks(includeDrafts = false): Talk[] {
  const filePath = path.join(contentDir, "talks.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const all = (JSON.parse(raw) as Talk[])
    .map((t) => ({
      ...t,
      status: t.status ?? "published" as const,
    }))
    .filter((t) => includeDrafts || t.status !== "draft");
  // Newest-first: featured tier, then reverse file order so admin-appended talks surface first.
  const indexed = all.map((t, i) => ({ t, i }));
  indexed.sort((a, b) => {
    if (a.t.featured !== b.t.featured) return a.t.featured ? -1 : 1;
    return b.i - a.i;
  });
  return indexed.map(({ t }) => t);
});

// ---------------------------------------------------------------------------
// Tech Radar
// ---------------------------------------------------------------------------

export type RadarQuadrant = "languages" | "platforms" | "tools" | "techniques";
export type RadarRing = "adopt" | "trial" | "assess" | "hold";

export interface RadarEntry {
  id: string;
  name: string;
  quadrant: RadarQuadrant;
  ring: RadarRing;
  summary: string;
  useWhen?: string;
  avoidWhen?: string;
  movedFrom?: RadarRing;
  tags?: string[];
  status?: "draft" | "published";
}

export interface TechRadar {
  edition: string;
  publishedAt: string;
  summary: string;
  entries: RadarEntry[];
}

export const getTechRadar = cache(function getTechRadar(includeDrafts = false): TechRadar | null {
  const filePath = path.join(contentDir, "tech-radar.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const radar = JSON.parse(raw) as TechRadar;
  // Newest-first: reverse entries so admin-appended items surface at the top.
  // Entries predating the publish flag have no `status` \u2014 treat those as published
  // so nothing already live disappears.
  const entries = [...radar.entries]
    .reverse()
    .filter((e) => includeDrafts || e.status !== "draft");
  return { ...radar, entries };
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

// ---------------------------------------------------------------------------
// ADR Gallery
// ---------------------------------------------------------------------------

export type WAFPillar =
  | "reliability"
  | "security"
  | "cost-optimization"
  | "operational-excellence"
  | "performance-efficiency";

export type ADRStatus = "accepted" | "proposed" | "deprecated" | "superseded";

export interface ADREntry {
  id: string;
  number: number;
  title: string;
  /** Decision lifecycle — NOT the publish flag. See `publishStatus`. */
  status: ADRStatus;
  /** Publish state, shown on the public /decisions page only when not "draft". */
  publishStatus?: "draft" | "published";
  date: string;
  wafPillars: WAFPillar[];
  context: string;
  options: string[];
  decision: string;
  rationale: string;
  tradeoffs: string;
  outcome: string;
  tags?: string[];
}

export interface ADRGallery {
  publishedAt: string;
  summary: string;
  entries: ADREntry[];
}

export const getADRGallery = cache(function getADRGallery(includeDrafts = false): ADRGallery | null {
  const filePath = path.join(contentDir, "decisions.json");
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const gallery = JSON.parse(raw) as ADRGallery;
  // Newest-first: sort by ADR number desc (admin assigns next sequential number).
  // `publishStatus` is separate from `status` (the decision lifecycle). Entries
  // predating the flag have none \u2014 treat those as published.
  const entries = [...gallery.entries]
    .filter((e) => includeDrafts || e.publishStatus !== "draft")
    .sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
  return { ...gallery, entries };
});
