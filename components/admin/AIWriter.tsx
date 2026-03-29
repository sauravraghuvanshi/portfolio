"use client";

import { useState, useCallback, useMemo, useEffect, useRef, FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles } from "lucide-react";
import type { AIContentType, AIWriterPayload } from "@/types/ai-writer";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import { triggerReindex } from "@/lib/triggerReindex";
import ContentTypeSelector from "./ai-writer/ContentTypeSelector";
import ChatMessages from "./ai-writer/ChatMessages";
import { getMessageText } from "./ai-writer/ChatMessages";
import ContentPreview from "./ai-writer/ContentPreview";

export default function AIWriter() {
  const router = useRouter();
  const [contentType, setContentType] = useState<AIContentType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [input, setInput] = useState("");
  const contentTypeRef = useRef<AIContentType | null>(null);

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

  // Extract JSON payload from the last assistant message
  const { payload, rawJson } = useMemo(() => {
    const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
    if (!lastAI) return { payload: null, rawJson: "" };

    const text = getMessageText(lastAI);
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (!jsonMatch) return { payload: null, rawJson: "" };

    try {
      const parsed = JSON.parse(jsonMatch[1]) as AIWriterPayload;
      return { payload: parsed, rawJson: JSON.stringify(parsed, null, 2) };
    } catch {
      return { payload: null, rawJson: jsonMatch[1] };
    }
  }, [messages]);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      if (!input.trim() || isLoading) return;
      const text = input;
      setInput("");
      sendMessage({ text });
    },
    [input, isLoading, sendMessage]
  );

  const handleSelectType = useCallback(
    (type: AIContentType) => {
      contentTypeRef.current = type; // Update ref immediately so transport body reads it
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
  }, [setMessages]);

  const handleSave = useCallback(async () => {
    if (!payload || !contentType) return;

    const config = CONTENT_TYPES[contentType];
    if (!config.saveable || !config.saveEndpoint) return;

    setIsSaving(true);
    try {
      const savePayload = buildSavePayload(contentType, payload);
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
  }, [payload, contentType, router]);

  const handleRegenerate = useCallback(() => {
    setMessages((prev) => {
      const idx = prev.findLastIndex((m) => m.role === "assistant");
      if (idx >= 0) return prev.slice(0, idx);
      return prev;
    });
  }, [setMessages]);

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
                <p className="text-[11px] text-slate-500">Agentic content creation</p>
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

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="mt-4 flex gap-2 border-t border-slate-800 pt-4"
              >
                <textarea
                  data-ai-writer-input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your response..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 items-center justify-center self-end rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
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
            animate={{ opacity: 1, width: "40%" }}
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
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
        coverImage: "",
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
