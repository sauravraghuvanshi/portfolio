import { getAdminMetrics } from "@/lib/admin-metrics";
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

  const totalContent =
    m.totals.blog +
    m.totals["case-study"] +
    m.totals.project +
    m.totals.talk +
    m.totals.event +
    m.totals.certification +
    m.radarCount;

  const lastYear = m.timeline.at(-1);
  const prevYear = m.timeline.at(-2);
  const yoyDelta =
    lastYear && prevYear
      ? lastYear.Blogs +
        lastYear["Case Studies"] +
        lastYear.Projects +
        lastYear.Events +
        lastYear.Certs -
        (prevYear.Blogs +
          prevYear["Case Studies"] +
          prevYear.Projects +
          prevYear.Events +
          prevYear.Certs)
      : 0;

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
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Total Content"
          value={totalContent}
          delta={yoyDelta}
          deltaLabel="YoY"
          icon={<Activity />}
          accent="text-brand-400"
          delay={0}
          sparkline={m.timeline.map(
            (t) =>
              t.Blogs +
              t["Case Studies"] +
              t.Projects +
              t.Events +
              t.Certs,
          )}
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
      </div>

      {/* Per-kind cards */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-7">
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
          label="Tech Radar"
          value={m.radarCount}
          icon={<Crosshair />}
          accent="text-teal-400"
          delay={0.35}
        />
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
          <ContentTimelineChart data={m.timeline} />
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
