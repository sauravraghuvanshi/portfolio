/**
 * First-party page-view counter backed by the same persistent volume the admin
 * content store uses.
 *
 * Why this exists at all: `NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING` has never
 * been set on the App Service, so `initAppInsights()` always returned early and
 * zero telemetry was ever collected. Counting starts from the day this ships.
 *
 * Why a client beacon rather than a server-side hook: every public page sets
 * `export const revalidate = 60`, so server components do NOT run per visit —
 * they run per regeneration. A counter incremented in a server component would
 * undercount by orders of magnitude. `middleware.ts` is Edge runtime (no `fs`)
 * and only matches `/admin/*`, so it cannot count either. The only correct
 * place is a Node-runtime route hit by a client beacon.
 *
 * Privacy: no cookie, no raw IP, no third party. Visitor identity is a salted
 * SHA-256 truncated to 12 hex chars, with the salt rotating daily — yesterday's
 * hashes cannot be matched against today's, so the identifier is unlinkable
 * across days by construction. Hash lists are kept only for today and
 * yesterday; older days retain just the resulting integer.
 *
 * SCALE-OUT CAVEAT: writes are buffered in module memory and flushed debounced,
 * which is safe only because the App Service is a single-instance B1. If the
 * plan ever scales out or enables multiple workers, concurrent instances will
 * clobber each other's JSON on the shared volume. At that point this needs to
 * move to Table Storage or an append-only log per instance.
 */
import "server-only";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const isAzure = !!process.env.WEBSITE_SITE_NAME;

/** Mirrors `lib/content-dir.ts` — same volume, same survives-zipdeploy guarantee. */
export const analyticsFile = isAzure
  ? "/home/data/analytics.json"
  : path.join(process.cwd(), ".data", "analytics.json");

/** Days of history retained. Older buckets are pruned on every flush. */
const RETENTION_DAYS = 90;
/** Cap on per-day visitor hashes, so a bot storm cannot grow the file forever. */
const MAX_HASHES_PER_DAY = 5000;
/** Cap on distinct paths / referrers tracked per day. */
const MAX_KEYS_PER_DAY = 300;

const FLUSH_AFTER_EVENTS = 20;
const FLUSH_AFTER_MS = 30_000;

export interface DayBucket {
  views: number;
  visitors: number;
  paths: Record<string, number>;
  referrers: Record<string, number>;
  /** Visitor hashes, retained only for today and yesterday. */
  hashes?: string[];
}

export interface AnalyticsData {
  version: 1;
  /** ISO date (YYYY-MM-DD) collection began — powers the "Collecting since" empty state. */
  startedAt: string;
  days: Record<string, DayBucket>;
}

/** YYYY-MM-DD in UTC. Using UTC keeps day boundaries stable regardless of host TZ. */
export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function emptyBucket(): DayBucket {
  return { views: 0, visitors: 0, paths: {}, referrers: {}, hashes: [] };
}

function emptyData(): AnalyticsData {
  return { version: 1, startedAt: dayKey(), days: {} };
}

/** In-memory working copy. `null` until first read. */
let cache: AnalyticsData | null = null;
let pending = 0;
let flushTimer: NodeJS.Timeout | null = null;
let exitHookInstalled = false;

function load(): AnalyticsData {
  if (cache) return cache;
  try {
    const raw = fs.readFileSync(analyticsFile, "utf8");
    const parsed = JSON.parse(raw) as AnalyticsData;
    if (parsed && parsed.version === 1 && parsed.days) {
      cache = { ...parsed, days: parsed.days ?? {} };
      return cache;
    }
  } catch {
    // Missing or corrupt file — start fresh rather than crash the request.
  }
  cache = emptyData();
  return cache;
}

/** Drop buckets older than the retention window and stale hash lists. */
function prune(data: AnalyticsData): void {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  const cutoffKey = dayKey(cutoff);

  const today = dayKey();
  const y = new Date();
  y.setUTCDate(y.getUTCDate() - 1);
  const yesterday = dayKey(y);

  for (const key of Object.keys(data.days)) {
    if (key < cutoffKey) {
      delete data.days[key];
      continue;
    }
    // The daily salt rotation makes older hashes unmatchable, so keeping them
    // costs bytes and buys nothing.
    if (key !== today && key !== yesterday) delete data.days[key].hashes;
  }
}

function flush(): void {
  if (!cache || pending === 0) return;
  try {
    prune(cache);
    fs.mkdirSync(path.dirname(analyticsFile), { recursive: true });
    // Write-then-rename so a crash mid-write cannot leave a truncated file that
    // would reset every counter to zero on next read.
    const tmp = `${analyticsFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(cache), "utf8");
    fs.renameSync(tmp, analyticsFile);
    pending = 0;
  } catch {
    // Volume hiccup — keep the buffer and retry on the next flush rather than
    // failing the beacon request.
  }
}

function scheduleFlush(): void {
  if (!exitHookInstalled && typeof process !== "undefined") {
    exitHookInstalled = true;
    process.on("beforeExit", flush);
  }
  if (pending >= FLUSH_AFTER_EVENTS) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flush();
    return;
  }
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_AFTER_MS);
  // Do not hold the process open just to write counters.
  flushTimer.unref?.();
}

/**
 * Daily-rotating salt. Derived from the date plus a server secret when one is
 * available, so the hash cannot be reversed by an attacker who merely knows the
 * date and guesses an IP.
 */
function dailySalt(day: string): string {
  const secret = process.env.AUTH_SECRET ?? process.env.WEBSITE_SITE_NAME ?? "portfolio";
  return `${day}:${secret}`;
}

function visitorHash(ip: string, userAgent: string, day: string): string {
  return crypto
    .createHash("sha256")
    .update(`${ip}|${userAgent}|${dailySalt(day)}`)
    .digest("hex")
    .slice(0, 12);
}

/** Reduce a referrer URL to a bare hostname; "direct" when absent or same-origin. */
export function normalizeReferrer(referrer: string | undefined, host: string | null): string {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    if (host && url.host === host) return "direct";
    return url.hostname.replace(/^www\./, "");
  } catch {
    return "direct";
  }
}

/** Bump a counter map, ignoring new keys once the per-day cap is reached. */
function bump(map: Record<string, number>, key: string): void {
  if (map[key] === undefined && Object.keys(map).length >= MAX_KEYS_PER_DAY) return;
  map[key] = (map[key] ?? 0) + 1;
}

/**
 * Record one page view. Returns silently on any failure — analytics must never
 * be able to break a page load.
 */
export function recordPageView(input: {
  path: string;
  referrer?: string;
  host: string | null;
  ip: string;
  userAgent: string;
}): void {
  const data = load();
  const day = dayKey();
  const bucket = (data.days[day] ??= emptyBucket());

  bucket.views += 1;
  bump(bucket.paths, input.path);
  bump(bucket.referrers, normalizeReferrer(input.referrer, input.host));

  const hash = visitorHash(input.ip, input.userAgent, day);
  bucket.hashes ??= [];
  if (!bucket.hashes.includes(hash)) {
    if (bucket.hashes.length < MAX_HASHES_PER_DAY) bucket.hashes.push(hash);
    bucket.visitors += 1;
  }

  pending += 1;
  scheduleFlush();
}

/**
 * Read the current store, including anything still buffered in memory. Admin
 * pages are `force-dynamic`, so this reflects the live counter rather than a
 * snapshot from the last flush.
 */
export function readAnalytics(): AnalyticsData {
  return load();
}

/** Exported for tests and for an explicit flush before a graceful shutdown. */
export function flushAnalytics(): void {
  flush();
}
