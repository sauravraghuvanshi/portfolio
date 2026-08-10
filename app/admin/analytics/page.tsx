import {
  Eye,
  Users,
  CalendarDays,
  Sigma,
  LineChart,
  FileBarChart,
  Link2,
  ShieldCheck,
} from "lucide-react";
import { getAnalyticsMetrics, WINDOW_DAYS } from "@/lib/admin-analytics";
import { StatCard } from "@/components/admin/ui/StatCard";
import { MotionCard } from "@/components/admin/ui/MotionCard";
import { SectionHeading } from "@/components/admin/ui/SectionHeading";
import { ContentTimelineChart } from "@/components/admin/charts/ContentTimelineChart";
import { CategoryBarChart } from "@/components/admin/charts/CategoryBarChart";

// Traffic is buffered in memory and flushed debounced, so a cached render would
// show stale counters. Matches `/admin` and `/admin/seo`.
export const dynamic = "force-dynamic";

const TREND_SERIES = [
  { key: "views", color: "#60a5fa" },
  { key: "visitors", color: "#34d399" },
];

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

export default function AnalyticsPage() {
  const a = getAnalyticsMetrics();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Traffic
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          First-party page views. No cookies, no third-party trackers, no raw IP
          addresses stored.
        </p>
      </div>

      {!a.hasData ? (
        <MotionCard className="p-10 text-center">
          <LineChart className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-base font-semibold text-white">
            Collecting since {formatDay(a.startedAt)}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            No page views recorded yet. Counting began the day this feature
            shipped — there is no historical data to backfill, so the first
            numbers will appear as soon as a visitor lands on a public page.
          </p>
        </MotionCard>
      ) : (
        <>
          {/* Traffic stats */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label={`Views (${WINDOW_DAYS}d)`}
              value={a.views30d}
              delta={a.viewsDelta}
              deltaLabel={`vs prev ${WINDOW_DAYS}d`}
              icon={<Eye />}
              accent="text-brand-400"
              sparkline={a.sparkline}
              delay={0}
            />
            <StatCard
              label={`Visitors (${WINDOW_DAYS}d)`}
              value={a.uniqueVisitors30d}
              delta={a.visitorsDelta}
              deltaLabel={`vs prev ${WINDOW_DAYS}d`}
              icon={<Users />}
              accent="text-emerald-400"
              delay={0.05}
            />
            <StatCard
              label="Views today"
              value={a.viewsToday}
              icon={<CalendarDays />}
              accent="text-amber-400"
              delay={0.1}
            />
            <StatCard
              label="All-time views"
              value={a.totalViews}
              icon={<Sigma />}
              accent="text-violet-400"
              delay={0.15}
            />
          </div>

          {/* Trend */}
          <MotionCard className="p-5" delay={0.1}>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Traffic Trend
                </p>
                <p className="text-base font-semibold text-white">
                  Views and visitors, last {WINDOW_DAYS} days
                </p>
              </div>
              <LineChart className="h-4 w-4 text-slate-500" />
            </div>
            <ContentTimelineChart
              data={a.trend}
              series={TREND_SERIES}
              xKey="label"
            />
          </MotionCard>

          {/* Top pages + referrers */}
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <MotionCard className="p-5" delay={0.15}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Top Pages
                  </p>
                  <p className="text-base font-semibold text-white">
                    Most viewed in the last {WINDOW_DAYS} days
                  </p>
                </div>
                <FileBarChart className="h-4 w-4 text-slate-500" />
              </div>
              {a.topPages.length > 0 ? (
                <CategoryBarChart data={a.topPages} />
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                  No page views in this window.
                </p>
              )}
            </MotionCard>

            <MotionCard className="p-5" delay={0.2}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Top Referrers
                  </p>
                  <p className="text-base font-semibold text-white">
                    Where visitors arrived from
                  </p>
                </div>
                <Link2 className="h-4 w-4 text-slate-500" />
              </div>
              {a.topReferrers.length > 0 ? (
                <CategoryBarChart data={a.topReferrers} />
              ) : (
                <p className="py-12 text-center text-sm text-slate-500">
                  No referrer data in this window.
                </p>
              )}
            </MotionCard>
          </div>
        </>
      )}

      {/* Methodology — states the limits rather than letting the numbers imply
          more precision than they have. */}
      <div className="space-y-3">
        <SectionHeading
          icon={<ShieldCheck />}
          title="How these numbers work"
          subtitle="Worth knowing before quoting them anywhere"
        />
        <MotionCard className="p-5" delay={0.1}>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <span className="text-slate-200">Collecting since</span>{" "}
              {formatDay(a.startedAt)} — nothing before that date exists, because
              no analytics were ever configured previously.
            </li>
            <li>
              <span className="text-slate-200">Visitors</span> are counted per
              day from a salted hash of IP + user agent, with the salt rotating
              daily. Totals across a window sum the daily figures, so one person
              visiting on three days counts three times.
            </li>
            <li>
              <span className="text-slate-200">Admin traffic is excluded</span> —
              anything under <code className="text-slate-300">/admin</code>,{" "}
              <code className="text-slate-300">/api</code> or{" "}
              <code className="text-slate-300">/_next</code> is never recorded.
            </li>
            <li>
              <span className="text-slate-200">Self-declared bots</span> are
              filtered by user agent, and repeat views of the same path within
              one browsing session are counted once.
            </li>
            <li>
              History is retained for 90 days; older daily buckets are pruned.
            </li>
          </ul>
        </MotionCard>
      </div>
    </div>
  );
}
