"use client";

import { useState } from "react";
import { FileText, ListChecks } from "lucide-react";
import AdvisorForm from "./AdvisorForm";
import AdvisorQuiz from "./AdvisorQuiz";

type Tab = "describe" | "quiz";

export default function AdvisorTabs() {
  const [tab, setTab] = useState<Tab>("describe");

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Advisor input mode"
        className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={tab === "describe"}
          onClick={() => setTab("describe")}
          className={
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
            (tab === "describe"
              ? "bg-brand-600 text-white"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
          }
        >
          <FileText className="w-4 h-4" aria-hidden="true" />
          Describe workload
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === "quiz"}
          onClick={() => setTab("quiz")}
          className={
            "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
            (tab === "quiz"
              ? "bg-brand-600 text-white"
              : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
          }
        >
          <ListChecks className="w-4 h-4" aria-hidden="true" />
          Take the quiz
        </button>
      </div>

      <div role="tabpanel">
        {tab === "describe" ? <AdvisorForm /> : <AdvisorQuiz />}
      </div>
    </div>
  );
}
