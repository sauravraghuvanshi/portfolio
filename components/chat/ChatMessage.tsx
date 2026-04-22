"use client";

import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { UIMessage } from "@ai-sdk/react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-2 first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-2 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-3 mb-1.5 first:mt-0">{children}</h4>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside pl-5 mb-2 space-y-1 marker:text-slate-400 dark:marker:text-slate-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside pl-5 mb-2 space-y-1 marker:text-slate-400 dark:marker:text-slate-500">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-600 dark:text-brand-400 underline decoration-brand-300 dark:decoration-brand-700 underline-offset-2 hover:decoration-brand-500 transition-colors"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return <code className={className}>{children}</code>;
    }
    return (
      <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 text-[0.85em] font-mono text-brand-700 dark:text-brand-300">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 text-xs overflow-x-auto font-mono">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-brand-400 dark:border-brand-600 pl-3 my-2 italic text-slate-600 dark:text-slate-400">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-slate-200 dark:border-slate-700" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-slate-200 dark:border-slate-700">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-semibold text-slate-900 dark:text-white">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-1 border-t border-slate-100 dark:border-slate-800">{children}</td>
  ),
};

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
        {isUser ? (
          <span className="whitespace-pre-wrap">{text}</span>
        ) : (
          <div className="markdown-message">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mt-1">
          <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </div>
      )}
    </motion.div>
  );
}
