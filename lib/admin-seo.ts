import "server-only";
import {
  getAllBlogPosts,
  getAllCaseStudies,
  getProjects,
  getTalks,
  getEvents,
  getCertifications,
} from "./content";

export interface SeoIssue {
  severity: "high" | "medium" | "low";
  kind: string; // "blog" | "case-study" | etc.
  title: string;
  message: string;
  href?: string;
}

export interface SeoCoverage {
  total: number;
  withDescription: number;
  withCoverImage: number;
  averageDescriptionLength: number;
}

export interface SeoMetrics {
  score: number; // 0-100
  totals: { kind: string; count: number }[];
  coverage: Record<string, SeoCoverage>; // by kind
  issues: SeoIssue[];
  topTags: { name: string; value: number }[];
  topCategories: { name: string; value: number }[];
  schemas: { name: string; description: string; status: "implemented" | "todo" }[];
  metaFiles: { name: string; path: string; present: boolean; description: string }[];
  scoreBreakdown: { name: string; value: number; color: string }[];
}

const DESC_MIN = 80;
const DESC_MAX = 160;

function descScore(d: string | undefined): number {
  if (!d) return 0;
  const len = d.length;
  if (len >= DESC_MIN && len <= DESC_MAX) return 1;
  if (len >= 50 && len <= 200) return 0.7;
  if (len >= 30) return 0.4;
  return 0.2;
}

