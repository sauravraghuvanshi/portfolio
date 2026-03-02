"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import type { EventMeta } from "@/lib/content";

interface SpeakingProps {
  events: EventMeta[];
}

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

export default function Speaking({ events }: SpeakingProps) {
  return (
    <section id="speaking" aria-labelledby="speaking-heading" className="py-24 section-padding">
      <div className="section-container">
        <SectionHeader
          eyebrow="Community"
          title="Speaking & Leadership"
          description="Sharing knowledge at conferences, workshops, and community events."
          align="left"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {events.map((event, i) => (
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
                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 h-full"
                aria-label={event.title}
              >
                {/* Cover image */}
                <div className="relative aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                  {event.coverImage ? (
                    <Image
                      src={event.coverImage}
                      alt={event.title}
                      fill
                      className={`object-cover ${coverPos[event.coverImagePosition ?? ""] ?? "object-center"} group-hover:scale-105 transition-transform duration-500`}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500 to-brand-700" />
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant={formatColors[event.format] ?? "default"}>
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

        {/* View all events link */}
        <div className="mt-10 text-center">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 group"
          >
            View All Events
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
