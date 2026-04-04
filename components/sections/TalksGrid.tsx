"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import YouTubeEmbed from "@/components/ui/YouTubeEmbed";
import type { Talk } from "@/lib/content";

const topicColors: Record<string, "blue" | "green" | "purple" | "orange" | "red"> = {
  "GitHub Copilot": "purple",
  "Cloud Fundamentals": "blue",
  "Azure AI": "orange",
  "AZ-104": "blue",
  "DevOps": "green",
};

export default function TalksGrid({ talks }: { talks: Talk[] }) {
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const topics = ["All", ...Array.from(new Set(talks.map((t) => t.topic)))];
  const filtered =
    activeFilter === "All" ? talks : talks.filter((t) => t.topic === activeFilter);

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-10" role="group" aria-label="Filter by topic">
        {topics.map((topic) => (
          <button
            key={topic}
            onClick={() => setActiveFilter(topic)}
            aria-pressed={activeFilter === topic}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeFilter === topic
                ? "bg-brand-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {topic}
            {topic !== "All" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({talks.filter((t) => t.topic === topic).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((talk, i) => (
            <motion.div
              key={talk.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className={`flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all duration-300${talk.featured ? " gradient-border" : ""}`}
            >
              <YouTubeEmbed videoId={talk.id} title={talk.title} priority={i === 0} />
              <div className="flex items-center justify-between gap-2">
                <Badge variant={topicColors[talk.topic] ?? "blue"}>
                  {talk.topic}
                </Badge>
                <Link
                  href={`https://youtube.com/watch?v=${talk.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-brand-500 dark:text-slate-500 dark:hover:text-brand-400 flex items-center gap-1 transition-colors"
                  aria-label={`Watch ${talk.title} on YouTube`}
                >
                  YouTube <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </Link>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                {talk.title}
              </p>
              {talk.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {talk.description}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </>
  );
}
