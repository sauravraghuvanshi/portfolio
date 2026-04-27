"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const STATUS_META = {
  ok: { color: "text-emerald-400", border: "border-emerald-500/40", bg: "bg-emerald-500/10", Icon: CheckCircle2 },
  warn: { color: "text-amber-400", border: "border-amber-500/40", bg: "bg-amber-500/10", Icon: AlertTriangle },
  error: { color: "text-rose-400", border: "border-rose-500/40", bg: "bg-rose-500/10", Icon: XCircle },
} as const;

interface Stage {
  id: string;
  label: string;
  status: "ok" | "warn" | "error";
  detail: string;
}

export function PipelineFlow({ stages }: { stages: Stage[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
      {stages.map((s, i) => {
        const m = STATUS_META[s.status];
        const Icon = m.Icon;
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className={"contents md:contents"}
          >
            <div
              className={
                "rounded-xl border p-3.5 " +
                m.border +
                " " +
                m.bg +
                " md:col-span-1"
              }
            >
              <div className="flex items-center gap-2">
                <Icon className={"h-4 w-4 " + m.color} />
                <p className="text-sm font-semibold text-white">{s.label}</p>
              </div>
              <p className="mt-1 text-xs text-slate-400">{s.detail}</p>
            </div>
            {i < stages.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.2 }}
                className="hidden items-center justify-center text-slate-600 md:flex"
                aria-hidden
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
