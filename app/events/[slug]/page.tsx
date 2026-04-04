import { notFound } from "next/navigation";
import Link from "next/link";
import ImageWithShimmer from "@/components/ui/ImageWithShimmer";
import { getEvent, getEvents } from "@/lib/content";
import { ArrowLeft, ArrowRight, Tag, Users } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { SpeakingEventSchema, BreadcrumbListSchema } from "@/components/JsonLd";
import EventGallery from "@/components/events/EventGallery";
import type { Metadata } from "next";

interface EventPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getEvents().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} — Saurav Raghuvanshi`,
    description: event.summary || `${event.title} — ${event.format} event on ${event.topic}`,
    openGraph: {
      title: event.title,
      description: event.summary,
      type: "article",
      ...(event.coverImage ? { images: [event.coverImage] } : {}),
    },
  };
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

const formatVariant: Record<string, "blue" | "green" | "purple" | "orange" | "red"> = {
  Speaker:   "blue",
  Mentor:    "green",
  Organizer: "purple",
  Panelist:  "orange",
  Workshop:  "green",
};

const coverPos: Record<string, string> = {
  top:    "object-top",
  center: "object-center",
  bottom: "object-bottom",
};

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  const allEvents = getEvents();
  const idx  = allEvents.findIndex((e) => e.slug === slug);
  const prev = idx > 0 ? allEvents[idx - 1] : null;
  const next = idx < allEvents.length - 1 ? allEvents[idx + 1] : null;

  const allImages = [
    ...(event.coverImage ? [event.coverImage] : []),
    ...(event.images || []),
  ];

  return (
    <>
      <SpeakingEventSchema
        title={event.title}
        slug={event.slug}
        year={event.year}
        format={event.format}
        topic={event.topic}
        summary={event.summary}
        coverImage={event.coverImage}
      />
      <BreadcrumbListSchema items={[
        { name: "Home", url: "/" },
        { name: "Events", url: "/events" },
        { name: event.title, url: `/events/${slug}` },
      ]} />
      <div className="py-16 section-padding">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Events
        </Link>

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={topicVariant[event.topic] ?? "blue"}>{event.topic}</Badge>
            <Badge variant={formatVariant[event.format] ?? "blue"}>{event.format}</Badge>
            {event.tags.slice(0, 4).map((t) => (
              <Badge key={t} variant="default">{t}</Badge>
            ))}
          </div>

          <h1 className="heading-xl text-slate-900 dark:text-white mb-6">{event.title}</h1>

          <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400 pb-8 border-b border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              {event.format}
            </span>
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" aria-hidden="true" />
              {event.topic}
            </span>
          </div>

          {event.coverImage && (
            <div className="mt-8 rounded-2xl overflow-hidden aspect-video relative bg-slate-100 dark:bg-slate-800">
              <ImageWithShimmer
                src={event.coverImage}
                alt={`${event.title} cover photo`}
                fill
                className={`object-cover ${coverPos[event.coverImagePosition ?? "top"] ?? "object-top"}`}
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          )}
        </header>

        {/* Summary */}
        {event.summary && (
          <section aria-label="Event summary" className="mb-10">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
              {event.summary}
            </p>
          </section>
        )}

        {/* Highlights */}
        {event.highlights.length > 0 && (
          <section aria-label="Event highlights" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
              Highlights
            </h2>
            <ul className="space-y-3">
              {event.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" aria-hidden="true" />
                  {h}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Impact */}
        {event.impact.length > 0 && (
          <section
            aria-label="Event impact"
            className="mb-10 p-6 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950/30 dark:to-accent-950/30 border border-brand-200/50 dark:border-brand-800/50 rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Impact &amp; Outcomes
            </h2>
            <div className="space-y-2">
              {event.impact.map((line, i) => (
                <p key={i} className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </section>
        )}

        {/* Gallery */}
        {allImages.length > 0 && (
          <section aria-label="Event photos" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
              Photos
            </h2>
            <EventGallery images={allImages} eventTitle={event.title} />
          </section>
        )}

        {/* Prev / Next */}
        <nav
          aria-label="Event navigation"
          className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {prev ? (
            <Link
              href={`/events/${prev.slug}`}
              className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 mb-0.5">Previous</p>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{prev.title}</p>
              </div>
            </Link>
          ) : <div />}

          {next ? (
            <Link
              href={`/events/${next.slug}`}
              className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex-row-reverse"
            >
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0 sm:text-right">
                <p className="text-xs text-slate-500 mb-0.5">Next</p>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{next.title}</p>
              </div>
            </Link>
          ) : <div />}
        </nav>
      </div>
    </div>
    </>
  );
}
