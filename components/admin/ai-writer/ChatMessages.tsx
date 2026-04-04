"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Bot, User, Loader2 } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";

/** Extract text content from a UIMessage's parts array. */
export function getMessageText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
}

export default function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (messages.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide"
    >
      {messages.map((msg) => {
        const text = getMessageText(msg);
        return (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 mt-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-br-md"
                  : "bg-slate-800 text-slate-200 rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="ai-message-content whitespace-pre-wrap">
                  {formatAIMessage(text)}
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{text}</p>
              )}
            </div>

            {msg.role === "user" && (
              <div className="flex-shrink-0 mt-1">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-700 text-slate-300">
                  <User className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
          </motion.div>
        );
      })}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500/15 text-brand-400 flex-shrink-0">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="rounded-2xl rounded-bl-md bg-slate-800 px-4 py-3">
            <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Simple markdown-like formatting for AI messages.
 * Renders bold and code blocks using safe React elements (no innerHTML).
 */
function formatAIMessage(content: string): React.ReactNode {
  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const firstNewline = inner.indexOf("\n");
      const code = firstNewline > -1 ? inner.slice(firstNewline + 1) : inner;
      return (
        <pre
          key={i}
          className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300 border border-slate-700"
        >
          <code>{code}</code>
        </pre>
      );
    }

    // Bold text — split on **…** markers and render as React elements
    const boldParts = part.split(/\*\*(.*?)\*\*/g);
    return (
      <span key={i}>
        {boldParts.map((segment, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="font-semibold text-white">
              {segment}
            </strong>
          ) : (
            segment
          )
        )}
      </span>
    );
  });
}
