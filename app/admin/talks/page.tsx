import Link from "next/link";
import { getTalks } from "@/lib/content";
import { Plus, PenSquare } from "lucide-react";
import DeleteItemButton from "@/components/admin/DeleteItemButton";

export default function AdminTalksListPage() {
  const allTalks = getTalks(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Talks</h1>
        <Link
          href="/admin/talks/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Talk
        </Link>
      </div>

      {allTalks.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-dark px-5 py-16 text-center">
          <p className="text-slate-400">No talks yet.</p>
          <Link
            href="/admin/talks/new"
            className="mt-2 inline-block text-sm text-brand-400 hover:underline"
          >
            Create your first talk
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Topic</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Featured</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allTalks.map((talk) => (
                <tr key={talk.id} className="text-slate-300">
                  <td className="max-w-xs truncate px-5 py-3 font-medium text-white">
                    {talk.title}
                  </td>
                  <td className="px-5 py-3">{talk.topic}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        talk.status === "published"
                          ? "bg-accent-500/15 text-accent-400"
                          : "bg-yellow-500/15 text-yellow-400"
                      }`}
                    >
                      {talk.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {talk.featured && (
                      <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/talks/${talk.id}/edit`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <DeleteItemButton deleteUrl={`/api/admin/talks/${talk.id}`} title={talk.title} />
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
