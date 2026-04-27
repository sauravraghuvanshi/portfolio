"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { SeoIssue } from "@/lib/admin-seo";

const META = {
  high: {
    icon: AlertTriangle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    label: "High",
  },
  medium: {
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Medium",
  },
  low: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    label: "Low",
  },
} as const;

export function IssuesTable({ issues }: { issues: SeoIssue[] }) {
  if (issues.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <p className="text-base font-semibold text-emerald-300">All clear</p>
        <p className="mt-1 text-sm text-slate-400">
          No SEO issues detected across content.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40">
      <div className="grid grid-cols-[88px_120px_minmax(0,1fr)_56px] gap-3 border-b border-slate-800/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span>Severity</span>
        <span>Kind</span>
        <span>Issue</span>
        <span className="text-right">Fix</span>
      </div>
      <ul className="divide-y divide-slate-800/60">
        {issues.map((issue, i) => {
          const meta = META[issue.severity];
          const Icon = meta.icon;
          return (
            <motion.li
              key={`${issue.kind}-${issue.title}-${i}`}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.25 }}
              className="grid grid-cols-[88px_120px_minmax(0,1fr)_56px] items-center gap-3 px-4 py-3 text-sm transition hover:bg-slate-800/30"
            >
              <span
                className={
                  "inline-flex w-fit items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                  meta.bg +
                  " " +
                  meta.color +
                  " " +
                  meta.border
                }
              >
                <Icon className="h-3 w-3" />
                {meta.label}
              </span>
              <span className="text-xs text-slate-400">{issue.kind}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{issue.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {issue.message}
                </p>
              </div>
              <div className="text-right">
                {issue.href && (
                  <Link
                    href={issue.href}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
