import { notFound } from "next/navigation";
import { getCaseStudy } from "@/lib/content";
import CaseStudyEditor from "@/components/admin/CaseStudyEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditCaseStudyPage({ params }: PageProps) {
  const { slug } = await params;
  const study = getCaseStudy(slug);

  if (!study) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit Case Study</h1>
      <CaseStudyEditor mode="edit" initialData={study} />
    </div>
  );
}
