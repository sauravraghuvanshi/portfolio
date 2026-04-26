"use client";

import {
  useState,
  useCallback,
  useMemo,
  useRef,
  FormEvent,
  useEffect,
  ChangeEvent,
} from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  ArrowLeft,
  Sparkles,
  Paperclip,
  X,
  Image as ImageIcon,
  FileText,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { AIContentType, AIWriterPayload, ImageTask } from "@/types/ai-writer";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import { processAllMarkers, applyImageResults } from "@/lib/ai/marker-processing";
import { triggerReindex } from "@/lib/triggerReindex";
import ContentTypeSelector from "./ai-writer/ContentTypeSelector";
import ChatMessages from "./ai-writer/ChatMessages";
import { getMessageText } from "./ai-writer/ChatMessages";
import ContentPreview from "./ai-writer/ContentPreview";
import { useImageGeneration } from "./ai-writer/useImageGeneration";

interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  dataUrl: string;   // base64 data URL for images
  content?: string;  // text content for files
  mimeType: string;
  size: number;
}

export default function AIWriter() {
  const router = useRouter();
  const [contentType, setContentType] = useState<AIContentType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const contentTypeRef = useRef<AIContentType | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep ref in sync
  contentTypeRef.current = contentType;

  // Single transport instance — body is a function so it always reads latest contentType
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/admin/ai-writer",
        body: () => ({ contentType: contentTypeRef.current }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { messages, sendMessage, status, setMessages, error } =
    useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";
  const imageGen = useImageGeneration();

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (isExpanded) return; // don't auto-resize when in expanded mode
    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, 200); // max 200px in normal mode
    el.style.height = `${newHeight}px`;
  }, [input, isExpanded]);

  // Extract JSON payload from the last assistant message
  const { payload, rawJson } = useMemo(() => {
    const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAI) return { payload: null, rawJson: "" };

    const text = getMessageText(lastAI);
    const jsonMatch = text.match(/```json\n([\s\S]*)\n```\s*$/);
    if (!jsonMatch) return { payload: null, rawJson: "" };

    try {
      const parsed = JSON.parse(jsonMatch[1]) as AIWriterPayload;
      // Process all markers: Mermaid → fences, YouTube → iframes, extract image tasks
      if (parsed.bodyMarkdown) {
        const { processed, imageTasks } = processAllMarkers(parsed.bodyMarkdown);
        parsed.bodyMarkdown = processed;
        // Initialize image tasks if we got new ones (only on first parse)
        if (imageTasks.length > 0 && imageGen.tasks.length === 0) {
          imageGen.initTasks(imageTasks);
        }
      }
      return { payload: parsed, rawJson: JSON.stringify(parsed, null, 2) };
    } catch {
      return { payload: null, rawJson: jsonMatch[1] };
    }
  }, [messages, imageGen]);

  const buildMessageText = useCallback(() => {
    if (!input.trim() && attachments.length === 0) return "";

    let text = input.trim();

    // Append file/image context to the message
    if (attachments.length > 0) {
      const attachmentDescriptions = attachments.map((a) => {
        if (a.type === "image") {
          return `[Attached image: ${a.name}]`;
        }
        return `[Attached file: ${a.name}]\n${a.content ?? "(binary file)"}`;
      });
      text = text
        ? `${text}\n\n${attachmentDescriptions.join("\n\n")}`
        : attachmentDescriptions.join("\n\n");
    }

    return text;
  }, [input, attachments]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = buildMessageText();
      if (!text || isLoading) return;
      setInput("");
      setAttachments([]);
      setIsExpanded(false);
      sendMessage({ text });
    },
    [buildMessageText, isLoading, sendMessage]
  );

  const handleSelectType = useCallback(
    (type: AIContentType) => {
      contentTypeRef.current = type;
      setContentType(type);
      const config = CONTENT_TYPES[type];
      sendMessage({ text: `I want to create a ${config.label}.` });
    },
    [sendMessage]
  );

  const handleBack = useCallback(() => {
    setContentType(null);
    setMessages([]);
    setInput("");
    setAttachments([]);
    setIsExpanded(false);
    imageGen.reset();
  }, [setMessages, imageGen]);

  const handleSave = useCallback(async () => {
    if (!payload || !contentType) return;
    const config = CONTENT_TYPES[contentType];
    if (!config.saveable || !config.saveEndpoint) return;

    setIsSaving(true);
    try {
      // Apply completed image results to the payload before saving
      const finalPayload = { ...payload };
      if (imageGen.tasks.length > 0) {
        const { content, coverImageUrl } = applyImageResults(
          finalPayload.bodyMarkdown,
          imageGen.tasks
        );
        finalPayload.bodyMarkdown = content;
        if (coverImageUrl) finalPayload.coverImage = coverImageUrl;
      }

      const savePayload = buildSavePayload(contentType, finalPayload);
      const res = await fetch(config.saveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });

      if (res.ok) {
        const data = await res.json();
        triggerReindex();
        const editPath = getEditPath(contentType, data.slug || data.id || data.code);
        if (editPath) router.push(editPath);
      } else {
        const err = await res.json().catch(() => ({ error: `Save failed (${res.status})` }));
        alert(err.error || `Save failed with status ${res.status}`);
      }
    } finally {
      setIsSaving(false);
    }
  }, [payload, contentType, router, imageGen]);

  const handleRegenerate = useCallback(() => {
    imageGen.reset();
    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.role === "assistant");
      if (idx >= 0) return prev.slice(0, idx);
      return prev;
    });
  }, [setMessages, imageGen]);

  const handleGenerateImages = useCallback(() => {
    if (!payload) return;
    imageGen.generateAll(payload.slug);
  }, [payload, imageGen]);

  const handleRetryImage = useCallback(
    (taskId: string) => {
      if (!payload) return;
      imageGen.retry(taskId, payload.slug);
    },
    [payload, imageGen]
  );

  const handleFileChange = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const newAttachments: Attachment[] = [];

    for (const file of files) {
      const isImage = file.type.startsWith("image/");
      const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      if (isImage) {
        const dataUrl = await readAsDataUrl(file);
        newAttachments.push({
          id,
          name: file.name,
          type: "image",
          dataUrl,
          mimeType: file.type,
          size: file.size,
        });
      } else if (file.type === "text/plain" || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
        const content = await readAsText(file);
        newAttachments.push({
          id,
          name: file.name,
          type: "file",
          dataUrl: "",
          content,
          mimeType: file.type,
          size: file.size,
        });
      } else {
        // For other files (PDF, DOCX, etc.) — attach name only for context
        newAttachments.push({
          id,
          name: file.name,
          type: "file",
          dataUrl: "",
          content: `(File: ${file.name}, ${(file.size / 1024).toFixed(1)}KB — content not readable in browser)`,
          mimeType: file.type,
          size: file.size,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset input so the same file can be re-attached
    e.target.value = "";
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const hasContent = input.trim() || attachments.length > 0;

  return (
    <div className="flex h-[calc(100vh-48px)] gap-4">
      {/* Left panel — Chat */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-4">
          {contentType ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">AI Writer</h1>
                <p className="text-[11px] text-slate-500">Architect-level content generation</p>
              </div>
            </div>
          )}
          {contentType && (
            <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-400">
              {CONTENT_TYPES[contentType].label}
            </span>
          )}
        </div>

        {/* Content area */}
        <AnimatePresence mode="wait">
          {!contentType ? (
            <motion.div
              key="selector"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <ContentTypeSelector onSelect={handleSelectType} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col min-h-0"
            >
              <ChatMessages messages={messages} isLoading={isLoading} />

              {/* Error display */}
              {error && (
                <div className="mx-1 mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  <p className="font-medium">Error</p>
                  <p className="mt-1 text-xs text-red-400/80">{error.message}</p>
                </div>
              )}

              {/* Input area */}
              <form
                onSubmit={handleSubmit}
                className="mt-4 border-t border-slate-800 pt-4"
              >
                {/* Attachment previews */}
                {attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="relative flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-slate-300"
                      >
                        {att.type === "image" ? (
                          <ImageIcon className="h-3.5 w-3.5 text-brand-400 flex-shrink-0" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 text-accent-400 flex-shrink-0" />
                        )}
                        <span className="max-w-[140px] truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {(att.size / 1024).toFixed(1)}KB
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(att.id)}
                          className="ml-1 rounded hover:text-white transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Textarea + controls */}
                <div className="relative rounded-xl border border-slate-700 bg-slate-800/50 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500/50 transition-all">
                  <textarea
                    ref={textareaRef}
                    data-ai-writer-input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what you want to create, add context, or upload reference files..."
                    rows={isExpanded ? 12 : 2}
                    style={isExpanded ? undefined : { resize: "none", overflow: "hidden" }}
                    className="w-full bg-transparent px-4 py-3 pr-24 text-sm text-white placeholder-slate-500 focus:outline-none resize-y"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !isExpanded) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                  />

                  {/* Toolbar — inside the textarea box */}
                  <div className="flex items-center gap-1 px-3 py-2 border-t border-slate-700/60">
                    {/* File attachment */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.txt,.md,.pdf,.docx"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach files or images"
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      Attach
                    </button>

                    {/* Expand/collapse */}
                    <button
                      type="button"
                      onClick={() => setIsExpanded((v) => !v)}
                      title={isExpanded ? "Collapse" : "Expand editor"}
                      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      {isExpanded ? (
                        <><Minimize2 className="h-3.5 w-3.5" /> Collapse</>
                      ) : (
                        <><Maximize2 className="h-3.5 w-3.5" /> Expand</>
                      )}
                    </button>

                    <p className="ml-auto text-[10px] text-slate-600">
                      {isExpanded ? "Shift+Enter for new line · Enter to send" : "Enter to send · Shift+Enter for new line"}
                    </p>

                    {/* Send button */}
                    <button
                      type="submit"
                      disabled={isLoading || !hasContent}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <p className="mt-1.5 text-[10px] text-slate-600 text-center">
                    Pro tip: Paste architecture notes, requirements docs, or previous blog content to help the AI Writer match your style
                  </p>
                )}
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right panel — Preview (appears when payload is extracted) */}
      <AnimatePresence>
        {payload && contentType && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "44%" }}
            exit={{ opacity: 0, width: 0 }}
            className="border-l border-slate-800 pl-4 overflow-hidden"
          >
            <ContentPreview
              payload={payload}
              rawJson={rawJson}
              onSave={handleSave}
              onRegenerate={handleRegenerate}
              isSaving={isSaving}
              contentType={contentType}
              imageTasks={imageGen.tasks}
              isGeneratingImages={imageGen.isGenerating}
              imageProgress={imageGen.progress}
              onGenerateImages={handleGenerateImages}
              onRetryImage={handleRetryImage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---- Helpers ----

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Convert AI payload to the shape expected by each admin API route.
 */
function buildSavePayload(contentType: AIContentType, payload: AIWriterPayload): Record<string, unknown> {
  switch (contentType) {
    case "blog":
      return {
        title: payload.title,
        description: payload.summary,
        content: payload.bodyMarkdown,
        category: payload.tags.slice(0, 3),
        tags: payload.tags,
        coverImage: payload.coverImage ?? "",
        featured: false,
        status: "draft",
      };
    case "case-study":
      return {
        title: payload.title,
        subtitle: payload.summary,
        content: payload.bodyMarkdown,
        tags: payload.tags,
        category: payload.tags.slice(0, 2),
        timeline: payload.timeline ?? "",
        role: payload.role ?? "",
        client: "Anonymised",
        featured: false,
        coverImage: payload.coverImage ?? "",
        metrics: payload.impact.map((i) => ({ value: "", label: i })),
      };
    case "project":
      return {
        title: payload.title,
        description: payload.summary,
        outcomes: payload.impact,
        tags: payload.tags,
        category: payload.tags.slice(0, 2),
        techStack: payload.tech,
        githubUrl: "",
        liveUrl: "",
        featured: false,
        year: new Date().getFullYear(),
      };
    case "talk":
      return {
        title: payload.title,
        topic: payload.tags[0] ?? "",
        description: payload.summary,
        featured: false,
      };
    case "event":
      return {
        title: payload.title,
        year: new Date().getFullYear(),
        format: "Speaker",
        topic: payload.tags[0] ?? "",
        tags: payload.tags,
        summary: payload.summary,
        highlights: payload.impact,
        impact: [],
        featured: false,
      };
    default:
      return payload as unknown as Record<string, unknown>;
  }
}

function getEditPath(contentType: AIContentType, id: string): string | null {
  const map: Record<string, string> = {
    blog: `/admin/blog/${id}/edit`,
    "case-study": `/admin/case-studies/${id}/edit`,
    project: `/admin/projects/${id}/edit`,
    talk: `/admin/talks/${id}/edit`,
    event: `/admin/events/${id}/edit`,
  };
  return map[contentType] ?? null;
}
