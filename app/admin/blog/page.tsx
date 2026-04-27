import Link from "next/link";
import { getAllBlogPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { Plus, PenSquare, Eye, ExternalLink } from "lucide-react";
import DeleteItemButton from "@/components/admin/DeleteItemButton";

export default function AdminBlogListPage() {
  const allPosts = getAllBlogPosts(true);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Blogs</h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Blog
        </Link>
      </div>

      {allPosts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-surface-dark px-5 py-16 text-center">
          <p className="text-slate-400">No blog posts yet.</p>
          <Link
            href="/admin/blog/new"
            className="mt-2 inline-block text-sm text-brand-400 hover:underline"
          >
            Create your first post
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-surface-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-xs uppercase text-slate-400">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Featured</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {allPosts.map((post) => (
                <tr key={post.slug} className="text-slate-300">
                  <td className="max-w-xs truncate px-5 py-3 font-medium text-white">
                    {post.title}
                    {post.externalUrl && (
                      <ExternalLink className="ml-1.5 inline h-3 w-3 text-slate-500" />
                    )}
                  </td>
                  <td className="px-5 py-3">{post.category.join(", ")}</td>
                  <td className="px-5 py-3 text-slate-400">
                    {formatDate(post.date)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        post.status === "published"
                          ? "bg-accent-500/15 text-accent-400"
                          : "bg-yellow-500/15 text-yellow-400"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {post.featured && (
                      <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/blog/${post.slug}`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/blog/${post.slug}/edit`}
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                        title="Edit"
                      >
                        <PenSquare className="h-4 w-4" />
                      </Link>
                      <DeleteItemButton deleteUrl={`/api/admin/blog/${post.slug}`} title={post.title} />
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
