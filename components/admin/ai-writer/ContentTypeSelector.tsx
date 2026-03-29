"use client";

import { motion } from "framer-motion";
import {
  FileText,
  BookOpen,
  FolderKanban,
  Video,
  Calendar,
  Share2,
} from "lucide-react";
import type { AIContentType } from "@/types/ai-writer";
import { getAllContentTypes } from "@/lib/ai/content-schemas";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  BookOpen,
  FolderKanban,
  Video,
  Calendar,
  Share2,
};

interface ContentTypeSelectorProps {
  onSelect: (type: AIContentType) => void;
}

export default function ContentTypeSelector({ onSelect }: ContentTypeSelectorProps) {
  const types = getAllContentTypes();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white">What would you like to create?</h2>
        <p className="text-sm text-slate-400 mt-1">
          Select a content type and I&apos;ll guide you through the process.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {types.map((config, i) => {
          const Icon = ICON_MAP[config.icon] ?? FileText;
          return (
            <motion.button
              key={config.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => onSelect(config.key)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-5 text-center transition-all hover:border-brand-500/50 hover:bg-brand-500/10 hover:shadow-lg hover:shadow-brand-500/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400 transition-colors group-hover:bg-brand-500/20">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{config.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                  {config.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
