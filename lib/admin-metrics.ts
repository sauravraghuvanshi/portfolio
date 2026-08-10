// Server-only helpers that derive admin dashboard metrics from the existing
// content layer. No new APIs or schemas — pure read aggregation.
//
// Design rule: EVERY aggregate below is derived from one normalized array
// (`items`). Previously Decisions were never loaded at all and Tech Radar was
// bolted on as a standalone `radarCount`, which produced two different
// denominators on the same screen (a "Total content" card of 125 next to
// donuts summing to 77) and a Drafts count that silently ignored ADR and radar
// drafts. Adding a new content kind must mean adding one normalizer here — not
// a second counter somewhere else.
import "server-only";
import {
  getAllBlogPosts,
  getAllCaseStudies,
  getProjects,
  getTalks,
  getEvents,
  getCertifications,
  getTechRadar,
  getADRGallery,
  type BlogPost,
  type CaseStudy,
  type Project,
  type Talk,
  type Event,
  type Certification,
  type RadarEntry,
  type ADREntry,
} from "./content";

export type ContentKind =
  | "blog"
  | "case-study"
  | "project"
  | "talk"
  | "event"
  | "certification"
  | "decision"
  | "radar";

export type PublishStatus = "published" | "draft";

export interface ActivityItem {
  kind: ContentKind;
  title: string;
  href: string;
  status: PublishStatus;
  featured: boolean;
  /** ISO date or 4-digit year. `null` for kinds that carry no date at all. */
  date: string | null;
  meta?: string;
}

/** One row per piece of content, regardless of kind. The single source of truth. */
interface NormalizedItem extends ActivityItem {
  /** Year used for timeline/sparkline bucketing. `null` when undatable. */
  year: number | null;
  /** Feeds the category distribution chart. Empty for kinds without taxonomy. */
  categories: string[];
}

export interface TimelinePoint {
  year: string;
  Blogs: number;
  "Case Studies": number;
  Projects: number;
  Events: number;
  Certs: number;
  Decisions: number;
  [key: string]: string | number;
}

export interface AdminMetrics {
  totals: Record<ContentKind, number>;
  /** Sum of every kind — the ONLY total. Do not re-sum `totals` at a call site. */
  totalContent: number;
  totalPublished: number;
  totalDrafts: number;
  totalFeatured: number;
  /** Sum of reading minutes across published blog posts. */
  blogReadingMinutes: number;
  recent: ActivityItem[];
  timeline: TimelinePoint[];
  /**
   * Series descriptors for the timeline chart, derived from the same
   * `TIMELINE_KINDS` list that builds the data. Exported so the chart can never
   * drift out of sync with the rows it is handed.
   */
  timelineSeries: { key: string; color: string }[];
  categoryDistribution: { name: string; value: number }[];
  statusBreakdown: { name: string; value: number; color: string }[];
  contentMix: { name: string; value: number; color: string }[];
  /** Per-kind counts per timeline year. Empty array when the kind has no dates. */
  sparklines: Record<ContentKind, number[]>;
}

export const KIND_LABEL: Record<ContentKind, string> = {
  blog: "Blogs",
  "case-study": "Case Studies",
  project: "Projects",
  talk: "Talks",
  event: "Events",
  certification: "Certs",
  decision: "Decisions",
  radar: "Tech Radar",
};

export const KIND_COLOR: Record<ContentKind, string> = {
  blog: "#60a5fa",
  "case-study": "#22d3ee",
  project: "#a78bfa",
  talk: "#f472b6",
  event: "#fb923c",
  certification: "#34d399",
  decision: "#facc15",
  radar: "#f87171",
};

const KIND_HREF: Record<ContentKind, (slug: string) => string> = {
  blog: (s) => `/admin/blog/${s}/edit`,
  "case-study": (s) => `/admin/case-studies/${s}/edit`,
  project: (s) => `/admin/projects/${s}/edit`,
  talk: (s) => `/admin/talks/${s}/edit`,
  event: (s) => `/admin/events/${s}/edit`,
  certification: (s) => `/admin/certifications/${s}/edit`,
  decision: (s) => `/admin/decisions/${s}/edit`,
  radar: (s) => `/admin/tech-radar/${s}/edit`,
};

/** Timeline series. Talks and Radar are absent on purpose — see `buildTimeline`. */
const TIMELINE_KINDS: ContentKind[] = [
  "blog",
  "case-study",
  "project",
  "event",
  "certification",
  "decision",
];

