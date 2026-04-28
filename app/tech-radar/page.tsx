import type { Metadata } from "next";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import { getTechRadar } from "@/lib/content";
import TechRadar from "@/components/sections/TechRadar";

export const metadata: Metadata = {
  title: "Tech Radar — Saurav Raghuvanshi",
  description:
    "My current opinions on 50+ cloud, AI, and platform technologies — Adopt, Trial, Assess, and Hold. A ThoughtWorks-style tech radar from a Microsoft Cloud Solution Architect.",
  alternates: { canonical: "/tech-radar" },
  openGraph: {
    type: "website",
    url: "/tech-radar",
    title: "Tech Radar — Saurav Raghuvanshi",
    description:
      "Adopt · Trial · Assess · Hold. A working architect's opinions on Azure, AI, languages, and platform tools.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Saurav Raghuvanshi — Tech Radar" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tech Radar — Saurav Raghuvanshi",
    description: "Adopt · Trial · Assess · Hold. Opinions on cloud, AI, and platform tech.",
    images: ["/og-image.png"],
  },
};

export default function TechRadarPage() {
  const radar = getTechRadar();

  if (!radar) {
    return (
      <main id="main-content" className="pt-24 pb-16 section-padding">
        <div className="section-container">
          <h1 className="heading-xl text-slate-900 dark:text-white">Tech Radar</h1>
          <p className="body-lg text-slate-600 dark:text-slate-400 mt-4">
            Radar data not available.
          </p>
        </div>
      </main>
    );
  }

  const formattedDate = new Date(radar.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Tech Radar", url: "/tech-radar" },
        ]}
      />
      <main id="main-content" className="pt-24 pb-16 section-padding">
        <div className="section-container">
          <div className="mb-10 max-w-3xl">
            <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-wider uppercase mb-3">
              Edition {radar.edition} · Published {formattedDate}
            </p>
            <h1 className="heading-xl text-slate-900 dark:text-white mb-4">
              Tech Radar
            </h1>
            <p className="body-lg text-slate-600 dark:text-slate-400">
              {radar.summary}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-3">
              Click any dot or tag for the full take — when I&apos;d use it, when I wouldn&apos;t, and why.
            </p>
          </div>

          <TechRadar radar={radar} />
        </div>
      </main>
    </>
  );
}
