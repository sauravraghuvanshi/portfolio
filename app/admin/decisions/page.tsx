import Link from "next/link";
import { getADRGallery } from "@/lib/content";
import { Plus, PenSquare } from "lucide-react";
import DeleteItemButton from "@/components/admin/DeleteItemButton";

const STATUS_BADGE: Record<string, string> = {
  accepted: "bg-emerald-500/15 text-emerald-400",
  proposed: "bg-yellow-500/15 text-yellow-400",
  deprecated: "bg-red-500/15 text-red-400",
  superseded: "bg-slate-500/15 text-slate-400",
};

export default function AdminDecisionsPage() {
  const gallery = getADRGallery();
  const entries = gallery?.entries ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Architecture Decision Records</h1>
          <p className="text-sm text-slate-400 mt-0.5">{entries.length} decisions recorded</p>
        </div>
        <Link
          href="/admin/decisions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New ADR
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-dark px-5 py-16 text-center">
          <p className="text-slate-400">No ADRs yet.</p>
          <Link
            href="/admin/decisions/new"
            className="mt-2 inline-block text-sm text-brand-400 hover:underline"
          >
            Add your first decision
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface-dark overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium w-20">No.</th>
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">WAF Pillars</th>
                <th className="px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {entries.map((entry) => (
                <tr key={entry.id} className="text-slate-300">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">
                    ADR-{String(entry.number).padStart(3, "0")}
                  </td>
                  <td className="px-5 py-3 font-medium text-white max-w-xs truncate">
                    {entry.title}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_BADGE[entry.status] ?? ""
                      }`}
                    >
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-slate-500 text-xs">
                    {entry.wafPillars.join(", ")}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell text-slate-500 text-xs">
                    {entry.date}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/decisions/${entry.id}/edit`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <DeleteItemButton
                        deleteUrl={`/api/admin/decisions/${entry.id}`}
                        title={entry.title}
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
