import { notFound } from "next/navigation";
import { getProjects } from "@/lib/content";
import ProjectEditor from "@/components/admin/ProjectEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  const project = getProjects(true).find((p) => p.id === id);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit Project</h1>
      <ProjectEditor mode="edit" initialData={project} />
    </div>
  );
}
