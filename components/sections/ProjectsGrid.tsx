"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Github,
  ExternalLink,
  TrendingUp,
  ArrowRight,
  Server,
  Shield,
  Zap,
  RefreshCw,
} from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import type { Project } from "@/lib/content";

interface ProjectsGridProps {
  projects: Project[];
  showFilters?: boolean;
  limit?: number;
}

const categoryColors: Record<string, "blue" | "green" | "purple" | "orange" | "red"> = {
  Azure: "blue",
  DevOps: "green",
  AI: "purple",
  Security: "red",
  "Cost Optimization": "orange",
};

// ─── infra stat chips for the portfolio-website spotlight ────────────────────
const infraStats = [
  { icon: <Server size={13} />, label: "6 Azure services" },
  { icon: <Zap size={13} />, label: "~$13 / month" },
  { icon: <Shield size={13} />, label: "Zero API keys" },
  { icon: <RefreshCw size={13} />, label: "~3 min deploy" },
];

// ─── spotlight card ───────────────────────────────────────────────────────────
function SpotlightProjectCard({ project, href }: { project: Project; href: string }) {
  const router = useRouter();
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.article
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={() => router.push(href)}
      className="mb-8 rounded-2xl border-2 border-brand-500 dark:border-brand-400 bg-white dark:bg-slate-800 shadow-xl shadow-brand-500/10 dark:shadow-brand-400/10 overflow-hidden cursor-pointer group"
      aria-label={project.title}
    >
      <div className="p-7 md:p-9">
        {/* top row */}
        <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-3 mb-5">
          {/* Live badge */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-600/10 dark:bg-emerald-400/10 border border-emerald-600/30 dark:border-emerald-400/30 px-2.5 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live on Azure
          </span>
          {project.category.map((cat) => (
            <Badge key={cat} variant={categoryColors[cat] || "default"}>{cat}</Badge>
          ))}
          <span className="ml-auto text-xs font-mono text-slate-400 dark:text-slate-500">{project.year}</span>
        </motion.div>

        {/* two-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          {/* left: title + description + outcomes */}
          <div className="lg:col-span-3">
            <motion.h3
              variants={itemVariants}
              className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3 leading-snug"
            >
              {project.title}
            </motion.h3>
            <motion.p
              variants={itemVariants}
              className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5"
            >
              {project.description}
            </motion.p>
            {project.outcomes && project.outcomes.length > 0 && (
              <motion.ul variants={itemVariants} className="space-y-2">
                {project.outcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </div>

          {/* right: infra stats + links */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* infra stat chips */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2">
              {infraStats.map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5"
                >
                  <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">{icon}</span>
                  {label}
                </div>
              ))}
            </motion.div>

            {/* CTA links */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mt-auto">
              {project.liveUrl && project.liveUrl !== "#" && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <ExternalLink size={12} />
                  View Architecture
                </a>
              )}
              {project.githubUrl && project.githubUrl !== "#" && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-600 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Github size={12} />
                  Source
                </a>
              )}
            </motion.div>
          </div>
        </div>

        {/* tech stack */}
        <motion.div
          variants={itemVariants}
          className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-2"
        >
          {project.techStack.map((tech, i) => (
            <motion.span
              key={tech}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25, delay: 0.3 + i * 0.04 }}
              className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-2.5 py-1 rounded-lg"
            >
              {tech}
            </motion.span>
          ))}
        </motion.div>
      </div>
    </motion.article>
  );
}

// ─── main grid ────────────────────────────────────────────────────────────────
export default function ProjectsGrid({ projects, showFilters = true, limit }: ProjectsGridProps) {
  const categories = ["All", ...Array.from(new Set(projects.flatMap((p) => p.category)))];
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = projects.filter(
    (p) => activeCategory === "All" || p.category.includes(activeCategory)
  );
  const displayed = limit ? filtered.slice(0, limit) : filtered;

  const spotlightProject = displayed.find((p) => p.id === "portfolio-website") ?? null;
  const regularProjects = displayed.filter((p) => p.id !== "portfolio-website");

  return (
    <section id="projects" aria-labelledby="projects-heading" className="py-24 section-padding bg-slate-50 dark:bg-slate-900/30">
      <div className="section-container">
        <SectionHeader
          eyebrow="Projects"
          title="Project Gallery"
          description="A selection of architectures, platforms, and solutions delivered across industries."
        />

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 justify-center mb-10" role="group" aria-label="Filter projects by category">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  activeCategory === cat
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Spotlight card */}
        <AnimatePresence>
          {spotlightProject && (
            <SpotlightProjectCard
              key={spotlightProject.id}
              project={spotlightProject}
              href={`/projects/${spotlightProject.id}`}
            />
          )}
        </AnimatePresence>

        {/* Regular grid */}
        <AnimatePresence mode="popLayout">
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularProjects.map((project, i) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="block">
                <motion.article
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col${project.featured ? " gradient-border" : ""}`}
                  aria-label={project.title}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap gap-1">
                      {project.category.map((cat) => (
                        <Badge key={cat} variant={categoryColors[cat] || "default"}>{cat}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {project.githubUrl && project.githubUrl !== "#" && (
                        <span
                          onClick={(e) => { e.preventDefault(); window.open(project.githubUrl, "_blank", "noopener,noreferrer"); }}
                          role="link"
                          tabIndex={0}
                          aria-label={`${project.title} GitHub repository`}
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
                        >
                          <Github className="w-4 h-4" />
                        </span>
                      )}
                      {project.liveUrl && project.liveUrl !== "#" && (
                        <span
                          onClick={(e) => { e.preventDefault(); window.open(project.liveUrl, "_blank", "noopener,noreferrer"); }}
                          role="link"
                          tabIndex={0}
                          aria-label={`${project.title} live demo`}
                          className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{project.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">{project.description}</p>

                  {project.outcomes && project.outcomes.length > 0 && (
                    <div className="mb-4 space-y-1">
                      {project.outcomes.map((outcome) => (
                        <div key={outcome} className="flex items-start gap-2 text-xs text-accent-700 dark:text-accent-400">
                          <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                          <span>{outcome}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {project.techStack.slice(0, 4).map((tech) => (
                      <Badge key={tech} variant="default">{tech}</Badge>
                    ))}
                    {project.techStack.length > 4 && (
                      <Badge variant="default">+{project.techStack.length - 4}</Badge>
                    )}
                  </div>
                </motion.article>
              </Link>
            ))}
          </motion.div>
        </AnimatePresence>

        {limit && (
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
        )}
      </div>
    </section>
  );
}
