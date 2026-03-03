import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export interface CaseStudyMeta {
  title: string;
  subtitle: string;
  slug: string;
  tags: string[];
  category: string;
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
  return { ...(data as CaseStudyMeta), content };
}

export function getAllCaseStudies(): CaseStudy[] {
  const slugs = getCaseStudySlugs();
  return slugs
    .map((slug) => getCaseStudy(slug))
    .filter((cs): cs is CaseStudy => cs !== null)
    .sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
}

export function getFeaturedCaseStudies(): CaseStudy[] {
  return getAllCaseStudies().filter((cs) => cs.featured);
}

export function getProfile() {
  const filePath = path.join(contentDir, "profile.json");
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export interface Project {
  id: string;
  title: string;
  description: string;
  outcomes: string[];
  tags: string[];
  category: string;
  techStack: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
  year: number;
}

export function getProjects(): Project[] {
  const filePath = path.join(contentDir, "projects.json");
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

export function getFeaturedProjects(): Project[] {
  return getProjects().filter((p) => p.featured);
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

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
}

export type Event = EventMeta;

export function getEvents(): Event[] {
  const filePath = path.join(contentDir, "events.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Event[];
}

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

export function getTalks(): Talk[] {
  const filePath = path.join(contentDir, "talks.json");
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  return JSON.parse(raw) as Talk[];
}
