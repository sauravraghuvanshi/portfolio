"use client";

import { useState, useRef, useEffect, useMemo, type FormEvent } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, RotateCcw, Bot, Loader2 } from "lucide-react";
import ChatMessage from "./ChatMessage";

const STARTERS = [
  "What's Saurav's experience?",
  "Tell me about his cloud projects",
  "What certifications does he have?",
  "What's his role at Microsoft?",
];

const MAX_USER_MESSAGES = 5;

export default function ChatBubble() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    []
  );

  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    experimental_throttle: 50,
  });

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  const isLoading = status === "streaming" || status === "submitted";
  const showSpinner = status === "submitted";
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const limitReached = userMessageCount >= MAX_USER_MESSAGES;

  // Auto-scroll to bottom when messages change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Escape key closes panel
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleSend(text: string) {
    if (!text.trim() || isLoading || limitReached) return;
    sendMessage({ text: text.trim() });
    setInput("");
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  function handleNewChat() {
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <>
      {/* Floating bubble button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow hover:bg-brand-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            aria-label="Open chat assistant"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: 1.05 }}
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] h-[calc(100vh-6rem)] sm:w-[400px] sm:h-[560px] flex flex-col rounded-2xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 shadow-glow overflow-hidden"
            role="dialog"
            aria-label="Chat with Saurav's AI assistant"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700/50">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Ask about Saurav
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  AI-powered portfolio assistant
                </p>
              </div>
              <button
                onClick={handleNewChat}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="New chat"
                title="New chat"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer */}
            <div className="px-4 py-1.5 bg-brand-50/60 dark:bg-brand-950/20 border-b border-slate-200/50 dark:border-slate-800/50">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                AI-powered — answers may not be 100% accurate
              </p>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                    Hi! Ask me anything about Saurav.
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                    His experience, projects, skills, and more.
                  </p>
                  <div className="flex flex-col gap-2 w-full">
                    {STARTERS.map((q) => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-brand-400 dark:hover:border-brand-600 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((message, i) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isStreaming={
                        status === "streaming" &&
                        i === messages.length - 1
                      }
                    />
                  ))}
                  {showSpinner && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md">
                        <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input bar */}
            <div className="border-t border-slate-200 dark:border-slate-700/50 px-4 py-3">
              {limitReached ? (
                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  Conversation limit reached. Click &quot;New chat&quot; to start over.
                </p>
              ) : (
                <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about Saurav..."
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                {userMessageCount}/{MAX_USER_MESSAGES} messages
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
