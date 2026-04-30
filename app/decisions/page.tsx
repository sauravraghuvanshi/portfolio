import type { Metadata } from "next";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import { getADRGallery } from "@/lib/content";
import ADRGallery from "@/components/sections/ADRGallery";

export const metadata: Metadata = {
  title: "Architecture Decisions — Saurav Raghuvanshi",
  description:
    "12 architecture decision records from building a production Azure portfolio — context, options considered, decision made, and real-world outcomes. Mapped to the Azure Well-Architected Framework pillars.",
  alternates: { canonical: "/decisions" },
  openGraph: {
    type: "website",
    url: "/decisions",
    title: "Architecture Decisions — Saurav Raghuvanshi",
    description:
      "12 ADRs from a real Azure portfolio — context, options, trade-offs, and outcomes. Mapped to WAF pillars.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Saurav Raghuvanshi — Architecture Decisions" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Architecture Decisions — Saurav Raghuvanshi",
    description: "12 ADRs from a real Azure portfolio — context, options, trade-offs, and outcomes.",
    images: ["/og-image.png"],
  },
};

export default function DecisionsPage() {
  const gallery = getADRGallery();

  if (!gallery) {
    return (
      <main id="main-content" className="pt-24 pb-16 section-padding">
        <div className="section-container">
          <h1 className="heading-xl text-slate-900 dark:text-white">Architecture Decisions</h1>
          <p className="body-lg text-slate-600 dark:text-slate-400 mt-4">
            Decision records not available.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "Architecture Decisions", url: "/decisions" },
        ]}
      />
      <main id="main-content" className="pt-24 pb-16 section-padding">
        <div className="section-container">
          <div className="mb-10 max-w-3xl">
            <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-wider uppercase mb-3">
              Architecture Decision Records
            </p>
            <h1 className="heading-xl text-slate-900 dark:text-white mb-4">
              How I Make Decisions
            </h1>
            <p className="body-lg text-slate-600 dark:text-slate-400">
              {gallery.summary}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-3">
              Click any card to see the full context, options I considered, the decision, rationale, trade-offs, and real-world outcome.
            </p>
          </div>

          <ADRGallery gallery={gallery} />
        </div>
      </main>
    </>
  );
}
