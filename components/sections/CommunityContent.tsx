"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import {
  Crown,
  Megaphone,
  GraduationCap,
  Users,
  ArrowRight,
  Heart,
  Sparkles,
  Globe,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import ImageWithShimmer from "@/components/ui/ImageWithShimmer";
import type { EventMeta } from "@/lib/content";

/* ── Types ─────────────────────────────────────────────── */

interface CommunityRole {
  role: string;
  org: string;
  description: string;
}

interface CommunityStat {
  value: string;
  label: string;
}

interface CommunityContentProps {
  communityRoles: CommunityRole[];
  communityStats: CommunityStat[];
  previewEvents: EventMeta[];
  aboutLong: string;
}

/* ── Animated Counter (same pattern as CredibilityBar) ── */

function parseStatValue(value: string): { num: number; suffix: string } {
  const match = value.match(/^(\d+)(.*)/);
  if (!match) return { num: 0, suffix: value };
  return { num: parseInt(match[1], 10), suffix: match[2] };
}

function AnimatedCounter({ value, delay }: { value: string; delay: number }) {
  const { num, suffix } = parseStatValue(value);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReducedMotion = useReducedMotion();

  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 60,
    damping: 20,
    duration: 1.5,
  });

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => motionVal.set(num), delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, num, delay, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest) + suffix;
      }
    });
    return unsubscribe;
  }, [springVal, suffix]);

  if (prefersReducedMotion) {
    return <span>{value}</span>;
  }

  return (
    <span ref={ref} suppressHydrationWarning>
      {value}
    </span>
  );
}

/* ── Lookup Maps ───────────────────────────────────────── */

const roleIcons: Record<string, LucideIcon> = {
  Lead: Crown,
  Organizer: Megaphone,
  Mentor: GraduationCap,
  "Former Community Builder": Users,
  "Former Organizer": Megaphone,
};

const roleColors: Record<string, "blue" | "green" | "purple" | "orange"> = {
  Lead: "blue",
  Organizer: "purple",
  Mentor: "green",
  "Former Community Builder": "orange",
  "Former Organizer": "orange",
};

const coverPos: Record<string, string> = {
  top: "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

const formatColors: Record<string, "blue" | "green" | "purple" | "orange"> = {
  Speaker: "blue",
  Mentor: "green",
  Organizer: "purple",
  Attendee: "orange",
};

const themes = [
  { label: "Diversity & Inclusion", icon: Heart },
  { label: "Knowledge Sharing", icon: Sparkles },
  { label: "Developer Empowerment", icon: Globe },
];

/* ── Main Component ────────────────────────────────────── */

export default function CommunityContent({
  communityRoles,
  communityStats,
  previewEvents,
  aboutLong,
}: CommunityContentProps) {
  const philosophyParagraph =
    aboutLong.split("\n\n")[1] || aboutLong;

  return (
    <main id="main-content" className="pt-24 pb-16">
      {/* ── Section A: Hero + Impact Stats ─────────────── */}
      <section className="py-20 section-padding bg-gradient-to-b from-brand-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3"
            >
              Community Impact
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4"
            >
              Building Communities,{" "}
              <span className="gradient-text">Empowering Developers</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-slate-600 dark:text-slate-400"
            >
              Organizing events, mentoring founders, and driving cloud & AI
              adoption across India and beyond.
            </motion.p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {communityStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-bold gradient-text">
                  <AnimatedCounter value={stat.value} delay={i * 0.1} />
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section B: Community Roles ─────────────────── */}
      <section className="py-24 section-padding">
        <div className="section-container">
          <SectionHeader
            eyebrow="Roles & Leadership"
            title="Where I Lead"
            description="Active roles in developer communities, mentorship programs, and inclusive tech initiatives."
            align="left"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {communityRoles.map((role, i) => {
              const Icon = roleIcons[role.role] || Users;
              const color = roleColors[role.role] || "default";

              return (
                <motion.article
                  key={role.org}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={color}>{role.role}</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                        {role.org}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Section C: Community Philosophy ─────────────── */}
      <section className="py-24 section-padding bg-slate-50 dark:bg-slate-900/30">
        <div className="section-container">
          <SectionHeader
            eyebrow="What Drives Me"
            title="Community Philosophy"
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <blockquote className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic">
                &ldquo;{philosophyParagraph}&rdquo;
              </p>
            </blockquote>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {themes.map((theme, i) => {
                const ThemeIcon = theme.icon;
                return (
                  <motion.span
                    key={theme.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    <ThemeIcon className="w-3.5 h-3.5 text-brand-500" />
                    {theme.label}
                  </motion.span>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section D: Recent Events Preview ────────────── */}
      <section className="py-24 section-padding">
        <div className="section-container">
          <SectionHeader
            eyebrow="On Stage"
            title="Recent Events"
            description="Highlights from conferences, workshops, and community meetups."
            align="left"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {previewEvents.map((event, i) => (
              <motion.div
                key={event.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="h-full"
              >
                <Link
                  href={`/events/${event.slug}`}
                  className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 h-full gradient-border"
                  aria-label={event.title}
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                    {event.coverImage ? (
                      <ImageWithShimmer
                        src={event.coverImage}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className={`object-cover ${coverPos[event.coverImagePosition ?? ""] ?? "object-center"} group-hover:scale-105 transition-transform duration-500`}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
                    )}
                  </div>

                  <div className="flex flex-col flex-1 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Badge
                        variant={formatColors[event.format] ?? "default"}
                      >
                        {event.format}
                      </Badge>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                      {event.title}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 group"
            >
              View All Events
              <ArrowRight
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
