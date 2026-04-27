"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Eye,
  Code2,
  Link2,
  Save,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  ZoomIn,
  Pen,
  X,
  Wand2,
} from "lucide-react";
import type { AIContentType, AIWriterPayload, ImageTask } from "@/types/ai-writer";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";

interface ContentPreviewProps {
  payload: AIWriterPayload | null;
  rawJson: string;
  onSave: () => void;
  onRegenerate: () => void;
  isSaving: boolean;
  contentType: AIContentType;
  imageTasks: ImageTask[];
  isGeneratingImages: boolean;
  imageProgress: string;
  onGenerateImages: () => void;
  onRetryImage: (taskId: string) => void;
  onRegenImageWithFeedback: (taskId: string, feedback: string) => void;
  onRewriteSection: (start: number, end: number, selectedText: string, feedback: string) => Promise<void>;
  bodyMarkdownOverride?: string;
}

type Tab = "preview" | "json" | "sources";

export default function ContentPreview({
  payload,
  rawJson,
  onSave,
  onRegenerate,
  isSaving,
  contentType,
  imageTasks,
  isGeneratingImages,
  imageProgress,
  onGenerateImages,
  onRetryImage,
  onRegenImageWithFeedback,
  onRewriteSection,
  bodyMarkdownOverride,
}: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [copied, setCopied] = useState(false);

  // Image lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Per-image regenerate feedback
  const [imageFeedbackOpen, setImageFeedbackOpen] = useState<string | null>(null);
  const [imageFeedbackText, setImageFeedbackText] = useState<Record<string, string>>({});

  // Section rewrite (edit mode)
  const [isEditMode, setIsEditMode] = useState(false);
  const [textSelection, setTextSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [rewriteFeedback, setRewriteFeedback] = useState("");
  const [isRewriting, setIsRewriting] = useState(false);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const config = CONTENT_TYPES[contentType];
  const activeMarkdown = bodyMarkdownOverride ?? payload?.bodyMarkdown ?? "";

  const handleCopy = useCallback(async () => {
    const text = activeTab === "json" ? rawJson : activeMarkdown;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeTab, rawJson, activeMarkdown]);

  const handleTextareaSelect = useCallback(() => {
    const ta = editTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start !== end) {
      setTextSelection({ start, end, text: ta.value.slice(start, end) });
    } else {
      setTextSelection(null);
      setRewriteFeedback("");
    }
  }, []);

  const handleRewriteSubmit = useCallback(async () => {
    if (!textSelection || !rewriteFeedback.trim()) return;
    setIsRewriting(true);
    try {
      await onRewriteSection(textSelection.start, textSelection.end, textSelection.text, rewriteFeedback);
      setTextSelection(null);
      setRewriteFeedback("");
    } finally {
      setIsRewriting(false);
    }
  }, [textSelection, rewriteFeedback, onRewriteSection]);

  const handleImageRegenSubmit = useCallback(
    (taskId: string) => {
      const feedback = imageFeedbackText[taskId]?.trim();
      if (!feedback) return;
      onRegenImageWithFeedback(taskId, feedback);
      setImageFeedbackOpen(null);
      setImageFeedbackText((prev) => ({ ...prev, [taskId]: "" }));
    },
    [imageFeedbackText, onRegenImageWithFeedback]
  );

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
            onClick={() => { setActiveTab(tab.key); setIsEditMode(false); }}
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
            {/* Cover image */}
            {payload.coverImage ? (
              <img
                src={payload.coverImage}
                alt={payload.title}
                className="w-full rounded-lg object-cover max-h-52 cursor-zoom-in"
                onClick={() => setLightboxUrl(payload.coverImage!)}
              />
            ) : payload.coverImagePrompt ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-800/40 px-3 py-3 text-xs text-slate-500">
                <ImageIcon className="h-4 w-4 flex-shrink-0 text-slate-600" />
                <span className="truncate">Cover image pending: {payload.coverImagePrompt.slice(0, 80)}…</span>
              </div>
            ) : null}

            {/* Image generation panel */}
            {imageTasks.length > 0 && (
              <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Images ({imageTasks.length})
                    {imageProgress && (
                      <span className="text-slate-500 font-normal">— {imageProgress} done</span>
                    )}
                  </span>
                  {!isGeneratingImages && imageTasks.some((t) => t.status !== "done") && (
                    <button
                      onClick={onGenerateImages}
                      className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-brand-500 transition-colors"
                    >
                      <ImageIcon className="h-3 w-3" />
                      Generate Images
                    </button>
                  )}
                </div>

                {imageTasks.map((task) => (
                  <div key={task.id} className="space-y-1">
                    {/* Main task row */}
                    <div className="flex items-center gap-2 rounded-md bg-slate-900/50 px-2.5 py-2 text-xs">
                      {task.status === "pending" && <Clock className="h-3.5 w-3.5 text-slate-500 flex-shrink-0" />}
                      {task.status === "generating" && <Loader2 className="h-3.5 w-3.5 text-brand-400 animate-spin flex-shrink-0" />}
                      {task.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />}
                      {task.status === "error" && <XCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}

                      <span className="flex-1 truncate text-slate-400">
                        <span className="text-slate-300 font-medium">{task.id === "cover" ? "Cover" : task.id}:</span>{" "}
                        {task.prompt.slice(0, 50)}{task.prompt.length > 50 ? "…" : ""}
                      </span>

                      {task.status === "done" && task.url && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Clickable thumbnail → lightbox */}
                          <button
                            onClick={() => setLightboxUrl(task.url!)}
                            title="Preview full size"
                            className="relative group"
                          >
                            <img src={task.url} alt="" className="h-8 w-8 rounded object-cover ring-1 ring-transparent group-hover:ring-brand-500 transition" />
                            <ZoomIn className="absolute inset-0 m-auto h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition" />
                          </button>
                          {/* Regenerate with feedback toggle */}
                          <button
                            onClick={() => setImageFeedbackOpen(imageFeedbackOpen === task.id ? null : task.id)}
                            title="Regenerate with feedback"
                            className={`rounded p-1 text-[10px] transition-colors ${
                              imageFeedbackOpen === task.id
                                ? "bg-brand-500/20 text-brand-400"
                                : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                            }`}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      {task.status === "error" && (
                        <button
                          onClick={() => onRetryImage(task.id)}
                          disabled={isGeneratingImages}
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Retry
                        </button>
                      )}
                    </div>

                    {/* Inline regenerate feedback input */}
                    {imageFeedbackOpen === task.id && (
                      <div className="ml-5 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={imageFeedbackText[task.id] ?? ""}
                          onChange={(e) =>
                            setImageFeedbackText((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleImageRegenSubmit(task.id);
                            if (e.key === "Escape") setImageFeedbackOpen(null);
                          }}
                          placeholder="Describe what to change…"
                          className="flex-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-[11px] text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none"
                          autoFocus
                          disabled={isGeneratingImages}
                        />
                        <button
                          onClick={() => handleImageRegenSubmit(task.id)}
                          disabled={isGeneratingImages || !imageFeedbackText[task.id]?.trim()}
                          className="flex items-center gap-1 rounded-md bg-brand-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-40"
                        >
                          <Wand2 className="h-3 w-3" />
                          Regen
                        </button>
                        <button
                          onClick={() => setImageFeedbackOpen(null)}
                          className="rounded-md p-1 text-slate-500 hover:text-white transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <h2 className="text-lg font-bold text-white">{payload.title}</h2>
            {payload.summary && (
              <p className="text-sm text-slate-400 italic">{payload.summary}</p>
            )}

            {/* Edit mode toggle */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Content</span>
              <button
                onClick={() => { setIsEditMode((v) => !v); setTextSelection(null); setRewriteFeedback(""); }}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  isEditMode
                    ? "bg-brand-500/15 text-brand-400"
                    : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <Pen className="h-2.5 w-2.5" />
                {isEditMode ? "Exit Edit" : "Edit & Rewrite"}
              </button>
            </div>

            {isEditMode ? (
              /* Edit mode: textarea + selection-based rewrite */
              <div className="space-y-2">
                <textarea
                  ref={editTextareaRef}
                  value={activeMarkdown}
                  readOnly
                  rows={16}
                  onMouseUp={handleTextareaSelect}
                  onKeyUp={handleTextareaSelect}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/60 p-3 text-[11px] font-mono leading-relaxed text-slate-200 focus:outline-none resize-none scrollbar-hide"
                />

                {/* Rewrite toolbar — appears when text is selected */}
                {textSelection && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg border border-brand-500/30 bg-slate-800 p-2.5 space-y-2"
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Wand2 className="h-3 w-3 text-brand-400" />
                      <span className="font-medium text-brand-400">Rewrite selection</span>
                      <span className="text-slate-600">·</span>
                      <span className="truncate max-w-[180px] italic text-slate-500">&quot;{textSelection.text.slice(0, 60)}{textSelection.text.length > 60 ? "…" : ""}&quot;</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <textarea
                        value={rewriteFeedback}
                        onChange={(e) => setRewriteFeedback(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleRewriteSubmit();
                          }
                        }}
                        placeholder="What should change? e.g. 'Make this more concise' or 'Add a specific example'"
                        rows={2}
                        className="flex-1 rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none resize-none"
                        autoFocus
                        disabled={isRewriting}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-600">Enter to rewrite · Shift+Enter for new line</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setTextSelection(null); setRewriteFeedback(""); }}
                          className="rounded-md px-2 py-0.5 text-[10px] text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRewriteSubmit}
                          disabled={isRewriting || !rewriteFeedback.trim()}
                          className="flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1 text-[10px] font-medium text-white hover:bg-brand-500 transition-colors disabled:opacity-40"
                        >
                          {isRewriting ? (
                            <><Loader2 className="h-3 w-3 animate-spin" /> Rewriting…</>
                          ) : (
                            <><Wand2 className="h-3 w-3" /> Rewrite</>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Normal mode: rendered markdown */
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="mt-5 mb-2 text-base font-bold text-white">{children}</h1>,
                  h2: ({ children }) => <h2 className="mt-4 mb-1.5 text-sm font-bold text-white border-b border-slate-800 pb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="mt-3 mb-1 text-sm font-semibold text-slate-200">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 text-xs leading-relaxed text-slate-300">{children}</p>,
                  ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 text-xs text-slate-300">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 text-xs text-slate-300">{children}</ol>,
                  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-400 underline underline-offset-2 hover:text-brand-300">
                      {children}
                    </a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="mb-3 border-l-2 border-brand-500 pl-3 text-xs italic text-slate-400">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.startsWith("language-");
                    if (isBlock) {
                      const lang = className?.replace("language-", "") ?? "";
                      return (
                        <div className="mb-3 overflow-hidden rounded-lg border border-slate-700">
                          {lang && (
                            <div className="bg-slate-800 px-3 py-1 text-[10px] font-mono text-slate-500 border-b border-slate-700">
                              {lang}
                            </div>
                          )}
                          <pre className="overflow-x-auto bg-slate-900 p-3">
                            <code className="text-[11px] font-mono leading-relaxed text-slate-200">{children}</code>
                          </pre>
                        </div>
                      );
                    }
                    return <code className="rounded bg-slate-800 px-1 py-0.5 text-[11px] font-mono text-accent-300" {...props}>{children}</code>;
                  },
                  pre: ({ children }) => <>{children}</>,
                  img: ({ src, alt }) => (
                    src ? (
                      <img
                        src={src as string}
                        alt={alt ?? ""}
                        className="my-3 w-full rounded-lg border border-slate-700 object-cover cursor-zoom-in"
                        onClick={() => typeof src === "string" && setLightboxUrl(src)}
                      />
                    ) : null
                  ),
                  hr: () => <hr className="my-4 border-slate-800" />,
                  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                  em: ({ children }) => <em className="text-slate-400">{children}</em>,
                  table: ({ children }) => (
                    <div className="mb-3 overflow-x-auto">
                      <table className="w-full text-xs border-collapse">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => <th className="border border-slate-700 bg-slate-800 px-2 py-1 text-left font-semibold text-white">{children}</th>,
                  td: ({ children }) => <td className="border border-slate-700 px-2 py-1 text-slate-300">{children}</td>,
                }}
              >
                {activeMarkdown}
              </ReactMarkdown>
            )}

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

      {/* Image lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 rounded-full bg-slate-800 p-2 text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Full size preview"
            className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}
