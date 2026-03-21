import CaseStudyEditor from "@/components/admin/CaseStudyEditor";

export default function NewCaseStudyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Create New Case Study</h1>
      <CaseStudyEditor mode="create" />
    </div>
  );
}