export function getSeoMetrics(): SeoMetrics {
  const blogs = getAllBlogPosts(true);
  const caseStudies = getAllCaseStudies(true);
  const projects = getProjects(true);
  const talks = getTalks(true);
  const events = getEvents(true);
  const certs = getCertifications(true);

  const issues: SeoIssue[] = [];

  // Blog coverage
  const blogCoverage: SeoCoverage = {
    total: blogs.length,
    withDescription: 0,
    withCoverImage: 0,
    averageDescriptionLength: 0,
  };
  let blogDescTotal = 0;
  for (const b of blogs) {
    if (b.description) {
      blogCoverage.withDescription++;
      blogDescTotal += b.description.length;
      if (b.description.length < DESC_MIN || b.description.length > DESC_MAX) {
        issues.push({
          severity: b.description.length < 50 ? "high" : "low",
          kind: "blog",
          title: b.title,
          message: `Description length ${b.description.length} is outside the recommended ${DESC_MIN}–${DESC_MAX} chars`,
          href: `/admin/blog/${b.slug}/edit`,
        });
      }
    } else {
      issues.push({
        severity: "high",
        kind: "blog",
        title: b.title,
        message: "Missing meta description",
        href: `/admin/blog/${b.slug}/edit`,
      });
    }
    if (b.coverImage) {
      blogCoverage.withCoverImage++;
    } else {
      issues.push({
        severity: "medium",
        kind: "blog",
        title: b.title,
        message: "Missing cover image (used for OG/Twitter cards)",
        href: `/admin/blog/${b.slug}/edit`,
      });
    }
  }
  blogCoverage.averageDescriptionLength = blogs.length
    ? Math.round(blogDescTotal / Math.max(1, blogCoverage.withDescription))
    : 0;

  // Case study coverage (subtitle = description, coverImage required)
  const csCoverage: SeoCoverage = {
    total: caseStudies.length,
    withDescription: 0,
    withCoverImage: 0,
    averageDescriptionLength: 0,
  };
  let csDescTotal = 0;
  for (const c of caseStudies) {
    if (c.subtitle) {
      csCoverage.withDescription++;
      csDescTotal += c.subtitle.length;
    } else {
      issues.push({
        severity: "high",
        kind: "case-study",
        title: c.title,
        message: "Missing subtitle (used as meta description)",
        href: `/admin/case-studies/${c.slug}/edit`,
      });
    }
    if (c.coverImage) csCoverage.withCoverImage++;
    else
      issues.push({
        severity: "medium",
        kind: "case-study",
        title: c.title,
        message: "Missing cover image",
        href: `/admin/case-studies/${c.slug}/edit`,
      });
  }
  csCoverage.averageDescriptionLength = csCoverage.withDescription
    ? Math.round(csDescTotal / csCoverage.withDescription)
    : 0;

  // Project coverage
  const pCoverage: SeoCoverage = {
    total: projects.length,
    withDescription: 0,
    withCoverImage: 0,
    averageDescriptionLength: 0,
  };
  let pDescTotal = 0;
  for (const p of projects) {
    if (p.description) {
      pCoverage.withDescription++;
      pDescTotal += p.description.length;
    } else {
      issues.push({
        severity: "high",
        kind: "project",
        title: p.title,
        message: "Missing description",
        href: `/admin/projects/${p.id}/edit`,
      });
    }
    if (p.liveUrl && p.liveUrl !== "#") pCoverage.withCoverImage++; // reuse: outbound credibility
    if ((p.liveUrl === "#" || !p.liveUrl) && (p.githubUrl === "#" || !p.githubUrl)) {
      issues.push({
        severity: "low",
        kind: "project",
        title: p.title,
        message: "No public live or GitHub URL — visitors cannot verify",
        href: `/admin/projects/${p.id}/edit`,
      });
    }
  }
  pCoverage.averageDescriptionLength = pCoverage.withDescription
    ? Math.round(pDescTotal / pCoverage.withDescription)
    : 0;

  // Talks
  const tCoverage: SeoCoverage = {
    total: talks.length,
    withDescription: 0,
    withCoverImage: 0,
    averageDescriptionLength: 0,
  };
  let tDescTotal = 0;
  for (const t of talks) {
    if (t.description) {
      tCoverage.withDescription++;
      tDescTotal += t.description.length;
    } else {
      issues.push({
        severity: "medium",
        kind: "talk",
        title: t.title,
        message: "Missing description (hurts both SEO and viewer context)",
        href: `/admin/talks/${t.id}/edit`,
      });
    }
  }
  tCoverage.averageDescriptionLength = tCoverage.withDescription
    ? Math.round(tDescTotal / tCoverage.withDescription)
    : 0;

  // Events
  const eCoverage: SeoCoverage = {
    total: events.length,
    withDescription: 0,
    withCoverImage: 0,
    averageDescriptionLength: 0,
  };
  let eDescTotal = 0;
  for (const e of events) {
    if (e.summary) {
      eCoverage.withDescription++;
      eDescTotal += e.summary.length;
    } else {
      issues.push({
        severity: "medium",
        kind: "event",
        title: e.title,
        message: "Missing event summary",
        href: `/admin/events/${e.slug}/edit`,
      });
    }
    if (e.coverImage) eCoverage.withCoverImage++;
  }
  eCoverage.averageDescriptionLength = eCoverage.withDescription
    ? Math.round(eDescTotal / eCoverage.withDescription)
    : 0;

  // Certs
  const certCoverage: SeoCoverage = {
    total: certs.length,
    withDescription: 0,
    withCoverImage: 0,
    averageDescriptionLength: 0,
  };
  for (const c of certs) {
    if (c.verifyUrl && c.verifyUrl !== "#") certCoverage.withDescription++;
    else
      issues.push({
        severity: "low",
        kind: "certification",
        title: c.name,
        message: "Missing verify URL — credibility signal",
        href: `/admin/certifications/${c.code}/edit`,
      });
    if (c.badge) certCoverage.withCoverImage++;
  }

  // Tag/category aggregation across blogs + projects + case studies.
  const tagMap = new Map<string, number>();
  const catMap = new Map<string, number>();
  for (const b of blogs) {
    for (const t of b.tags ?? []) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    for (const c of b.category) catMap.set(c, (catMap.get(c) ?? 0) + 1);
  }
  for (const p of projects) {
    for (const t of p.tags ?? []) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    for (const c of p.category) catMap.set(c, (catMap.get(c) ?? 0) + 1);
  }
  for (const cs of caseStudies) {
    for (const t of cs.tags ?? []) tagMap.set(t, (tagMap.get(t) ?? 0) + 1);
    for (const c of cs.category ?? []) catMap.set(c, (catMap.get(c) ?? 0) + 1);
  }

  const topTags = Array.from(tagMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const topCategories = Array.from(catMap, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Score: weighted avg across coverages and description quality.
  const allDescs = [
    ...blogs.map((b) => b.description),
    ...caseStudies.map((c) => c.subtitle),
    ...projects.map((p) => p.description),
    ...talks.map((t) => t.description),
    ...events.map((e) => e.summary),
  ];
  const descQuality = allDescs.length
    ? allDescs.reduce((s, d) => s + descScore(d), 0) / allDescs.length
    : 0;

  const coverageRatio = (c: SeoCoverage) =>
    c.total === 0 ? 1 : c.withDescription / c.total;
  const imageRatio = (c: SeoCoverage) =>
    c.total === 0 ? 1 : c.withCoverImage / c.total;

  const scoreParts = [
    { name: "Descriptions", v: descQuality, w: 0.35 },
    { name: "Cover images", v: (imageRatio(blogCoverage) + imageRatio(csCoverage) + imageRatio(eCoverage)) / 3, w: 0.2 },
    { name: "Talks meta", v: coverageRatio(tCoverage), w: 0.1 },
    { name: "Events meta", v: coverageRatio(eCoverage), w: 0.1 },
    { name: "Cert verify", v: certs.length ? certCoverage.withDescription / certs.length : 1, w: 0.1 },
    { name: "Project links", v: pCoverage.total ? pCoverage.withCoverImage / pCoverage.total : 1, w: 0.15 },
  ];
  const score = Math.round(
    scoreParts.reduce((s, p) => s + Math.max(0, Math.min(1, p.v)) * p.w, 0) * 100,
  );

  // Sort issues by severity high → low
  const sevOrder: Record<SeoIssue["severity"], number> = { high: 0, medium: 1, low: 2 };
  issues.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  return {
    score,
    totals: [
      { kind: "Blogs", count: blogs.length },
      { kind: "Case Studies", count: caseStudies.length },
      { kind: "Projects", count: projects.length },
      { kind: "Talks", count: talks.length },
      { kind: "Events", count: events.length },
      { kind: "Certifications", count: certs.length },
    ],
    coverage: {
      blog: blogCoverage,
      "case-study": csCoverage,
      project: pCoverage,
      talk: tCoverage,
      event: eCoverage,
      certification: certCoverage,
    },
    issues: issues.slice(0, 50),
    topTags,
    topCategories,
    scoreBreakdown: scoreParts.map((p) => ({
      name: p.name,
      value: Math.round(p.v * 100),
      color:
        p.v >= 0.85 ? "#22c55e" : p.v >= 0.6 ? "#f59e0b" : "#ef4444",
    })),
    schemas: [
      {
        name: "Person",
        description: "JSON-LD on root layout (homepage author identity)",
        status: "implemented",
      },
      {
        name: "WebSite",
        description: "Site-wide schema with search action",
        status: "implemented",
      },
      {
        name: "BlogPosting",
        description: "Per-post structured data with author, dates, image",
        status: "implemented",
      },
      {
        name: "Article",
        description: "Case study pages",
        status: "implemented",
      },
      {
        name: "BreadcrumbList",
        description: "Breadcrumbs across content pages",
        status: "implemented",
      },
      {
        name: "VideoObject",
        description: "Talks page (YouTube embeds)",
        status: "implemented",
      },
    ],
    metaFiles: [
      {
        name: "sitemap.xml",
        path: "/sitemap.xml",
        present: true,
        description: "Dynamic sitemap covering all routes",
      },
      {
        name: "robots.txt",
        path: "/robots.txt",
        present: true,
        description: "Allow all crawlers; sitemap reference",
      },
      {
        name: "RSS feed",
        path: "/rss.xml",
        present: true,
        description: "Blog feed for RSS readers",
      },
      {
        name: "manifest.webmanifest",
        path: "/manifest.webmanifest",
        present: true,
        description: "PWA app manifest",
      },
    ],
  };
}
