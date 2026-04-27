import { getSeoMetrics } from "@/lib/admin-seo";
import {
  Search,
  ImageOff,
  AlignLeft,
  TrendingUp,
  ShieldCheck,
  FileSearch,
  Tags,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui/StatCard";
import { MotionCard } from "@/components/admin/ui/MotionCard";
import { SectionHeading } from "@/components/admin/ui/SectionHeading";
import { HealthScore } from "@/components/admin/ui/HealthScore";
import { CategoryBarChart } from "@/components/admin/charts/CategoryBarChart";
import { IssuesTable } from "@/components/admin/seo/IssuesTable";
import { ScoreBars } from "@/components/admin/seo/ScoreBars";

export const dynamic = "force-dynamic";

export default function AdminSeoPage() {
  const m = getSeoMetrics();

  const totalContent = m.totals.reduce((acc, t) => acc + t.count, 0);
  const totalCoverage = Object.values(m.coverage).reduce(
    (acc, c) => ({
      total: acc.total + c.total,
      withDescription: acc.withDescription + c.withDescription,
      withCoverImage: acc.withCoverImage + c.withCoverImage,
    }),
    { total: 0, withDescription: 0, withCoverImage: 0 }
  );
  const missingDesc = totalCoverage.total - totalCoverage.withDescription;
  const missingCover = totalCoverage.total - totalCoverage.withCoverImage;
  const highIssues = m.issues.filter((i) => i.severity === "high").length;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Search Engine Optimization
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          SEO health
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Coverage, schema and metadata diagnostics across every published surface.
          Fix high-severity issues first to improve indexing and CTR.
        </p>
      </div>

      {/* Score + headline stats */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <MotionCard className="flex flex-col items-center justify-center p-6">
          <HealthScore score={m.score} label="SEO Score" size={180} />
          <p className="mt-3 text-center text-xs text-slate-400">
            Weighted across descriptions, cover images, structured data and link
            quality.
          </p>
        </MotionCard>
        <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          <StatCard
            label="Indexed Items"
            value={totalContent}
            icon={<FileSearch />}
            accent="text-brand-400"
            delay={0.05}
          />
          <StatCard
            label="Missing descriptions"
            value={missingDesc}
            icon={<AlignLeft />}
            accent="text-amber-400"
            delay={0.1}
          />
          <StatCard
            label="Missing cover images"
            value={missingCover}
            icon={<ImageOff />}
            accent="text-rose-400"
            delay={0.15}
          />
          <StatCard
            label="High-severity issues"
            value={highIssues}
            icon={<ShieldCheck />}
            accent={highIssues === 0 ? "text-emerald-400" : "text-rose-400"}
            delay={0.2}
          />
        </div>
      </div>

      {/* Score breakdown + tags */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <MotionCard className="p-5" delay={0.05}>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Score breakdown
            </p>
            <p className="text-base font-semibold text-white">
              Contribution to weighted score
            </p>
          </div>
          <ScoreBars data={m.scoreBreakdown} />
        </MotionCard>
        <MotionCard className="p-5 xl:col-span-2" delay={0.1}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tag landscape
              </p>
              <p className="text-base font-semibold text-white">
                Top tags by frequency
              </p>
            </div>
            <Tags className="h-4 w-4 text-slate-500" />
          </div>
          {m.topTags.length > 0 ? (
            <CategoryBarChart data={m.topTags} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">
              No tags configured yet.
            </p>
          )}
        </MotionCard>
      </div>

      {/* Coverage by kind */}
      <div className="space-y-3">
        <SectionHeading
          icon={<TrendingUp />}
          title="Coverage by content kind"
          subtitle="What % of items in each surface have rich SEO metadata"
        />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(m.coverage).map(([kind, c], i) => {
            const descPct =
              c.total > 0 ? Math.round((c.withDescription / c.total) * 100) : 0;
            const coverPct =
              c.total > 0 ? Math.round((c.withCoverImage / c.total) * 100) : 0;
            return (
              <MotionCard key={kind} className="p-5" delay={i * 0.05}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold capitalize text-white">
                    {kind.replace(/-/g, " ")}
                  </p>
                  <span className="text-xs text-slate-500">{c.total} items</span>
                </div>
                <ScoreBars
                  data={[
                    {
                      name: "Description",
                      value: descPct,
                      color: "#3b82f6",
                    },
                    {
                      name: "Cover image",
                      value: coverPct,
                      color: "#22c55e",
                    },
                  ]}
                />
                {c.averageDescriptionLength > 0 && (
                  <p className="mt-3 text-[11px] text-slate-500">
                    Avg description length: {c.averageDescriptionLength} chars
                  </p>
                )}
              </MotionCard>
            );
          })}
        </div>
      </div>

      {/* Schemas + meta files */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <MotionCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Structured data
              </p>
              <p className="text-base font-semibold text-white">
                JSON-LD schemas
              </p>
            </div>
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <ul className="space-y-2">
            {m.schemas.map((s) => (
              <li
                key={s.name}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{s.name}</p>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>
                <span
                  className={
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                    (s.status === "implemented"
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-slate-700/40 text-slate-400")
                  }
                >
                  {s.status === "implemented" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </MotionCard>

        <MotionCard className="p-5">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Meta files
            </p>
            <p className="text-base font-semibold text-white">
              Crawler-facing endpoints
            </p>
          </div>
          <ul className="space-y-2">
            {m.metaFiles.map((f) => (
              <li
                key={f.name}
                className="flex items-start justify-between gap-3 rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white">{f.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {f.path} · {f.description}
                  </p>
                </div>
                {f.present ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                )}
              </li>
            ))}
          </ul>
        </MotionCard>
      </div>

      {/* Issues */}
      <div className="space-y-3">
        <SectionHeading
          icon={<ShieldCheck />}
          title="Issues to fix"
          subtitle="Sorted by severity. Click the icon to jump straight to edit."
        />
        <IssuesTable issues={m.issues} />
      </div>
    </div>
  );
}
