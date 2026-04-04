"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageWithShimmer from "@/components/ui/ImageWithShimmer";
import Link from "next/link";
import { ArrowRight, MapPin, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Event } from "@/lib/content";

interface EventsGridProps {
  events: Event[];
  cityFilter?: string | null;
  onClearCity?: () => void;
}

const topicVariant: Record<string, "blue" | "green" | "purple" | "orange" | "red"> = {
  Azure:           "blue",
  "AI & ML":       "purple",
  "Generative AI": "purple",
  DevOps:          "green",
  AWS:             "orange",
  "Cloud Native":  "blue",
  Community:       "green",
  Cloud:           "blue",
};

const coverPos: Record<string, string> = {
  top:    "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

export default function EventsGrid({ events, cityFilter, onClearCity }: EventsGridProps) {
  const [activeFormat, setActiveFormat] = useState("All");
  const [activeTopic,  setActiveTopic]  = useState("All");
  const [search,       setSearch]       = useState("");

  const formats = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.format))).sort()],
    [events]
  );
  const topics = useMemo(
    () => ["All", ...Array.from(new Set(events.map((e) => e.topic))).sort()],
    [events]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return events.filter((e) => {
      if (cityFilter === "virtual" && e.location) return false;
      if (cityFilter && cityFilter !== "virtual" && e.location?.city !== cityFilter) return false;
      if (activeFormat !== "All" && e.format !== activeFormat) return false;
      if (activeTopic  !== "All" && e.topic !== activeTopic) return false;
      if (q && !e.title.toLowerCase().includes(q) &&
               !e.tags.some((t) => t.toLowerCase().includes(q)) &&
               !e.summary.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, activeFormat, activeTopic, search, cityFilter]);

  const hasActiveFilters = activeFormat !== "All" || activeTopic !== "All" || search !== "" || !!cityFilter;

  function resetFilters() {
    setActiveFormat("All");
    setActiveTopic("All");
    setSearch("");
    onClearCity?.();
  }

  return (
    <div>
      {/* City filter chip */}
      {cityFilter && (
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800 rounded-full text-sm text-brand-700 dark:text-brand-300">
            <MapPin className="w-3.5 h-3.5" />
            Showing {cityFilter === "virtual" ? "virtual" : cityFilter} events
            <button
              onClick={onClearCity}
              className="ml-1 p-0.5 rounded-full hover:bg-brand-200 dark:hover:bg-brand-800 transition-colors"
              aria-label="Clear city filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        </div>
      )}
      {/* Search */}
      <div className="relative max-w-md mx-auto mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events, topics…"
          aria-label="Search events"
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-10">
        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Filter by format">
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFormat(f)}
              aria-pressed={activeFormat === f}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                activeFormat === f
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Filter by topic">
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTopic(t)}
              aria-pressed={activeTopic === t}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                activeTopic === t
                  ? "bg-accent-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-accent-300 dark:hover:border-accent-600 hover:text-accent-600 dark:hover:text-accent-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Results count + clear */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </p>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-sm text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((event, i) => (
            <motion.article
              key={event.slug}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              {/* Cover */}
              {event.coverImage ? (
                <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <ImageWithShimmer
                    src={event.coverImage}
                    alt={`${event.title} cover`}
                    fill
                    className={`object-cover ${coverPos[event.coverImagePosition ?? "top"] ?? "object-top"} group-hover:scale-105 transition-transform duration-500`}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-950/50 dark:to-accent-950/50 flex items-center justify-center">
                  <span className="text-5xl font-bold gradient-text opacity-20 select-none">
                    {event.title.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Body */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant={topicVariant[event.topic] ?? "blue"}>{event.topic}</Badge>
                  <Badge variant="default">{event.format}</Badge>
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-sm">
                  {event.title}
                </h3>

                {event.summary && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1 line-clamp-3">
                    {event.summary}
                  </p>
                )}

                <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                  <Link
                    href={`/events/${event.slug}`}
                    className="inline-flex items-center gap-1.5 text-brand-600 dark:text-brand-400 text-xs font-semibold hover:gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                    aria-label={`View ${event.title} details`}
                  >
                    View Event
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            No events match your filters.{" "}
            <button
              onClick={resetFilters}
              className="text-brand-600 dark:text-brand-400 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
            >
              Clear filters
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
