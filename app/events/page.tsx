import { getEvents } from "@/lib/content";
import EventsGrid from "@/components/sections/EventsGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Events — Saurav Raghuvanshi",
  description:
    "Conferences, workshops, bootcamps, and community meetups — sharing cloud and AI knowledge across Azure, Generative AI, DevOps, and the broader developer ecosystem.",
};

export default function EventsPage() {
  const events = getEvents();

  return (
    <div className="py-20 section-padding">
      <div className="section-container">
        {/* Hero */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
            Community Events
          </p>
          <h1 className="heading-lg text-slate-900 dark:text-white mb-4">
            Learning &amp;{" "}
            <span className="gradient-text">Leading in Public</span>
          </h1>
          <p className="body-lg text-slate-600 dark:text-slate-400">
            From keynote stages to bootcamp rooms — conferences, workshops,
            mentorships, and community meetups across Azure, Generative AI,
            DevOps, and the broader developer ecosystem.
          </p>
        </div>

        <EventsGrid events={events} />
      </div>
    </div>
  );
}
