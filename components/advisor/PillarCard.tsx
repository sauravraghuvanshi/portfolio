"use client";

import { motion } from "framer-motion";
import { ExternalLink, AlertTriangle, Sparkles, BookOpen, Cloud } from "lucide-react";
import type { PillarAssessment } from "@/types/advisor";

function ScoreDot({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "inline-block w-2.5 h-2.5 rounded-full " +
        (filled ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-700")
      }
    />
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1" aria-label={`Score ${score} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <ScoreDot key={i} filled={i <= score} />
      ))}
      <span className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        {score}/5
      </span>
    </div>
  );
}

interface Props {
  label: string;
  pillar: PillarAssessment;
  delay?: number;
}

export default function PillarCard({ label, pillar, delay = 0 }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm"
      aria-label={`${label} pillar assessment`}
    >
      <header className="flex items-center justify-between gap-4 flex-wrap mb-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {label}
        </h3>
        <ScoreBar score={pillar.score} />
      </header>

      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        {pillar.summary}
      </p>

      {pillar.risks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
            Risks
          </h4>
          <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
            {pillar.risks.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {pillar.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            Recommendations
          </h4>
          <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
            {pillar.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {pillar.azureServices.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
            <Cloud className="w-3.5 h-3.5" aria-hidden="true" />
            Azure services
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {pillar.azureServices.map((s, i) => (
              <span
                key={i}
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {pillar.citations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Microsoft Learn
          </h4>
          <ul className="space-y-1">
            {pillar.citations.map((c, i) => (
              <li key={i}>
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                >
                  <span className="truncate max-w-[28ch]">{c.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
