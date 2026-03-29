"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye,
  Code2,
  Link2,
  Save,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import type { AIContentType, AIWriterPayload } from "@/types/ai-writer";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";

interface ContentPreviewProps {
  payload: AIWriterPayload | null;
  rawJson: string;
  onSave: () => void;
  onRegenerate: () => void;
  isSaving: boolean;
  contentType: AIContentType;
}

type Tab = "preview" | "json" | "sources";

export default function ContentPreview({
  payload,
  rawJson,
  onSave,
  onRegenerate,
  isSaving,
  contentType,
}: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);

  const config = CONTENT_TYPES[contentType];

  const handleCopy = useCallback(async () => {
    const text =
      activeTab === "json" ? rawJson : payload?.bodyMarkdown ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeTab, rawJson, payload]);

  if (!payload) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "preview", label: "Preview", icon: <Eye className="h-3 w-3" /> },
    { key: "json", label: "JSON", icon: <Code2 className="h-3 w-3" /> },
    { key: "sources", label: "Sources", icon: <Link2 className="h-3 w-3" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex h-full flex-col"
    >
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-3">
        <h3 className="text-sm font-semibold text-white">
          Generated {config.label}
        </h3>
        <div className="flex gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Regenerate
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 rounded-lg bg-slate-800/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-slate-700 text-white"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "sources" && payload.sources.length > 0 && (
              <span className="ml-1 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[9px] text-brand-400 font-bold">
                {payload.sources.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50 p-4 scrollbar-hide">
        {activeTab === "preview" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">{payload.title}</h2>
            {payload.summary && (
              <p className="text-sm text-slate-400 italic">{payload.summary}</p>
            )}
            <div className="prose prose-sm prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
              {payload.bodyMarkdown}
            </div>
            {payload.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                {payload.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "json" && (
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
            {rawJson}
          </pre>
        )}

        {activeTab === "sources" && (
          <div className="space-y-3">
            {payload.sources.length > 0 ? (
              payload.sources.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg p-2 text-xs text-brand-400 hover:bg-slate-800 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{url}</span>
                </a>
              ))
            ) : (
              <p className="text-xs text-slate-500">No external sources were used.</p>
            )}
          </div>
        )}
      </div>

      {/* Verification notes */}
      {payload.verificationNotes.length > 0 && (
        <div className="mt-3 rounded-lg border border-yellow-800/50 bg-yellow-900/10 p-3">
          <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold mb-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs Verification
          </div>
          <ul className="space-y-1">
            {payload.verificationNotes.map((note, i) => (
              <li key={i} className="text-xs text-yellow-300/80">
                • {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Save button */}
      {config.saveable && (
        <button
          onClick={onSave}
          disabled={isSaving}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : `Save as ${config.label}`}
        </button>
      )}

      {!config.saveable && (
        <button
          onClick={handleCopy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
        >
          <Copy className="h-4 w-4" />
          Copy to Clipboard
        </button>
      )}
    </motion.div>
  );
}
