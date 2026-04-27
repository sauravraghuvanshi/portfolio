"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ChevronRight, ExternalLink } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  blog: "Blogs",
  "case-studies": "Case Studies",
  projects: "Projects",
  talks: "Talks",
  events: "Events",
  certifications: "Certifications",
  "ai-writer": "AI Writer",
  seo: "SEO",
  infra: "Infrastructure",
  new: "New",
  edit: "Edit",
};

function labelize(seg: string): string {
  return SEGMENT_LABELS[seg] ?? seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminTopBar() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // e.g. ["admin", "blog", "foo", "edit"]

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    return { href, label: labelize(seg) };
  });

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-6 backdrop-blur-md"
    >
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link
          href="/admin"
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-800 hover:text-white"
          aria-label="Admin home"
        >
          <Home className="h-3.5 w-3.5" />
        </Link>
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <div key={c.href} className="flex items-center gap-1.5 truncate">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              {isLast ? (
                <span className="truncate font-medium text-white">{c.label}</span>
              ) : (
                <Link
                  href={c.href}
                  className="truncate text-slate-400 transition hover:text-white"
                >
                  {c.label}
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
        >
          View site
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </motion.header>
  );
}
