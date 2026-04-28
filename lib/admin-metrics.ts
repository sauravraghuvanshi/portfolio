// Server-only helpers that derive admin dashboard metrics from the existing
// content layer. No new APIs or schemas — pure read aggregation.
import "server-only";
import {
  getAllBlogPosts,
  getAllCaseStudies,
  getProjects,
  getTalks,
  getEvents,
  getCertifications,
  getTechRadar,
  type BlogPost,
  type CaseStudy,
  type Project,
  type Talk,
  type Event,
  type Certification,
} from "./content";

export type ContentKind =
  | "blog"
  | "case-study"
  | "project"
  | "talk"
  | "event"
  | "certification";

export interface ActivityItem {
  kind: ContentKind;
  title: string;
  href: string;
  status: "published" | "draft";
  featured: boolean;
  date: string; // ISO or year string
  meta?: string;
}

export interface AdminMetrics {
  totals: Record<ContentKind, number>;
  totalPublished: number;
  totalDrafts: number;
  totalFeatured: number;
  blogReadingMinutes: number; // sum of reading minutes across published blogs
  radarCount: number; // total tech radar entries
  recent: ActivityItem[]; // newest 12
  timeline: TimelinePoint[];
  categoryDistribution: { name: string; value: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  contentMix: { name: string; value: number; color: string }[];
  /** Per-kind sparkline of last N years counts */
  sparklines: Record<ContentKind, number[]>;
}

export interface TimelinePoint {
  year: string;
  Blogs: number;
  "Case Studies": number;
  Projects: number;
  Talks: number;
  Events: number;
  Certs: number;
}

const KIND_HREF: Record<ContentKind, (slug: string) => string> = {
  blog: (s) => `/admin/blog/${s}/edit`,
  "case-study": (s) => `/admin/case-studies/${s}/edit`,
  project: (s) => `/admin/projects/${s}/edit`,
  talk: (s) => `/admin/talks/${s}/edit`,
  event: (s) => `/admin/events/${s}/edit`,
  certification: (s) => `/admin/certifications/${s}/edit`,
};

function blogYear(p: BlogPost): number {
  return new Date(p.date).getFullYear();
}

function readingMinutes(p: BlogPost): number {
  const m = p.readingTime?.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function getAdminMetrics(): AdminMetrics {
  const blogs = getAllBlogPosts(true);
  const caseStudies = getAllCaseStudies(true);
  const projects = getProjects(true);
  const talks = getTalks(true);
  const events = getEvents(true);
  const certs = getCertifications(true);
  const radar = getTechRadar();

  const totals: Record<ContentKind, number> = {
    blog: blogs.length,
    "case-study": caseStudies.length,
    project: projects.length,
    talk: talks.length,
    event: events.length,
    certification: certs.length,
  };

  const all: { status: "published" | "draft"; featured: boolean }[] = [
    ...blogs,
    ...caseStudies,
    ...projects,
    ...talks,
    ...(events as Event[]).map((e) => ({
      status: e.status ?? "published",
      featured: e.featured ?? false,
    })),
    ...certs,
  ];

  const totalPublished = all.filter((i) => i.status === "published").length;
  const totalDrafts = all.filter((i) => i.status === "draft").length;
  const totalFeatured = all.filter((i) => i.featured).length;

  // Recent activity (newest first), normalised across kinds.
  const recent: ActivityItem[] = [
    ...blogs.map<ActivityItem>((b: BlogPost) => ({
      kind: "blog",
      title: b.title,
      href: KIND_HREF.blog(b.slug),
      status: b.status,
      featured: b.featured,
      date: b.date,
      meta: b.category.join(", "),
    })),
    ...caseStudies.map<ActivityItem>((c: CaseStudy) => ({
      kind: "case-study",
      title: c.title,
      href: KIND_HREF["case-study"](c.slug),
      status: c.status ?? "published",
      featured: c.featured ?? false,
      date: c.timeline ?? "",
      meta: c.category?.join(", "),
    })),
    ...projects.map<ActivityItem>((p: Project) => ({
      kind: "project",
      title: p.title,
      href: KIND_HREF.project(p.id),
      status: p.status,
      featured: p.featured,
      date: String(p.year),
      meta: p.category.join(", "),
    })),
    ...talks.map<ActivityItem>((t: Talk) => ({
      kind: "talk",
      title: t.title,
      href: KIND_HREF.talk(t.id),
      status: t.status,
      featured: t.featured,
      date: "",
      meta: t.topic,
    })),
    ...events.map<ActivityItem>((e: Event) => ({
      kind: "event",
      title: e.title,
      href: KIND_HREF.event(e.slug),
      status: e.status ?? "published",
      featured: e.featured ?? false,
      date: String(e.year),
      meta: e.format,
    })),
    ...certs.map<ActivityItem>((c: Certification) => ({
      kind: "certification",
      title: c.name,
      href: KIND_HREF.certification(c.code),
      status: c.status,
      featured: c.featured,
      date: String(c.year),
      meta: c.issuer,
    })),
  ]
    .sort((a, b) => {
      const ta = new Date(a.date).getTime() || Number(a.date) || 0;
      const tb = new Date(b.date).getTime() || Number(b.date) || 0;
      return tb - ta;
    })
    .slice(0, 12);

  // Timeline: last 6 calendar years (or full range if shorter).
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(
    currentYear - 5,
    ...blogs.map(blogYear),
    ...projects.map((p) => p.year),
    ...events.map((e) => e.year),
    ...certs.map((c) => c.year),
  );
  const years = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => minYear + i,
  );

  const csYear = (c: CaseStudy): number | null => {
    // case-studies use a free-form timeline string; try to extract a 4-digit year.
    const m = (c.timeline ?? "").match(/(20\d{2})/);
    return m ? Number(m[1]) : null;
  };

  const timeline: TimelinePoint[] = years.map((y) => ({
    year: String(y),
    Blogs: blogs.filter((b) => blogYear(b) === y).length,
    "Case Studies": caseStudies.filter((c) => csYear(c) === y).length,
    Projects: projects.filter((p) => p.year === y).length,
    Talks: 0, // talks have no year
    Events: events.filter((e) => e.year === y).length,
    Certs: certs.filter((c) => c.year === y).length,
  }));

  // Category distribution (top tags across published blogs + projects + case studies).
  const catCounts = new Map<string, number>();
  for (const b of blogs) for (const c of b.category) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  for (const p of projects) for (const c of p.category) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  for (const cs of caseStudies)
    for (const c of cs.category ?? []) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  const categoryDistribution = Array.from(catCounts, ([name, value]) => ({
    name,
    value,
  }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const statusBreakdown = [
    { name: "Published", value: totalPublished, color: "#22c55e" },
    { name: "Draft", value: totalDrafts, color: "#f59e0b" },
  ];

  const contentMix = [
    { name: "Blogs", value: totals.blog, color: "#60a5fa" },
    { name: "Case Studies", value: totals["case-study"], color: "#22d3ee" },
    { name: "Projects", value: totals.project, color: "#a78bfa" },
    { name: "Talks", value: totals.talk, color: "#f472b6" },
    { name: "Events", value: totals.event, color: "#fb923c" },
    { name: "Certs", value: totals.certification, color: "#34d399" },
  ];

  // Per-kind sparkline = counts per year over the timeline range.
  const sparklines: Record<ContentKind, number[]> = {
    blog: timeline.map((t) => t.Blogs),
    "case-study": timeline.map((t) => t["Case Studies"]),
    project: timeline.map((t) => t.Projects),
    talk: [], // no year data
    event: timeline.map((t) => t.Events),
    certification: timeline.map((t) => t.Certs),
  };

  return {
    totals,
    totalPublished,
    totalDrafts,
    totalFeatured,
    blogReadingMinutes: blogs
      .filter((b) => b.status === "published")
      .reduce((s, b) => s + readingMinutes(b), 0),
    radarCount: radar?.entries.length ?? 0,
    recent,
    timeline,
    categoryDistribution,
    statusBreakdown,
    contentMix,
    sparklines,
  };
}
