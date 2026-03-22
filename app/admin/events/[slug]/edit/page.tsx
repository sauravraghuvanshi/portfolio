import { notFound } from "next/navigation";
import { getEvent } from "@/lib/content";
import EventEditor from "@/components/admin/EventEditor";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { slug } = await params;
  const event = getEvent(slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Edit Event</h1>
      <EventEditor mode="edit" initialData={event} />
    </div>
  );
}
