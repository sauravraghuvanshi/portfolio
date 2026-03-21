"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  PenSquare,
  BookOpen,
  FolderKanban,
  Plus,
  LogOut,
} from "lucide-react";

const navSections = [
  {
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Blog",
    items: [
      { label: "Blog Posts", href: "/admin/blog", icon: FileText },
      { label: "New Post", href: "/admin/blog/new", icon: PenSquare },
    ],
  },
  {
    title: "Case Studies",
    items: [
      { label: "Case Studies", href: "/admin/case-studies", icon: BookOpen },
      { label: "New Case Study", href: "/admin/case-studies/new", icon: Plus },
    ],
  },
  {
    title: "Projects",
    items: [
      { label: "Projects", href: "/admin/projects", icon: FolderKanban },
      { label: "New Project", href: "/admin/projects/new", icon: Plus },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-slate-800 bg-surface-dark">
      <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <span className="text-sm font-bold text-white">S</span>
        </div>
        <span className="text-sm font-semibold text-white">Admin Panel</span>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navSections.map((section, si) => (
          <div key={si}>
            {section.title && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = (item as { exact?: boolean }).exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-brand-600/15 text-brand-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
