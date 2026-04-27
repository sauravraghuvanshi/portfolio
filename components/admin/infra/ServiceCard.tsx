"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import type { InfraService } from "@/lib/admin-infra";

const STATUS_META: Record<
  InfraService["status"],
  { label: string; color: string; dot: string }
> = {
  operational: {
    label: "Operational",
    color: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
    dot: "bg-emerald-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]",
  },
  configured: {
    label: "Partial",
    color: "bg-amber-500/10 text-amber-300 ring-amber-500/30",
    dot: "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  },
  missing: {
    label: "Missing",
    color: "bg-rose-500/10 text-rose-300 ring-rose-500/30",
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]",
  },
};

const CATEGORY_LABEL: Record<InfraService["category"], string> = {
  compute: "Compute",
  ai: "AI",
  storage: "Storage",
  monitoring: "Observability",
  cicd: "CI/CD",
  auth: "Auth",
  email: "Email",
};

export function ServiceCard({
  service,
  delay = 0,
}: {
  service: InfraService;
  delay?: number;
}) {
  const status = STATUS_META[service.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/60 p-5 transition-colors hover:border-slate-700"
    >
      {/* color accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, ${service.color}, transparent)`,
        }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: service.color }}
              aria-hidden
            />
            <p className="truncate text-sm font-semibold text-white">
              {service.name}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
            {CATEGORY_LABEL[service.category]}
            {service.region ? ` · ${service.region}` : ""}
          </p>
        </div>
        <span
          className={
            "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ring-inset " +
            status.color
          }
        >
          <span className={"h-1.5 w-1.5 rounded-full " + status.dot} />
          {status.label}
        </span>
      </div>

      {service.tier && (
        <p className="mt-3 rounded-md border border-slate-800/80 bg-slate-900/60 px-2 py-1 font-mono text-[11px] text-slate-300">
          {service.tier}
        </p>
      )}

      <p className="mt-3 text-xs text-slate-400">{service.notes}</p>

      {service.envKeys.length > 0 && (
        <ul className="mt-3 space-y-1">
          {service.envKeys.map((k) => (
            <li
              key={k.key}
              className="flex items-center justify-between gap-2 text-[11px]"
            >
              <code className="truncate text-slate-400">{k.key}</code>
              {k.present ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              )}
            </li>
          ))}
        </ul>
      )}

      {service.endpoint && (
        <div className="mt-3 border-t border-slate-800/60 pt-3">
          <Link
            href={service.endpoint}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 transition hover:text-brand-200"
          >
            Endpoint
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
