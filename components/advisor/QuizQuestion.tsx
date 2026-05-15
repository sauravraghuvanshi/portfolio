"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { QuizQuestion } from "@/types/advisor";
import { PILLAR_LABELS } from "@/types/advisor";

interface Props {
  question: QuizQuestion;
  number: number;
  selectedIndex: number | undefined;
  onSelect: (index: number) => void;
}

export default function QuizQuestion({ question, number, selectedIndex, onSelect }: Props) {
  return (
    <motion.fieldset
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5"
    >
      <legend className="px-2 -ml-2 text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
        Q{number} · {PILLAR_LABELS[question.pillar]}
      </legend>
      <p className="text-sm font-medium text-slate-900 dark:text-white mb-3 mt-1">
        {question.question}
      </p>
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const selected = selectedIndex === i;
          return (
            <label
              key={i}
              className={
                "flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors " +
                (selected
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950/30 dark:border-brand-500/70"
                  : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40")
              }
            >
              <input
                type="radio"
                name={question.id}
                value={i}
                checked={selected}
                onChange={() => onSelect(i)}
                className="mt-0.5 accent-brand-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 leading-snug flex-1">
                {opt.label}
              </span>
              {selected && (
                <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
              )}
            </label>
          );
        })}
      </div>
    </motion.fieldset>
  );
}
