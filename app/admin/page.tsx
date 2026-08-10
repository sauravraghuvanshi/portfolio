import Link from "next/link";
import { getAdminMetrics } from "@/lib/admin-metrics";
import { getAnalyticsMetrics, WINDOW_DAYS } from "@/lib/admin-analytics";
import {
  FileText,
  BookOpen,
  FolderKanban,
  Video,
  Calendar,
  Award,
  Eye,
  Sparkles,
  Activity,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Crosshair,
  Scale,
  Timer,
  Users,
  Gauge,
  MousePointerClick,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui/StatCard";
import { MotionCard } from "@/components/admin/ui/MotionCard";
import { SectionHeading } from "@/components/admin/ui/SectionHeading";
import { ContentTimelineChart } from "@/components/admin/charts/ContentTimelineChart";
import { StatusDonut } from "@/components/admin/charts/StatusDonut";
import { CategoryBarChart } from "@/components/admin/charts/CategoryBarChart";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  const m = getAdminMetrics();
  const a = getAnalyticsMetrics();

  // Sum every series in a timeline row. Derived from the row itself rather than
  // a hand-written list of kinds, so adding a series in `admin-metrics.ts`
  // cannot silently leave this total behind.
  const rowTotal = (row: (typeof m.timeline)[number] | undefined) =>
    row
      ? Object.entries(row).reduce(
          (sum, [key, value]) =>
            key === "year" || typeof value !== "number" ? sum : sum + value,
          0,
        )
      : 0;

  const totalSparkline = m.timeline.map(rowTotal);
  const yoyDelta = rowTotal(m.timeline.at(-1)) - rowTotal(m.timeline.at(-2));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            Overview
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Live snapshot of every content surface. Click a card to drill in.
          </p>
        </div>
      </div>

      {/* Hero stat row */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-5">
        <StatCard
          label="Total Content"
          value={m.totalContent}
          delta={yoyDelta}
          deltaLabel="YoY"
          icon={<Activity />}
          accent="text-brand-400"
          delay={0}
          sparkline={totalSparkline}
        />
        <StatCard
          label="Published"
          value={m.totalPublished}
          icon={<Eye />}
          accent="text-emerald-400"
          delay={0.05}
        />
        <StatCard
          label="Drafts"
          value={m.totalDrafts}
          icon={<Clock />}
          accent="text-yellow-400"
          delay={0.1}
        />
        <StatCard
          label="Featured"
          value={m.totalFeatured}
          icon={<Sparkles />}
          accent="text-amber-400"
          delay={0.15}
        />
        <StatCard
          label="Blog Reading"
          value={m.blogReadingMinutes}
          suffix=" min"
          icon={<Timer />}
          accent="text-sky-400"
          delay={0.2}
        />
      </div>

      {/* Per-kind cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Blogs"
          value={m.totals.blog}
          icon={<FileText />}
          accent="text-sky-400"
          sparkline={m.sparklines.blog}
          delay={0.05}
        />
        <StatCard
          label="Case Studies"
          value={m.totals["case-study"]}
          icon={<BookOpen />}
          accent="text-cyan-400"
          sparkline={m.sparklines["case-study"]}
          delay={0.1}
        />
        <StatCard
          label="Projects"
          value={m.totals.project}
          icon={<FolderKanban />}
          accent="text-violet-400"
          sparkline={m.sparklines.project}
          delay={0.15}
        />
        {/* Talks and Tech Radar carry no per-item date, so they get no sparkline. */}
        <StatCard
          label="Talks"
          value={m.totals.talk}
          icon={<Video />}
          accent="text-pink-400"
          delay={0.2}
        />
        <StatCard
          label="Events"
          value={m.totals.event}
          icon={<Calendar />}
          accent="text-orange-400"
          sparkline={m.sparklines.event}
          delay={0.25}
        />
        <StatCard
          label="Certs"
          value={m.totals.certification}
          icon={<Award />}
          accent="text-emerald-400"
          sparkline={m.sparklines.certification}
          delay={0.3}
        />
        <StatCard
          label="Decisions"
          value={m.totals.decision}
          icon={<Scale />}
          accent="text-yellow-400"
          sparkline={m.sparklines.decision}
          delay={0.35}
        />
        <StatCard
          label="Tech Radar"
          value={m.totals.radar}
          icon={<Crosshair />}
          accent="text-teal-400"
          delay={0.4}
        />
      </div>

      {/* Traffic — first-party page views. Full breakdown lives on
          /admin/analytics; this row is the at-a-glance summary. */}
      <div className="space-y-3">
        <SectionHeading
          icon={<Gauge />}
          title="Traffic"
          subtitle={`First-party page views · last ${WINDOW_DAYS} days`}
          action={
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-500/50 hover:text-white"
            >
              View analytics
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        {a.hasData ? (
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
            <StatCard
              label={`Views (${WINDOW_DAYS}d)`}
              value={a.views30d}
              delta={a.viewsDelta}
              deltaLabel="vs prev"
              icon={<Eye />}
              accent="text-brand-400"
              sparkline={a.sparkline}
              delay={0}
            />
            <StatCard
              label={`Visitors (${WINDOW_DAYS}d)`}
              value={a.uniqueVisitors30d}
              delta={a.visitorsDelta}
              deltaLabel="vs prev"
              icon={<Users />}
              accent="text-emerald-400"
              delay={0.05}
            />
            <StatCard
              label="Views today"
              value={a.viewsToday}
              icon={<Activity />}
              accent="text-amber-400"
              delay={0.1}
            />
            {/* Top page is a path, not a number, so it cannot use StatCard
                (whose `value` is strictly numeric) — same shell, text value. */}
            <MotionCard delay={0.15} hoverable className="p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 text-violet-400 [&_svg]:h-4 [&_svg]:w-4">
                  <MousePointerClick />
                </div>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Top page
                </p>
              </div>
              <p className="mt-3 truncate text-xl font-bold text-white">
                {a.topPage?.name ?? "—"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {a.topPage ? `${a.topPage.value} views` : "No views yet"}
              </p>
            </MotionCard>
          </div>
        ) : (
          <MotionCard className="p-6 text-center">
            <p className="text-base font-semibold text-white">
              Collecting since {a.startedAt}
            </p>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-400">
              No page views recorded yet. There is no historical data to
              backfill — numbers appear as soon as a visitor lands on a public
              page.
            </p>
          </MotionCard>
        )}
      </div>

      {/* Quick actions */}
      <div className="space-y-3">
        <SectionHeading
          icon={<Sparkles />}
          title="Quick actions"
          subtitle="Most common admin entry points"
        />
        <QuickActions />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <MotionCard className="p-5 xl:col-span-2" delay={0.1}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Publishing Timeline
              </p>
              <p className="text-base font-semibold text-white">
                Output by year, all surfaces
              </p>
            </div>
            <BarChart3 className="h-4 w-4 text-slate-500" />
          </div>
          <ContentTimelineChart data={m.timeline} series={m.timelineSeries} />
        </MotionCard>
        <MotionCard className="p-5" delay={0.15}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Content Mix
              </p>
              <p className="text-base font-semibold text-white">By kind</p>
            </div>
            <PieIcon className="h-4 w-4 text-slate-500" />
          </div>
          <StatusDonut data={m.contentMix} centerLabel="Items" />
        </MotionCard>
      </div>

      {/* Lower row: status donut + categories */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <MotionCard className="p-5" delay={0.1}>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </p>
            <p className="text-base font-semibold text-white">
              Published vs draft
            </p>
          </div>
          <StatusDonut data={m.statusBreakdown} centerLabel="Total" />
        </MotionCard>
        <MotionCard className="p-5 xl:col-span-2" delay={0.15}>
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Top Categories
            </p>
            <p className="text-base font-semibold text-white">
              Tagged across blogs, case studies and projects
            </p>
          </div>
          {m.categoryDistribution.length > 0 ? (
            <CategoryBarChart data={m.categoryDistribution} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">
              No categories yet.
            </p>
          )}
        </MotionCard>
      </div>

      {/* Recent activity */}
      <div className="space-y-3">
        <SectionHeading
          icon={<Activity />}
          title="Recent activity"
          subtitle="Newest items across every content type"
        />
        <ActivityFeed items={m.recent} />
      </div>
    </div>
  );
}
