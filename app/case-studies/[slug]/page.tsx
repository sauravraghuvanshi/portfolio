import { notFound } from "next/navigation";
import Link from "next/link";
import { getCaseStudy, getAllCaseStudies } from "@/lib/content";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { sharedMDXComponents } from "@/lib/mdx-components";
import { ArrowLeft, ArrowRight, Clock, User, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { Metadata } from "next";

export const revalidate = 60;

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) return { title: "Case Study Not Found" };
  return {
    title: caseStudy.title,
    description: caseStudy.subtitle,
    alternates: { canonical: `/case-studies/${slug}` },
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.subtitle,
      type: "article",
      tags: caseStudy.tags,
    },
  };
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) notFound();

  const allCaseStudies = getAllCaseStudies();
  const currentIndex = allCaseStudies.findIndex((cs) => cs.slug === slug);
  const prevCaseStudy = currentIndex > 0 ? allCaseStudies[currentIndex - 1] : null;
  const nextCaseStudy = currentIndex < allCaseStudies.length - 1 ? allCaseStudies[currentIndex + 1] : null;

  let content;
  try {
    ({ content } = await compileMDX({
      source: caseStudy.content,
      options: {
        parseFrontmatter: false,
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
      components: sharedMDXComponents,
    }));
  } catch (err) {
    console.error("MDX compilation error:", err);
    content = <p className="text-red-500">Error rendering content. The markdown may contain invalid syntax.</p>;
  }

  return (
    <div className="py-16 section-padding">
      <div className="max-w-4xl mx-auto">
        {/* Back navigation */}
        <Link
          href="/#case-studies"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
          aria-label="Back to case studies"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Case Studies
        </Link>

        {/* Article header */}
        <header className="mb-12">
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {caseStudy.category.map((cat) => (
              <Badge key={cat} variant="blue">{cat}</Badge>
            ))}
            {caseStudy.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="default">{tag}</Badge>
            ))}
          </div>

          <h1 className="heading-xl text-slate-900 dark:text-white mb-4">
            {caseStudy.title}
          </h1>
          <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">
            {caseStudy.subtitle}
          </p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-500 pb-8 border-b border-slate-200 dark:border-slate-800">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" aria-hidden="true" />
              {caseStudy.timeline}
            </span>
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" aria-hidden="true" />
              {caseStudy.role}
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4" aria-hidden="true" />
              {caseStudy.client}
            </span>
          </div>

          {/* Metrics grid */}
          {caseStudy.metrics && caseStudy.metrics.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {caseStudy.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm"
                >
                  <p className="text-2xl sm:text-3xl font-bold gradient-text">{metric.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">{metric.label}</p>
                </div>
              ))}
            </div>
          )}
        </header>

        {/* MDX content */}
        <article
          className="prose-custom"
          aria-label={`Case study: ${caseStudy.title}`}
        >
          {content}
        </article>

        {/* Prev / Next navigation */}
        <nav
          aria-label="Case study navigation"
          className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {prevCaseStudy ? (
            <Link
              href={`/case-studies/${prevCaseStudy.slug}`}
              className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-label={`Previous case study: ${prevCaseStudy.title}`}
            >
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:-translate-x-1 transition-all" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-500 mb-0.5">Previous</p>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{prevCaseStudy.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextCaseStudy ? (
            <Link
              href={`/case-studies/${nextCaseStudy.slug}`}
              className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex-row-reverse"
              aria-label={`Next case study: ${nextCaseStudy.title}`}
            >
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" aria-hidden="true" />
              <div className="min-w-0 sm:text-right">
                <p className="text-xs text-slate-500 dark:text-slate-500 mb-0.5">Next</p>
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{nextCaseStudy.title}</p>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </nav>

        {/* CTA */}
        <div className="mt-10 p-8 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950/30 dark:to-accent-950/30 border border-brand-200/50 dark:border-brand-800/50 rounded-2xl text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Have a similar challenge?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-5">
            Let&apos;s talk about your architecture goals.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="/#contact"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Get in Touch
            </a>
            <a
              href="https://outlook.office.com/bookwithme/user/7724061ce7fa4a87acfd23b2dbaf800a@microsoft.com/meetingtype/ojiCbqKOdUCmNTWtPZFSnQ2?anonymous&ismsaljsauthenabled&ep=mlink"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold rounded-xl text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              Book a Call
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
