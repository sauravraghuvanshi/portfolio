import { getEvents, getEventClusters } from "@/lib/content";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import EventsPageClient from "@/components/sections/EventsPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Events — Saurav Raghuvanshi",
  description:
    "Conferences, workshops, bootcamps, and community meetups — sharing cloud and AI knowledge across Azure, Generative AI, DevOps, and the broader developer ecosystem.",
  alternates: { canonical: "/events" },
  openGraph: {
    type: "website",
    url: "/events",
    title: "Community Events — Saurav Raghuvanshi",
    description:
      "Conferences, workshops, bootcamps, and community meetups on Azure and Generative AI.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Saurav Raghuvanshi — Community Events" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Events — Saurav Raghuvanshi",
    description:
      "Conferences, workshops, and meetups on Azure and Generative AI.",
    images: ["/og-image.png"],
  },
};

export default function EventsPage() {
  const events = getEvents();
  const clusters = getEventClusters(events);
  const virtualCount = events.filter((e) => !e.location).length;

  return (
    <>
      <BreadcrumbListSchema items={[
        { name: "Home", url: "/" },
        { name: "Events", url: "/events" },
      ]} />
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

        <EventsPageClient
          events={events}
          clusters={clusters}
          virtualCount={virtualCount}
        />
      </div>
    </div>
    </>
  );
}
