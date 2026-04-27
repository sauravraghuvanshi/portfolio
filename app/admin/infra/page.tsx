import { getInfraMetrics } from "@/lib/admin-infra";
import {
  Server,
  GitBranch,
  GitCommit,
  Calendar,
  Hexagon,
  Layers,
  Workflow,
  Boxes,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/admin/ui/StatCard";
import { MotionCard } from "@/components/admin/ui/MotionCard";
import { SectionHeading } from "@/components/admin/ui/SectionHeading";
import { ServiceCard } from "@/components/admin/infra/ServiceCard";
import { PipelineFlow } from "@/components/admin/infra/PipelineFlow";

export const dynamic = "force-dynamic";

export default function AdminInfraPage() {
  const m = getInfraMetrics();

  const operational = m.services.filter((s) => s.status === "operational").length;
  const partial = m.services.filter((s) => s.status === "configured").length;
  const missing = m.services.filter((s) => s.status === "missing").length;
  const regions = new Set(m.services.map((s) => s.region).filter(Boolean)).size;

  const builtAt = new Date(m.buildInfo.builtAt);
  const builtAtStr = isNaN(builtAt.getTime())
    ? m.buildInfo.builtAt
    : builtAt.toLocaleString();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">
          Platform &amp; Operations
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
          Infrastructure
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          Live snapshot of every Azure dependency, build pipeline and runtime
          configuration powering the portfolio.
        </p>
      </div>

      {/* Build info banner */}
      <MotionCard className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-6">
        <BuildField icon={Hexagon} label="Node" value={m.buildInfo.nodeVersion} />
        <BuildField
          icon={Boxes}
          label="Next.js"
          value={`v${m.buildInfo.nextVersion}`}
        />
        <BuildField
          icon={GitCommit}
          label="Commit"
          value={m.buildInfo.commit}
          mono
        />
        <BuildField
          icon={GitBranch}
          label="Branch"
          value={m.buildInfo.branch}
          mono
        />
        <BuildField
          icon={Activity}
          label="Environment"
          value={m.buildInfo.environment}
          mono
        />
        <BuildField icon={Calendar} label="Built" value={builtAtStr} />
      </MotionCard>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Total services"
          value={m.services.length}
          icon={<Server />}
          accent="text-brand-400"
          delay={0}
        />
        <StatCard
          label="Env coverage"
          value={m.envCoverage.configured}
          suffix={` / ${m.envCoverage.total}`}
          icon={<CheckCircle2 />}
          accent="text-emerald-400"
          delay={0.05}
        />
        <StatCard
          label="Operational"
          value={operational}
          icon={<CheckCircle2 />}
          accent="text-emerald-400"
          delay={0.1}
        />
        <StatCard
          label="Need attention"
          value={partial + missing}
          icon={<AlertTriangle />}
          accent={partial + missing === 0 ? "text-emerald-400" : "text-amber-400"}
          delay={0.15}
        />
      </div>

      {/* Pipeline */}
      <div className="space-y-3">
        <SectionHeading
          icon={<Workflow />}
          title="Deployment pipeline"
          subtitle="GitHub Actions → Kudu zip deploy → Azure App Service"
        />
        <MotionCard className="p-5">
          <PipelineFlow stages={m.pipeline} />
        </MotionCard>
      </div>

      {/* Services grid */}
      <div className="space-y-3">
        <SectionHeading
          icon={<Server />}
          title="Services"
          subtitle={`${operational} operational · ${partial} partial · ${missing} missing across ${regions} region${regions === 1 ? "" : "s"}`}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {m.services.map((s, i) => (
            <ServiceCard key={s.id} service={s} delay={i * 0.05} />
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="space-y-3">
        <SectionHeading
          icon={<Layers />}
          title="Tech stack"
          subtitle="Frameworks and libraries powering this surface"
        />
        <MotionCard className="overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,2fr)] gap-3 border-b border-slate-800/80 bg-slate-900/40 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <span>Name</span>
            <span>Version</span>
            <span>Role</span>
          </div>
          <ul className="divide-y divide-slate-800/60">
            {m.techStack.map((t) => (
              <li
                key={t.name}
                className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,2fr)] items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-slate-800/30"
              >
                <span className="font-medium text-white">{t.name}</span>
                <span className="font-mono text-xs text-slate-400">
                  {t.version ?? "—"}
                </span>
                <span className="text-xs text-slate-400">{t.role}</span>
              </li>
            ))}
          </ul>
        </MotionCard>
      </div>
    </div>
  );
}

function BuildField({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p
        className={
          "mt-1 truncate text-sm text-white " + (mono ? "font-mono" : "")
        }
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
