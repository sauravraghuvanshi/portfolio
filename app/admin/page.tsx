import Link from "next/link";
import { getAllBlogPosts, getAllCaseStudies, getProjects, getTalks, getEvents } from "@/lib/content";
import { formatDate } from "@/lib/utils";
import { FileText, Eye, PenSquare, Plus, BookOpen, FolderKanban, Video, Calendar } from "lucide-react";

export default function AdminDashboard() {
  const allPosts = getAllBlogPosts(true);
  const published = allPosts.filter((p) => p.status === "published");
  const drafts = allPosts.filter((p) => p.status === "draft");
  const caseStudies = getAllCaseStudies();
  const projects = getProjects();
  const talks = getTalks();
  const events = getEvents();

  const stats = [
    { label: "Blog Posts", value: allPosts.length, icon: FileText },
    { label: "Published", value: published.length, icon: Eye },
    { label: "Drafts", value: drafts.length, icon: PenSquare },
    { label: "Case Studies", value: caseStudies.length, icon: BookOpen },
    { label: "Projects", value: projects.length, icon: FolderKanban },
    { label: "Talks", value: talks.length, icon: Video },
    { label: "Events", value: events.length, icon: Calendar },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            New Post
          </Link>
          <Link
            href="/admin/case-studies/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-surface-dark px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Case Study
          </Link>
          <Link
            href="/admin/projects/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-surface-dark px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
          <Link
            href="/admin/talks/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-surface-dark px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Talk
          </Link>
          <Link
            href="/admin/events/new"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-surface-dark px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
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

      {/* Recent Blog Posts */}
      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Blog Posts</h2>
          <Link href="/admin/blog" className="text-xs text-brand-400 hover:underline">
            View all
          </Link>
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
            {allPosts.slice(0, 5).map((post) => (
              <div
                key={post.slug}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {post.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(post.date)} &middot; {post.category.join(", ")}
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

      {/* Recent Case Studies */}
      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Case Studies</h2>
          <Link href="/admin/case-studies" className="text-xs text-brand-400 hover:underline">
            View all
          </Link>
        </div>
        {caseStudies.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            No case studies yet.{" "}
            <Link href="/admin/case-studies/new" className="text-brand-400 hover:underline">
              Create your first case study
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {caseStudies.slice(0, 5).map((cs) => (
              <div
                key={cs.slug}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {cs.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {cs.category.join(", ")} &middot; {cs.timeline}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {cs.featured && (
                    <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                      Featured
                    </span>
                  )}
                  <Link
                    href={`/admin/case-studies/${cs.slug}/edit`}
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

      {/* Recent Projects */}
      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Projects</h2>
          <Link href="/admin/projects" className="text-xs text-brand-400 hover:underline">
            View all
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            No projects yet.{" "}
            <Link href="/admin/projects/new" className="text-brand-400 hover:underline">
              Create your first project
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {project.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {project.category.join(", ")} &middot; {project.year}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {project.featured && (
                    <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                      Featured
                    </span>
                  )}
                  <Link
                    href={`/admin/projects/${project.id}/edit`}
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

      {/* Recent Talks */}
      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Talks</h2>
          <Link href="/admin/talks" className="text-xs text-brand-400 hover:underline">
            View all
          </Link>
        </div>
        {talks.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            No talks yet.{" "}
            <Link href="/admin/talks/new" className="text-brand-400 hover:underline">
              Create your first talk
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {talks.slice(0, 5).map((talk) => (
              <div
                key={talk.id}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {talk.title}
                  </p>
                  <p className="text-xs text-slate-400">{talk.topic}</p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {talk.featured && (
                    <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                      Featured
                    </span>
                  )}
                  <Link
                    href={`/admin/talks/${talk.id}/edit`}
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

      {/* Recent Events */}
      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Events</h2>
          <Link href="/admin/events" className="text-xs text-brand-400 hover:underline">
            View all
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400">
            No events yet.{" "}
            <Link href="/admin/events/new" className="text-brand-400 hover:underline">
              Create your first event
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.slug}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {event.format} &middot; {event.year} &middot; {event.topic}
                  </p>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  {event.featured && (
                    <span className="rounded-full bg-accent-500/15 px-2 py-0.5 text-xs font-medium text-accent-400">
                      Featured
                    </span>
                  )}
                  <Link
                    href={`/admin/events/${event.slug}/edit`}
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
