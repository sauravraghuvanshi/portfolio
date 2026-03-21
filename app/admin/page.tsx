import Link from "next/link";
import { getAllBlogPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { FileText, Eye, PenSquare, Plus } from "lucide-react";

export default function AdminDashboard() {
  const allPosts = getAllBlogPosts(true);
  const published = allPosts.filter((p) => p.status === "published");
  const drafts = allPosts.filter((p) => p.status === "draft");

  const stats = [
    { label: "Total Posts", value: allPosts.length, icon: FileText },
    { label: "Published", value: published.length, icon: Eye },
    { label: "Drafts", value: drafts.length, icon: PenSquare },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <Link
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-800 bg-surface-dark p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/15">
                <stat.icon className="h-5 w-5 text-brand-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Recent Posts</h2>
        </div>
        {allPosts.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            No posts yet.{" "}
            <Link href="/admin/blog/new" className="text-brand-400 hover:underline">
              Create your first post
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {allPosts.slice(0, 10).map((post) => (
              <div
                key={post.slug}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(post.date)} &middot; {post.category}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.status === "published"
                        ? "bg-accent-500/15 text-accent-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}
                  >
                    {post.status}
                  </span>
                  <Link
                    href={`/admin/blog/${post.slug}/edit`}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  >
                    <PenSquare className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
