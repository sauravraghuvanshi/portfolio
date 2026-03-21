"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const PRESETS = ["25%", "50%", "75%", "100%"];

interface MediaResizeBarProps {
  mediaLabel: string;
  currentWidth: string;
  onResize: (width: string) => void;
  onDismiss: () => void;
}

export default function MediaResizeBar({
  mediaLabel,
  currentWidth,
  onResize,
  onDismiss,
}: MediaResizeBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 15000);
    return () => clearTimeout(timerRef.current);
  }, [onDismiss]);

  function handleResize(width: string) {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onDismiss, 15000);
    onResize(width);
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-surface-dark px-4 py-2">
      <span className="truncate text-xs text-slate-400">{mediaLabel}</span>
      <div className="flex items-center gap-1">
        {PRESETS.map((size) => (
          <button
            key={size}
            onClick={() => handleResize(size)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              currentWidth === size
                ? "bg-brand-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <button
        onClick={onDismiss}
        className="ml-auto rounded-md p-1 text-slate-500 transition hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
