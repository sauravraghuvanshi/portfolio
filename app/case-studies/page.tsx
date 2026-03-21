import Link from "next/link";
import { getAllCaseStudies } from "@/lib/content";
import { ArrowRight, Clock, Tag, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "In-depth cloud architecture case studies: Azure landing zones, AI platforms, Zero Trust security, app modernization, and FinOps transformations with measurable outcomes.",
};

export default function CaseStudiesPage() {
  const caseStudies = getAllCaseStudies();

  return (
    <div className="py-16 section-padding">
      <div className="section-container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
            Case Studies
          </p>
          <h1 className="heading-lg text-slate-900 dark:text-white mb-4">
            Architecture Deep Dives
          </h1>
          <p className="body-lg">
            Real challenges, real architectures, measurable outcomes. Each case study covers context, constraints, architecture decisions, and results.
          </p>
        </div>

        <div className="space-y-8 max-w-4xl mx-auto">
          {caseStudies.map((cs, i) => (
            <article key={cs.slug} aria-label={cs.title}>
              <Link
                href={`/case-studies/${cs.slug}`}
                className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="p-8">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="blue">{cs.category}</Badge>
                    {cs.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="default">{tag}</Badge>
                    ))}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {cs.title}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{cs.subtitle}</p>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-500 mb-6">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {cs.timeline}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                      {cs.role}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {cs.client}
                    </span>
                  </div>

                  {cs.metrics && cs.metrics.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-5">
                      {cs.metrics.slice(0, 4).map((metric) => (
                        <div key={metric.label} className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 text-center min-w-[80px]">
                          <p className="text-lg font-bold gradient-text">{metric.value}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 text-sm font-semibold group-hover:gap-3 transition-all">
                    Read Case Study
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
