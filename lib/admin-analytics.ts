/**
 * Read model over `lib/analytics-store.ts`, shaped for the admin UI.
 *
 * Synchronous like every other metric getter in this codebase (`getAdminMetrics`
 * and the `lib/content.ts` loaders), so admin pages can call it directly in a
 * server component without a loading state.
 *
 * The store is authoritative; nothing here writes. Buckets are read live
 * (including anything still buffered in memory), which is why the pages that
 * consume this must stay `force-dynamic`.
 */
import "server-only";
import { readAnalytics, dayKey, type DayBucket } from "./analytics-store";

export const WINDOW_DAYS = 30;

export interface TrendPoint {
  /** YYYY-MM-DD — the recharts x-axis key. */
  date: string;
  /** Short human label, e.g. "10 Aug". */
  label: string;
  views: number;
  visitors: number;
  /** Index signature so this can feed the generic `ContentTimelineChart`. */
  [key: string]: string | number;
}

export interface RankedItem {
  name: string;
  value: number;
}

export interface AnalyticsMetrics {
  /** False until the very first page view lands — drives the empty state. */
  hasData: boolean;
  /** ISO date collection began, for "Collecting since …". */
  startedAt: string;
  /** Whole days elapsed since collection began. */
  daysCollected: number;

  viewsToday: number;
  visitorsToday: number;
  views30d: number;
  /**
   * Sum of per-day unique visitors across the window — NOT deduplicated across
   * days. Someone who visits on three days counts three times. Deduplicating
   * would require retaining every day's hash list, which the store deliberately
   * discards after 48h so the identifier stays unlinkable across days. The UI
   * labels this "Visitors (30d)", never "unique visitors".
   */
  uniqueVisitors30d: number;
  totalViews: number;

  /** Change vs. the immediately preceding 30-day window. */
  viewsDelta: number;
  visitorsDelta: number;

  /** Exactly WINDOW_DAYS rows, oldest first, zero-filled for silent days. */
  trend: TrendPoint[];
  /** Views only, for `StatCard`'s inline sparkline. */
  sparkline: number[];

  topPages: RankedItem[];
  topReferrers: RankedItem[];
  /** Convenience for the dashboard's "Top page" card. */
  topPage: RankedItem | null;
}

/** Day keys for a window ending today, oldest first. */
function windowKeys(days: number, endOffset = 0): string[] {
  const keys: string[] = [];
  for (let i = days - 1 + endOffset; i >= endOffset; i--) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

/** "2026-08-10" → "10 Aug". */
function shortLabel(key: string): string {
  const [, month, day] = key.split("-");
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${Number(day)} ${MONTHS[Number(month) - 1] ?? ""}`.trim();
}

/** Merge counter maps across buckets and return the top N, descending. */
function rank(
  buckets: DayBucket[],
  pick: (b: DayBucket) => Record<string, number>,
  limit: number
): RankedItem[] {
  const merged = new Map<string, number>();
  for (const bucket of buckets) {
    for (const [name, value] of Object.entries(pick(bucket) ?? {})) {
      merged.set(name, (merged.get(name) ?? 0) + value);
    }
  }
  return [...merged.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function getAnalyticsMetrics(): AnalyticsMetrics {
  const data = readAnalytics();
  const days = data.days ?? {};
  const today = dayKey();

  const currentKeys = windowKeys(WINDOW_DAYS);
  const priorKeys = windowKeys(WINDOW_DAYS, WINDOW_DAYS);

  const bucketFor = (key: string): DayBucket =>
    days[key] ?? { views: 0, visitors: 0, paths: {}, referrers: {} };

  const currentBuckets = currentKeys.map(bucketFor);
  const priorBuckets = priorKeys.map(bucketFor);

  const sum = (buckets: DayBucket[], field: "views" | "visitors") =>
    buckets.reduce((n, b) => n + (b[field] ?? 0), 0);

  const views30d = sum(currentBuckets, "views");
  const visitors30d = sum(currentBuckets, "visitors");
  const priorViews = sum(priorBuckets, "views");
  const priorVisitors = sum(priorBuckets, "visitors");

  // Lifetime total spans everything retained (90 days), not just the window.
  const totalViews = Object.values(days).reduce((n, b) => n + (b.views ?? 0), 0);

  const trend: TrendPoint[] = currentKeys.map((key, i) => ({
    date: key,
    label: shortLabel(key),
    views: currentBuckets[i].views ?? 0,
    visitors: currentBuckets[i].visitors ?? 0,
  }));

  const topPages = rank(currentBuckets, (b) => b.paths, 8);
  const todayBucket = bucketFor(today);

  return {
    hasData: totalViews > 0,
    startedAt: data.startedAt,
    daysCollected: Math.max(
      1,
      Math.round((Date.parse(today) - Date.parse(data.startedAt)) / 86_400_000) + 1
    ),

    viewsToday: todayBucket.views ?? 0,
    visitorsToday: todayBucket.visitors ?? 0,
    views30d,
    uniqueVisitors30d: visitors30d,
    totalViews,

    viewsDelta: views30d - priorViews,
    visitorsDelta: visitors30d - priorVisitors,

    trend,
    sparkline: trend.map((p) => p.views),

    topPages,
    topReferrers: rank(currentBuckets, (b) => b.referrers, 8),
    topPage: topPages[0] ?? null,
  };
}
