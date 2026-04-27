"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import {
  FileText,
  BookOpen,
  FolderKanban,
  Video,
  Calendar,
  Award,
  Eye,
  Sparkles,
} from "lucide-react";
import type { ContentKind, ActivityItem } from "@/lib/admin-metrics";
import { MotionCard } from "../ui/MotionCard";

const KIND_META: Record<
  ContentKind,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  blog: { label: "Blog", icon: FileText, color: "text-sky-400" },
  "case-study": { label: "Case Study", icon: BookOpen, color: "text-cyan-400" },
  project: { label: "Project", icon: FolderKanban, color: "text-violet-400" },
  talk: { label: "Talk", icon: Video, color: "text-pink-400" },
  event: { label: "Event", icon: Calendar, color: "text-orange-400" },
  certification: { label: "Cert", icon: Award, color: "text-emerald-400" },
};

function StatusPill({ status, featured }: { status: ActivityItem["status"]; featured: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {featured && (
        <span
          title="Featured"
          className="inline-flex items-center gap-0.5 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300"
        >
          <Sparkles className="h-2.5 w-2.5" />
          Featured
        </span>
      )}
      <span
        className={
          "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
          (status === "published"
            ? "bg-emerald-500/10 text-emerald-300"
            : "bg-yellow-500/10 text-yellow-300")
        }
      >
        {status === "published" && <Eye className="h-2.5 w-2.5" />}
        {status}
      </span>
    </div>
  );
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <MotionCard className="p-8 text-center text-sm text-slate-400">
        No recent activity yet.
      </MotionCard>
    );
  }

  return (
    <MotionCard className="overflow-hidden">
      <ul className="divide-y divide-slate-800/80">
        {items.map((item, i) => {
          const meta = KIND_META[item.kind];
          const Icon = meta.icon;
          return (
            <motion.li
              key={`${item.kind}-${item.href}-${i}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-800/30"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800/60 " + meta.color}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      <span className="text-slate-400">{meta.label}</span>
                      {item.meta ? <> · {item.meta}</> : null}
                      {item.date ? (
                        <> · {/^\d{4}$/.test(item.date) ? item.date : formatDate(item.date)}</>
                      ) : null}
                    </p>
                  </div>
                </div>
                <StatusPill status={item.status} featured={item.featured} />
              </Link>
            </motion.li>
          );
        })}
      </ul>
    </MotionCard>
  );
}
