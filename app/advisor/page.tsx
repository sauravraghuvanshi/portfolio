import type { Metadata } from "next";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import AdvisorTabs from "@/components/advisor/AdvisorTabs";

export const metadata: Metadata = {
  title: "AI Architecture Advisor — Saurav Raghuvanshi",
  description:
    "Describe a workload, get a Microsoft Well-Architected Framework scorecard grounded in Microsoft Learn — plus a downloadable ADR. Built by Saurav Raghuvanshi.",
  alternates: { canonical: "/advisor" },
  openGraph: {
    type: "website",
    url: "/advisor",
    title: "AI Architecture Advisor — Saurav Raghuvanshi",
    description:
      "WAF scorecard + Microsoft Learn citations + ADR export. An AI tool for cloud architects.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "AI Architecture Advisor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Architecture Advisor — Saurav Raghuvanshi",
    description: "WAF scorecard + Microsoft Learn citations + ADR export.",
    images: ["/og-image.png"],
  },
};

export default function AdvisorPage() {
  return (
    <>
      <BreadcrumbListSchema
        items={[
          { name: "Home", url: "/" },
          { name: "AI Architecture Advisor", url: "/advisor" },
        ]}
      />
      <main id="main-content" className="pt-24 pb-16 section-padding">
        <div className="section-container max-w-4xl">
          <div className="mb-10 max-w-3xl">
            <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-wider uppercase mb-3">
              AI
            </p>
            <h1 className="heading-xl text-slate-900 dark:text-white mb-4">
              AI Architecture Advisor
            </h1>
            <p className="body-lg text-slate-600 dark:text-slate-400">
              Describe a workload — get a Microsoft Well-Architected Framework scorecard
              with risks, recommended Azure services, and Microsoft Learn citations under
              each pillar. Download the draft ADR when you&apos;re ready.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500 mt-3">
              Grounded in <span className="font-medium">learn.microsoft.com</span> via MCP.
              Output is a draft — always validate before adopting.
            </p>
          </div>

          <AdvisorTabs />
        </div>
      </main>
    </>
  );
}
