import Link from "next/link";
import { getTechRadar } from "@/lib/content";
import { Plus, PenSquare } from "lucide-react";
import DeleteItemButton from "@/components/admin/DeleteItemButton";

const RING_BADGE: Record<string, string> = {
  adopt: "bg-emerald-500/15 text-emerald-400",
  trial: "bg-blue-500/15 text-blue-400",
  assess: "bg-yellow-500/15 text-yellow-400",
  hold: "bg-red-500/15 text-red-400",
};

export default function AdminTechRadarPage() {
  const radar = getTechRadar();
  const entries = radar?.entries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tech Radar</h1>
          {radar && (
            <p className="text-sm text-slate-400 mt-0.5">
              Edition {radar.edition} · {entries.length} entries
            </p>
          )}
        </div>
        <Link
          href="/admin/tech-radar/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-dark px-5 py-16 text-center">
          <p className="text-slate-400">No radar entries yet.</p>
          <Link
            href="/admin/tech-radar/new"
            className="mt-2 inline-block text-sm text-brand-400 hover:underline"
          >
            Add your first entry
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Quadrant</th>
                <th className="px-5 py-3 font-medium">Ring</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Tags</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="text-slate-300">
                  <td className="px-5 py-3 font-medium text-white max-w-xs truncate">
                    {entry.name}
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-400">{entry.quadrant}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${RING_BADGE[entry.ring] ?? ""}`}>
                      {entry.ring}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-slate-500 text-xs">
                    {entry.tags?.join(", ") ?? "—"}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/tech-radar/${entry.id}/edit`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <DeleteItemButton
                        deleteUrl={`/api/admin/tech-radar/${entry.id}`}
                        title={entry.name}
                      />
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