function yearOf(date: string | null): number | null {
  if (!date) return null;
  const match = date.match(/(19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

function readingMinutes(p: BlogPost): number {
  const m = p.readingTime?.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

function normalize(
  kind: ContentKind,
  slug: string,
  title: string,
  status: PublishStatus,
  featured: boolean,
  date: string | null,
  meta?: string,
  categories: string[] = [],
): NormalizedItem {
  return {
    kind,
    title,
    href: KIND_HREF[kind](slug),
    status,
    featured,
    date,
    year: yearOf(date),
    meta,
    categories,
  };
}

/**
 * Collect every piece of content into one normalized list.
 *
 * Per-kind status traps worth knowing:
 * - `ADREntry.status` is the *decision lifecycle* (accepted/proposed/…), NOT the
 *   publish flag. Draft-ness lives on `publishStatus`. Filtering on `.status`
 *   here would silently report zero ADR drafts.
 * - Events, radar entries and ADRs predate their publish flags, so a missing
 *   flag means "published" — matching the getters in `lib/content.ts`.
 */
function collectItems(): NormalizedItem[] {
  const items: NormalizedItem[] = [];

  for (const b of getAllBlogPosts(true) as BlogPost[]) {
    items.push(
      normalize("blog", b.slug, b.title, b.status, b.featured, b.date, b.category.join(", "), b.category),
    );
  }

  for (const c of getAllCaseStudies(true) as CaseStudy[]) {
    items.push(
      normalize(
        "case-study",
        c.slug,
        c.title,
        c.status ?? "published",
        c.featured ?? false,
        c.timeline ?? null,
        c.category?.join(", "),
        c.category ?? [],
      ),
    );
  }

  for (const p of getProjects(true) as Project[]) {
    items.push(
      normalize("project", p.id, p.title, p.status, p.featured, String(p.year), p.category.join(", "), p.category),
    );
  }

  // Talks carry no date field at all (id/title/description/topic/featured/status).
  for (const t of getTalks(true) as Talk[]) {
    items.push(normalize("talk", t.id, t.title, t.status, t.featured, null, t.topic));
  }

  for (const e of getEvents(true) as Event[]) {
    items.push(
      normalize("event", e.slug, e.title, e.status ?? "published", e.featured ?? false, String(e.year), e.format),
    );
  }

  for (const c of getCertifications(true) as Certification[]) {
    items.push(normalize("certification", c.code, c.name, c.status, c.featured, String(c.year), c.issuer));
  }

  for (const d of (getADRGallery(true)?.entries ?? []) as ADREntry[]) {
    items.push(
      normalize(
        "decision",
        d.id,
        `ADR-${String(d.number).padStart(3, "0")} · ${d.title}`,
        d.publishStatus ?? "published", // NOT d.status — that is the ADR lifecycle
        false, // ADRs have no featured flag
        d.date,
        d.status,
        d.tags ?? [],
      ),
    );
  }

  // Radar entries have no per-entry date; only the radar edition does.
  for (const r of (getTechRadar(true)?.entries ?? []) as RadarEntry[]) {
    items.push(
      normalize("radar", r.id, r.name, r.status ?? "published", false, null, `${r.ring} · ${r.quadrant}`),
    );
  }

  return items;
}

/**
 * Year-bucketed counts.
 *
 * Talks and Radar entries are deliberately excluded: neither carries a per-item
 * date. Talks would render a permanent flat-zero line; radar would spike all 48
 * entries onto the single `publishedAt` edition year. An absent series is more
 * honest than a fabricated one.
 */
function buildTimeline(items: NormalizedItem[]): TimelinePoint[] {
  const currentYear = new Date().getFullYear();
  const knownYears = items
    .map((i) => i.year)
    .filter((y): y is number => y !== null && y >= 1990 && y <= currentYear + 5);
  const minYear = Math.min(currentYear - 5, ...(knownYears.length ? knownYears : [currentYear]));
  const years = Array.from({ length: currentYear - minYear + 1 }, (_, i) => minYear + i);

  return years.map((y) => {
    const point = { year: String(y) } as TimelinePoint;
    for (const kind of TIMELINE_KINDS) {
      point[KIND_LABEL[kind]] = items.filter((i) => i.kind === kind && i.year === y).length;
    }
    return point;
  });
}

export function getAdminMetrics(): AdminMetrics {
  const items = collectItems();

  const kinds = Object.keys(KIND_LABEL) as ContentKind[];
  const totals = Object.fromEntries(
    kinds.map((k) => [k, items.filter((i) => i.kind === k).length]),
  ) as Record<ContentKind, number>;

  const totalPublished = items.filter((i) => i.status === "published").length;
  const totalDrafts = items.filter((i) => i.status === "draft").length;
  const totalFeatured = items.filter((i) => i.featured).length;

  // Newest-first. Undated kinds (talks, radar) sort last but stay eligible for
  // the feed — previously they were given date "" and sorted to epoch 0, which
  // pushed them below every other item permanently.
  const recent: ActivityItem[] = [...items]
    .sort((a, b) => {
      const ta = a.date ? new Date(a.date).getTime() || (a.year ?? 0) : -Infinity;
      const tb = b.date ? new Date(b.date).getTime() || (b.year ?? 0) : -Infinity;
      return tb - ta;
    })
    .slice(0, 12)
    .map(({ kind, title, href, status, featured, date, meta }) => ({
      kind,
      title,
      href,
      status,
      featured,
      date,
      meta,
    }));

  const timeline = buildTimeline(items);

  const catCounts = new Map<string, number>();
  for (const item of items) {
    for (const c of item.categories) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  }
  const categoryDistribution = Array.from(catCounts, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const sparklines = Object.fromEntries(
    kinds.map((k) => [
      k,
      TIMELINE_KINDS.includes(k) ? timeline.map((t) => Number(t[KIND_LABEL[k]] ?? 0)) : [],
    ]),
  ) as Record<ContentKind, number[]>;

  return {
    totals,
    totalContent: items.length,
    totalPublished,
    totalDrafts,
    totalFeatured,
    blogReadingMinutes: (getAllBlogPosts(true) as BlogPost[])
      .filter((b) => b.status === "published")
      .reduce((s, b) => s + readingMinutes(b), 0),
    recent,
    timeline,
    timelineSeries: TIMELINE_KINDS.map((k) => ({
      key: KIND_LABEL[k],
      color: KIND_COLOR[k],
    })),
    categoryDistribution,
    statusBreakdown: [
      { name: "Published", value: totalPublished, color: "#22c55e" },
      { name: "Draft", value: totalDrafts, color: "#f59e0b" },
    ],
    contentMix: kinds.map((k) => ({
      name: KIND_LABEL[k],
      value: totals[k],
      color: KIND_COLOR[k],
    })),
    sparklines,
  };
}
