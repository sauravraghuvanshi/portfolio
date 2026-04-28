import { notFound } from "next/navigation";
import { getTechRadar } from "@/lib/content";
import RadarEntryEditor from "@/components/admin/RadarEntryEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRadarEntryPage({ params }: PageProps) {
  const { id } = await params;
  const entry = getTechRadar()?.entries.find((e) => e.id === id);
  if (!entry) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit: {entry.name}</h1>
      <RadarEntryEditor mode="edit" initialData={entry} />
    </div>
  );
}
