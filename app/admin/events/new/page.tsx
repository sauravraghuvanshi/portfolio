import EventEditor from "@/components/admin/EventEditor";

export default function NewEventPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-white">Create New Event</h1>
      <EventEditor mode="create" />
    </div>
  );
}
