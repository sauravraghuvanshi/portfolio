import { getTalks } from "@/lib/content";
import TalksGrid from "@/components/sections/TalksGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Talks & Sessions — Saurav Raghuvanshi",
  description:
    "Watch live sessions, bootcamps, and webinars by Saurav Raghuvanshi on Azure, AI, GitHub Copilot, and cloud-native engineering.",
};

export default function TalksPage() {
  const talks = getTalks();

  return (
    <main id="main-content" className="pt-24 pb-16 section-padding">
      <div className="section-container">
        <div className="mb-12">
          <p className="text-brand-600 dark:text-brand-400 text-sm font-semibold tracking-wider uppercase mb-3">
            Watch &amp; Learn
          </p>
          <h1 className="heading-xl text-slate-900 dark:text-white mb-4">
            Talks &amp; Sessions
          </h1>
          <p className="body-lg text-slate-600 dark:text-slate-400 max-w-2xl">
            Live sessions, bootcamps, and webinars on Azure, GitHub Copilot, AI
            services, and cloud-native engineering.
          </p>
        </div>

        <TalksGrid talks={talks} />
      </div>
    </main>
  );
}
