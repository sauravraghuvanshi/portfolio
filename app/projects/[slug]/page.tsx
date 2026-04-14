import { notFound } from "next/navigation";
import Link from "next/link";
import { getProject, getProjects } from "@/lib/content";
import { ArrowLeft, ArrowRight, Calendar, TrendingUp, Github, ExternalLink, Layers, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ProjectSchema, BreadcrumbListSchema } from "@/components/JsonLd";
import type { Metadata } from "next";

export const revalidate = 60;

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

const categoryColors: Record<string, "blue" | "green" | "purple" | "orange" | "red"> = {
  Azure: "blue",
  DevOps: "green",
  AI: "purple",
  Security: "red",
  "Cost Optimization": "orange",
};

export async function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project Not Found" };
  return {
    title: project.title,
    description: project.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: project.title,
      description: project.description,
      type: "article",
      tags: project.tags,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const allProjects = getProjects();
  const idx = allProjects.findIndex((p) => p.id === slug);
  const prev = idx > 0 ? allProjects[idx - 1] : null;
  const next = idx < allProjects.length - 1 ? allProjects[idx + 1] : null;

  const related = allProjects
    .filter((p) => p.id !== project.id && p.category.some((c) => project.category.includes(c)))
    .slice(0, 3);

  return (
    <>
      <ProjectSchema
        title={project.title}
        description={project.description}
        slug={project.id}
        tags={project.tags}
        year={project.year}
      />
      <BreadcrumbListSchema items={[
        { name: "Home", url: "/" },
        { name: "Projects", url: "/projects" },
        { name: project.title, url: `/projects/${slug}` },
      ]} />
      <div className="py-16 section-padding">
        <div className="max-w-4xl mx-auto">

          {/* Back */}
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors mb-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
            aria-label="Back to projects"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Projects
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-wrap gap-2 mb-4">
              {project.category.map((cat) => (
                <Badge key={cat} variant={categoryColors[cat] || "blue"}>{cat}</Badge>
              ))}
              {project.tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>

            <h1 className="heading-xl text-slate-900 dark:text-white mb-4">
              {project.title}
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 mb-8">
              {project.description}
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap gap-6 text-sm text-slate-500 dark:text-slate-400 pb-8 border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" aria-hidden="true" />
                {project.year}
              </span>
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" aria-hidden="true" />
                {project.category.join(", ")}
              </span>
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4" aria-hidden="true" />
                {project.techStack.length} technologies
              </span>
            </div>

            {/* Action buttons */}
            {(project.githubUrl !== "#" || project.liveUrl !== "#") && (
              <div className="flex flex-wrap gap-3 mt-6">
                {project.githubUrl && project.githubUrl !== "#" && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 font-semibold rounded-xl text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    <Github className="w-4 h-4" aria-hidden="true" />
                    View Source
                  </a>
                )}
                {project.liveUrl && project.liveUrl !== "#" && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                  >
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    Live Demo
                  </a>
                )}
              </div>
            )}
          </header>

          {/* Outcomes */}
          {project.outcomes.length > 0 && (
            <section aria-label="Project outcomes" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                Key Outcomes
              </h2>
              <div className="space-y-3">
                {project.outcomes.map((outcome) => (
                  <div
                    key={outcome}
                    className="flex items-start gap-3 p-4 bg-gradient-to-r from-accent-50 to-brand-50 dark:from-accent-950/30 dark:to-brand-950/30 border border-accent-200/50 dark:border-accent-800/50 rounded-xl"
                  >
                    <TrendingUp className="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{outcome}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tech Stack */}
          <section aria-label="Technology stack" className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
              Tech Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  {tech}
                </span>
              ))}
            </div>
          </section>

          {/* Related Projects */}
          {related.length > 0 && (
            <section aria-label="Related projects" className="mb-10">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
                Related Projects
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {related.map((rp) => (
                  <Link
                    key={rp.id}
                    href={`/projects/${rp.id}`}
                    className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rp.category.map((cat) => (
                        <Badge key={cat} variant={categoryColors[cat] || "blue"}>{cat}</Badge>
                      ))}
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                      {rp.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Prev / Next */}
          <nav
            aria-label="Project navigation"
            className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {prev ? (
              <Link
                href={`/projects/${prev.id}`}
                className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label={`Previous project: ${prev.title}`}
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
                href={`/projects/${next.id}`}
                className="group flex items-center gap-3 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all duration-200 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:flex-row-reverse"
                aria-label={`Next project: ${next.title}`}
              >
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all flex-shrink-0" aria-hidden="true" />
                <div className="min-w-0 sm:text-right">
                  <p className="text-xs text-slate-500 mb-0.5">Next</p>
                  <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{next.title}</p>
                </div>
              </Link>
            ) : <div />}
          </nav>

          {/* CTA */}
          <div className="mt-10 p-8 bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950/30 dark:to-accent-950/30 border border-brand-200/50 dark:border-brand-800/50 rounded-2xl text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Interested in a similar solution?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-5">
              Let&apos;s discuss how I can help with your architecture goals.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/#contact"
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                Get in Touch
              </Link>
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
    </>
  );
}
