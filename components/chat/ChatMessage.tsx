"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

function formatMessage(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced code blocks
    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      nodes.push(
        <pre
          key={`code-${i}`}
          className="my-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-xs overflow-x-auto"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // Process inline formatting
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formatted = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={j} className="font-semibold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });

    nodes.push(
      <span key={`line-${i}`}>
        {formatted}
        {i < lines.length - 1 && <br />}
      </span>
    );
  }

  return nodes;
}

interface ChatMessageProps {
  message: UIMessage;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const text = getMessageText(message);
  if (!text) return null;

  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mt-1">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600 text-white rounded-2xl rounded-br-md"
            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-md border border-slate-200 dark:border-slate-700"
        }`}
      >
        {isUser ? text : formatMessage(text)}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}
