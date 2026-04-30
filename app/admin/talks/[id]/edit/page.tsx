import { notFound } from "next/navigation";
import { getTalks } from "@/lib/content";
import TalkEditor from "@/components/admin/TalkEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTalkPage({ params }: PageProps) {
  const { id } = await params;
  const talk = getTalks(true).find((t) => t.id === id);

  if (!talk) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit Talk</h1>
      <TalkEditor mode="edit" initialData={talk} />
    </div>
  );
}
