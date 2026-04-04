"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import YouTubeEmbed from "@/components/ui/YouTubeEmbed";
import type { Talk } from "@/lib/content";

interface FeaturedTalksProps {
  talks: Talk[];
}

const topicColors: Record<string, "blue" | "green" | "purple" | "orange" | "red"> = {
  "GitHub Copilot": "purple",
  "Cloud Fundamentals": "blue",
  "Azure AI": "orange",
  "AZ-104": "blue",
  "DevOps": "green",
};

export default function FeaturedTalks({ talks }: FeaturedTalksProps) {
  return (
    <section
      id="talks"
      aria-labelledby="talks-heading"
      className="py-24 section-padding bg-slate-50 dark:bg-slate-950/50"
    >
      <div className="section-container">
        <SectionHeader
          eyebrow="Watch & Learn"
          title="Featured Talks"
          description="Live sessions, bootcamps, and webinars on Azure, AI, and cloud-native engineering."
          align="left"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {talks.map((talk, i) => (
            <motion.div
              key={talk.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="flex flex-col gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all duration-300 gradient-border"
            >
              <YouTubeEmbed videoId={talk.id} title={talk.title} />
              <div className="flex items-center gap-2">
                <Badge variant={topicColors[talk.topic] ?? "blue"}>
                  {talk.topic}
                </Badge>
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

        <div className="mt-12 text-center">
          <Link
            href="/talks"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 group"
          >
            View All Talks
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
