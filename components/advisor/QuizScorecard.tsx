"use client";

import { motion } from "framer-motion";
import { Sparkles, RotateCcw } from "lucide-react";
import type { QuizScores } from "@/types/advisor";
import { PILLAR_KEYS, PILLAR_LABELS } from "@/types/advisor";
import { overallScore } from "@/lib/advisor/quiz-scoring";

interface Props {
  scores: QuizScores;
  onDeepDive: () => void;
  onRestart: () => void;
  deepDiveDisabled?: boolean;
}

function ScoreDot({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={
        "inline-block w-2 h-2 rounded-full " +
        (filled ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-700")
      }
    />
  );
}

export default function QuizScorecard({ scores, onDeepDive, onRestart, deepDiveDisabled }: Props) {
  const overall = overallScore(scores);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <section className="rounded-2xl border border-brand-200 dark:border-brand-900/50 bg-gradient-to-br from-brand-50 to-white dark:from-brand-950/40 dark:to-slate-900/60 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Your quiz scorecard
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-brand-600 dark:text-brand-400">{overall}</span>
            <span className="text-base text-slate-500 dark:text-slate-400">/ 5</span>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Rubric-based, computed instantly from your answers. The AI deep-dive below adds Microsoft Learn
          citations, specific Azure services, and a downloadable ADR.
        </p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {PILLAR_KEYS.map((key) => {
          const score = scores[key];
          return (
            <div
              key={key}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4"
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {PILLAR_LABELS[key]}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1" aria-label={`Score ${score} of 5`}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <ScoreDot key={i} filled={i <= score} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{score}/5</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onDeepDive}
          disabled={deepDiveDisabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          Get AI deep-dive (citations + ADR)
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Start over
        </button>
      </div>
    </motion.div>
  );
}
