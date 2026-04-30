import ADREditor from "@/components/admin/ADREditor";

export default function NewDecisionPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">New Architecture Decision</h1>
      <ADREditor mode="create" />
    </div>
  );
}
