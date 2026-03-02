"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import type { CaseStudy } from "@/lib/content";

interface FeaturedCaseStudiesProps {
  caseStudies: CaseStudy[];
}

export default function FeaturedCaseStudies({ caseStudies }: FeaturedCaseStudiesProps) {
  return (
    <section id="case-studies" aria-labelledby="case-studies-heading" className="py-24 section-padding">
      <div className="section-container">
        <SectionHeader
          eyebrow="Deep Dives"
          title="Featured Case Studies"
          description="Real challenges, real architectures, measurable outcomes. These case studies show how I approach complex enterprise problems."
        />

        <div className="space-y-8">
          {caseStudies.map((cs, i) => (
            <motion.article
              key={cs.slug}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
              aria-label={cs.title}
            >
              <Link
                href={`/case-studies/${cs.slug}`}
                className="group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-lg dark:hover:shadow-brand-950/20 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className="p-8 lg:p-10">
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="blue">{cs.category}</Badge>
                        {cs.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="default">{tag}</Badge>
                        ))}
                      </div>

                      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {cs.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{cs.subtitle}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-500 mb-6">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                          {cs.timeline}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                          {cs.role}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 text-sm font-semibold group-hover:gap-3 transition-all">
                        Read Case Study
                        <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </span>
                    </div>

                    {/* Right: metrics */}
                    {cs.metrics && cs.metrics.length > 0 && (
                      <div className="lg:w-72 grid grid-cols-2 gap-3 content-start">
                        {cs.metrics.slice(0, 4).map((metric) => (
                          <div
                            key={metric.label}
                            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center"
                          >
                            <p className="text-2xl font-bold gradient-text">{metric.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{metric.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-10 text-center"
        >
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-medium rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 group"
          >
            View All Projects
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
