import { notFound } from "next/navigation";
import { getADRGallery } from "@/lib/content";
import ADREditor from "@/components/admin/ADREditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDecisionPage({ params }: PageProps) {
  const { id } = await params;
  const gallery = getADRGallery();
  const entry = gallery?.entries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit ADR</h1>
      <ADREditor mode="edit" initialData={entry} />
    </div>
  );
}
