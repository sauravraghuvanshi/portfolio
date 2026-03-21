import ProjectEditor from "@/components/admin/ProjectEditor";

export default function NewProjectPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Create New Project</h1>
      <ProjectEditor mode="create" />
    </div>
  );
}
