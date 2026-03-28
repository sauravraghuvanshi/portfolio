"use client";

import { useState } from "react";
import { Rocket, Headset, Briefcase, GraduationCap, Layers } from "lucide-react";
import { TimelineCard, type ExperienceEntry } from "@/components/timeline/TimelineCard";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  rocket: Rocket,
  headset: Headset,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  layers: Layers,
};

interface CareerTimelineProps {
  experience: ExperienceEntry[];
}

function MilestoneIcon({ icon, isActive }: { icon: string; isActive: boolean }) {
  const Icon = ICON_MAP[icon] ?? Briefcase;
  return (
    <div
      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
        isActive
          ? "bg-brand-600 border-brand-500 text-white shadow-glow"
          : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400"
      }`}
    >
      <Icon className="w-4.5 h-4.5" />
    </div>
  );
}

export default function CareerTimeline({ experience }: CareerTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleCard = (index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section aria-labelledby="career-timeline" className="py-16">
      <div className="section-container max-w-4xl">
        <h2 id="career-timeline" className="text-lg font-semibold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          Experience
        </h2>

        {/* Vertical timeline — all entries visible */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-brand-400 dark:from-brand-600 via-slate-200 dark:via-slate-700 to-slate-200 dark:to-slate-800" />

          {/* Present pulse at top of line */}
          <div className="absolute left-[14px] -top-1 z-10">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500" />
            </span>
          </div>

          <div className="space-y-8">
            {experience.map((entry, i) => (
              <div key={`${entry.role}-${entry.startDate}`} className="relative pl-14">
                {/* Milestone icon on the line */}
                <div className="absolute left-0 top-0">
                  <MilestoneIcon icon={entry.icon} isActive={expandedIndex === i} />
                </div>

                {/* Card */}
                <TimelineCard
                  entry={entry}
                  isExpanded={expandedIndex === i}
                  onToggle={() => toggleCard(i)}
                  index={i}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
