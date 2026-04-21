"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyIdPillProps {
  value: string;
  /** If true, nudges visitors toward AWS's manual verification flow. */
  hintForAws?: boolean;
}

export function CopyIdPill({ value, hintForAws = false }: CopyIdPillProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent | React.KeyboardEvent) => {
      // Don't follow the surrounding verify-link when clicking the pill.
      e.preventDefault();
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      } catch {
        // Clipboard API can fail in insecure contexts; fall back silently.
      }
    },
    [value]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") handleCopy(e);
    },
    [handleCopy]
  );

  const title = copied
    ? "Copied!"
    : hintForAws
      ? `Click to copy \u2014 paste into AWS's verification page`
      : `Click to copy credential ID`;

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      title={title}
      aria-label={title}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/60 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <span className="select-all">ID: {value}</span>
      {copied ? (
        <Check className="w-2.5 h-2.5 text-accent-600 dark:text-accent-500" aria-hidden="true" />
      ) : (
        <Copy className="w-2.5 h-2.5 opacity-60" aria-hidden="true" />
      )}
    </span>
  );
}
