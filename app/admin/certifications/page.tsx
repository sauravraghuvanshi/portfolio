import Link from "next/link";
import { getCertifications } from "@/lib/content";
import { Plus, PenSquare } from "lucide-react";
import DeleteItemButton from "@/components/admin/DeleteItemButton";

export default function AdminCertificationsListPage() {
  const certifications = getCertifications();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Certifications</h1>
        <Link
          href="/admin/certifications/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Certification
        </Link>
      </div>

      {certifications.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-dark px-5 py-16 text-center">
          <p className="text-slate-400">No certifications yet.</p>
          <Link
            href="/admin/certifications/new"
            className="mt-2 inline-block text-sm text-brand-400 hover:underline"
          >
            Add your first certification
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Issuer</th>
                <th className="px-5 py-3 font-medium">Year</th>
                <th className="px-5 py-3 font-medium">Color</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {certifications.map((cert) => (
                <tr key={cert.code} className="text-slate-300">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-white">
                    {cert.code}
                  </td>
                  <td className="max-w-xs truncate px-5 py-3 font-medium text-white">
                    {cert.name}
                  </td>
                  <td className="px-5 py-3">{cert.issuer}</td>
                  <td className="px-5 py-3 text-slate-400">{cert.year}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium capitalize text-slate-300">
                      {cert.color}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/certifications/${cert.code}/edit`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <DeleteItemButton deleteUrl={`/api/admin/certifications/${cert.code}`} title={cert.name} />
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
