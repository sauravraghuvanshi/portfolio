"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, ExternalLink, TrendingUp } from "lucide-react";
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

export default function ProjectsGrid({ projects, showFilters = true, limit }: ProjectsGridProps) {
  const categories = ["All", ...Array.from(new Set(projects.map((p) => p.category)))];
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = projects.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  );
  const displayed = limit ? filtered.slice(0, limit) : filtered;

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

        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayed.map((project, i) => (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col"
                aria-label={project.title}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <Badge variant={categoryColors[project.category] || "default"}>{project.category}</Badge>
                  <div className="flex gap-2">
                    {project.githubUrl && project.githubUrl !== "#" && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.title} GitHub repository`}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                    {project.liveUrl && project.liveUrl !== "#" && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${project.title} live demo`}
                        className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{project.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 flex-1">{project.description}</p>

                {/* Outcomes */}
                {project.outcomes && project.outcomes.length > 0 && (
                  <div className="mb-4 space-y-1">
                    {project.outcomes.slice(0, 2).map((outcome) => (
                      <div key={outcome} className="flex items-start gap-2 text-xs text-accent-700 dark:text-accent-400">
                        <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                        <span>{outcome}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tech stack */}
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  {project.techStack.slice(0, 4).map((tech) => (
                    <Badge key={tech} variant="default">{tech}</Badge>
                  ))}
                  {project.techStack.length > 4 && (
                    <Badge variant="default">+{project.techStack.length - 4}</Badge>
                  )}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
