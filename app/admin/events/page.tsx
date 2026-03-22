import Link from "next/link";
import { getEvents } from "@/lib/content";
import { Plus, PenSquare } from "lucide-react";
import DeleteItemButton from "@/components/admin/DeleteItemButton";

export default function AdminEventsListPage() {
  const allEvents = getEvents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <Link
          href="/admin/events/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {allEvents.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-dark px-5 py-16 text-center">
          <p className="text-slate-400">No events yet.</p>
          <Link
            href="/admin/events/new"
            className="mt-2 inline-block text-sm text-brand-400 hover:underline"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Year</th>
                <th className="px-5 py-3 font-medium">Format</th>
                <th className="px-5 py-3 font-medium">Topic</th>
                <th className="px-5 py-3 font-medium">Featured</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allEvents.map((event) => (
                <tr key={event.slug} className="text-slate-300">
                  <td className="max-w-xs truncate px-5 py-3 font-medium text-white">
                    {event.title}
                  </td>
                  <td className="px-5 py-3 text-slate-400">{event.year}</td>
                  <td className="px-5 py-3">{event.format}</td>
                  <td className="px-5 py-3">{event.topic}</td>
                  <td className="px-5 py-3">
                    {event.featured && (
                      <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/events/${event.slug}/edit`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <DeleteItemButton deleteUrl={`/api/admin/events/${event.slug}`} title={event.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
