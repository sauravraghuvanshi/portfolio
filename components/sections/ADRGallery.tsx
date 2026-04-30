"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { ADREntry, ADRGallery, ADRStatus, WAFPillar } from "@/lib/content";

// ---------- constants --------------------------------------------------------

const WAF_PILLARS: Array<WAFPillar | "all"> = [
  "all",
  "reliability",
  "security",
  "cost-optimization",
  "operational-excellence",
  "performance-efficiency",
];

const WAF_LABEL: Record<WAFPillar | "all", string> = {
  all: "All",
  reliability: "Reliability",
  security: "Security",
  "cost-optimization": "Cost Optimization",
  "operational-excellence": "Operational Excellence",
  "performance-efficiency": "Performance Efficiency",
};

const WAF_COLORS: Record<WAFPillar, { bg: string; text: string; border: string }> = {
  reliability: {
    bg: "bg-blue-100 dark:bg-blue-950",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  security: {
    bg: "bg-rose-100 dark:bg-rose-950",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
  "cost-optimization": {
    bg: "bg-green-100 dark:bg-green-950",
    text: "text-green-700 dark:text-green-300",
    border: "border-green-200 dark:border-green-800",
  },
  "operational-excellence": {
    bg: "bg-purple-100 dark:bg-purple-950",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  "performance-efficiency": {
    bg: "bg-orange-100 dark:bg-orange-950",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
  },
};

const STATUS_COLORS: Record<ADRStatus, string> = {
  accepted: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  proposed: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
  deprecated: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  superseded: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ---------- main component ---------------------------------------------------

export default function ADRGallery({ gallery }: { gallery: ADRGallery }) {
  const [filter, setFilter] = useState<WAFPillar | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered =
    filter === "all"
      ? gallery.entries
      : gallery.entries.filter((e) => e.wafPillars.includes(filter));

  const selected = selectedId
    ? gallery.entries.find((e) => e.id === selectedId) ?? null
    : null;

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {gallery.entries.length} decisions recorded
          </span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          Updated {gallery.publishedAt}
        </span>
      </div>

      {/* WAF filter chips */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by WAF pillar">
        {WAF_PILLARS.map((pillar) => {
          const count =
            pillar === "all"
              ? gallery.entries.length
              : gallery.entries.filter((e) => e.wafPillars.includes(pillar)).length;
          const active = filter === pillar;
          return (
            <button
              key={pillar}
              type="button"
              onClick={() => setFilter(pillar)}
              aria-pressed={active}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {WAF_LABEL[pillar]}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <motion.div
        key={filter}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {filtered.map((entry) => (
          <ADRCard key={entry.id} entry={entry} onClick={() => setSelectedId(entry.id)} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-slate-500 dark:text-slate-400 text-center py-12">
          No decisions match this filter.
        </p>
      )}

      {/* Detail drawer */}
      <Drawer entry={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// ---------- card -------------------------------------------------------------

function ADRCard({ entry, onClick }: { entry: ADREntry; onClick: () => void }) {
  return (
    <motion.article
      variants={fadeUp}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`ADR-${String(entry.number).padStart(3, "0")}: ${entry.title}`}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-brand-400 dark:hover:border-brand-600 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      {/* ADR number + status row */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
          ADR-{String(entry.number).padStart(3, "0")}
        </span>
        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[entry.status]}`}>
          {entry.status}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {entry.title}
      </h3>

      {/* Context excerpt */}
      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
        {entry.context}
      </p>

      {/* WAF pillar badges */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {entry.wafPillars.map((pillar) => {
          const c = WAF_COLORS[pillar];
          return (
            <span
              key={pillar}
              className={`px-2 py-0.5 rounded border text-[11px] font-medium ${c.bg} ${c.text} ${c.border}`}
            >
              {WAF_LABEL[pillar]}
            </span>
          );
        })}
      </div>

      {/* Footer: date + CTA */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-slate-500">{entry.date}</span>
        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium group-hover:underline">
          View decision →
        </span>
      </div>
    </motion.article>
  );
}

// ---------- detail drawer ----------------------------------------------------

function Drawer({ entry, onClose }: { entry: ADREntry | null; onClose: () => void }) {
  const open = !!entry;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && entry && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="adr-drawer-title"
        >
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wider">
                    ADR-{String(entry.number).padStart(3, "0")}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wide ${STATUS_COLORS[entry.status]}`}>
                    {entry.status}
                  </span>
                </div>
                <h2
                  id="adr-drawer-title"
                  className="text-xl font-bold text-slate-900 dark:text-white leading-snug"
                >
                  {entry.title}
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {entry.wafPillars.map((pillar) => {
                    const c = WAF_COLORS[pillar];
                    return (
                      <span
                        key={pillar}
                        className={`px-2 py-0.5 rounded border text-[11px] font-medium ${c.bg} ${c.text} ${c.border}`}
                      >
                        {WAF_LABEL[pillar]}
                      </span>
                    );
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="flex-shrink-0 p-2 -m-2 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              <DrawerSection label="Context" content={entry.context} />

              {entry.options.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Options Considered
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {entry.options.map((opt) => (
                      <li
                        key={opt}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {opt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h3 className="text-xs uppercase tracking-wider font-semibold text-brand-600 dark:text-brand-400 mb-2">
                  Decision
                </h3>
                <p className="text-sm font-semibold text-slate-900 dark:text-white bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg px-4 py-3">
                  {entry.decision}
                </p>
              </div>

              <DrawerSection label="Rationale" content={entry.rationale} />
              <DrawerSection label="Trade-offs" content={entry.tradeoffs} labelColor="text-amber-600 dark:text-amber-400" />
              <DrawerSection label="Outcome" content={entry.outcome} labelColor="text-emerald-600 dark:text-emerald-400" />

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {entry.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
                Recorded {entry.date}
              </p>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DrawerSection({
  label,
  content,
  labelColor = "text-slate-500 dark:text-slate-400",
}: {
  label: string;
  content: string;
  labelColor?: string;
}) {
  return (
    <div>
      <h3 className={`text-xs uppercase tracking-wider font-semibold mb-2 ${labelColor}`}>
        {label}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{content}</p>
    </div>
  );
}
