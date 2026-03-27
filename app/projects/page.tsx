import { getProjects } from "@/lib/content";
import { BreadcrumbListSchema } from "@/components/JsonLd";
import ProjectsGrid from "@/components/sections/ProjectsGrid";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projects",
  description:
    "A complete gallery of cloud architecture projects — Azure landing zones, AI platforms, DevOps pipelines, security architectures, and cost optimization programs.",
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <>
      <BreadcrumbListSchema items={[
        { name: "Home", url: "/" },
        { name: "Projects", url: "/projects" },
      ]} />
      <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
            Portfolio
          </p>
          <h1 className="heading-lg text-slate-900 dark:text-white mb-4">All Projects</h1>
          <p className="body-lg max-w-2xl mx-auto">
            Architectures, platforms, and solutions across Azure, AI, DevOps, Security, and FinOps.
          </p>
        </div>
      </div>
      <ProjectsGrid projects={projects} showFilters={true} />
    </div>
    </>
  );
}
