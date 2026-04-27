"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Sparkles, Search, Server, RefreshCcw } from "lucide-react";

const ACTIONS = [
  { label: "AI Writer", href: "/admin/ai-writer", icon: Sparkles, hint: "Draft content with the agent" },
  { label: "New Blog", href: "/admin/blog/new", icon: Plus, hint: "Write a new post" },
  { label: "New Case Study", href: "/admin/case-studies/new", icon: Plus, hint: "Document a deep-dive" },
  { label: "SEO check", href: "/admin/seo", icon: Search, hint: "Audit metadata health" },
  { label: "Infra status", href: "/admin/infra", icon: Server, hint: "Service & build health" },
  { label: "Reindex AI", href: "/admin/ai-writer", icon: RefreshCcw, hint: "Refresh chatbot grounding" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {ACTIONS.map((a, i) => (
        <motion.div
          key={a.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.35 }}
        >
          <Link
            href={a.href}
            className="group flex h-full flex-col rounded-xl border border-slate-800/80 bg-slate-900/40 p-3.5 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-slate-900/70"
          >
            <a.icon className="h-4 w-4 text-brand-400 transition group-hover:scale-110" />
            <p className="mt-2 text-sm font-medium text-white">{a.label}</p>
            <p className="text-[11px] text-slate-500">{a.hint}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
