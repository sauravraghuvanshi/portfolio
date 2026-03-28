"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { StatCounter } from "./StatCounter";

export interface ExperienceEntry {
  company: string;
  role: string;
  period: string;
  startDate: string;
  endDate: string | null;
  icon: string;
  summary?: string;
  technologies?: string[];
  stats?: { value: string; label: string }[];
  highlights: string[];
}

function formatDateRange(start: string, end: string | null): string {
  const fmt = (d: string) => {
    const [year, month] = d.split("-");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };
  return `${fmt(start)} — ${end ? fmt(end) : "Present"}`;
}

interface TimelineCardProps {
  entry: ExperienceEntry;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}

export function TimelineCard({ entry, isExpanded, onToggle, index }: TimelineCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.15 }}
      className={`bg-white dark:bg-slate-900 border rounded-2xl shadow-sm transition-all duration-300 cursor-pointer ${
        isExpanded
          ? "border-brand-400 dark:border-brand-600 shadow-glow"
          : "border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md"
      }`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
    >
      {/* Collapsed content — always visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-snug flex items-center gap-2">
              {entry.role}
              {!entry.endDate && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/40 text-accent-600 dark:text-accent-400 text-[10px] font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500" />
                  </span>
                  Present
                </span>
              )}
            </h3>
            <p className="text-brand-600 dark:text-brand-400 text-sm font-medium mt-0.5">
              {entry.company}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
              {formatDateRange(entry.startDate, entry.endDate)}
            </p>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0 mt-1"
          >
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </motion.div>
        </div>

        {entry.summary && (
          <p className={`text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed ${
            isExpanded ? "" : "line-clamp-2"
          }`}>
            {entry.summary}
          </p>
        )}

        {/* Tech badges — always visible */}
        {entry.technologies && entry.technologies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {entry.technologies.map((tech) => (
              <Badge key={tech} variant="blue">{tech}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
              {/* Stats grid */}
              {entry.stats && entry.stats.length > 0 && (
                <div className={`grid gap-2 ${
                  entry.stats.length === 2 ? "grid-cols-2" : "grid-cols-3"
                }`}>
                  {entry.stats.map((stat) => (
                    <StatCounter key={stat.label} value={stat.value} label={stat.label} />
                  ))}
                </div>
              )}

              {/* Highlights */}
              <ul className="space-y-2" role="list">
                {entry.highlights.map((h, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
