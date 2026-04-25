"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          typeof data.error === "object"
            ? Object.values(data.error as Record<string, string[]>)
                .flat()
                .join(", ")
            : (data.error ?? "Something went wrong");
        throw new Error(msg);
      }
      setState("success");
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <section
      id="newsletter"
      aria-labelledby="newsletter-heading"
      className="py-24 section-padding"
    >
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 border border-slate-800 px-8 py-16 text-center"
        >
          {/* Background glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-600/10 blur-3xl" />
            <div className="absolute -bottom-16 right-1/4 h-64 w-64 rounded-full bg-brand-500/5 blur-2xl" />
          </div>

          <div className="relative mx-auto max-w-2xl">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-700/50 bg-brand-600/10 px-4 py-1.5 text-sm font-medium text-brand-400"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              AI-Generated · Every Saturday
            </motion.div>

            <motion.h2
              id="newsletter-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mb-4 text-3xl font-bold text-white sm:text-4xl"
            >
              Cloud &amp; AI Weekly Digest
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-3 text-base text-slate-300 leading-relaxed"
            >
              Every Saturday, get the top AI and cloud news — curated and analysed from an architect&apos;s perspective. No hype, no filler.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mb-10 flex flex-wrap items-center justify-center gap-2"
            >
              {["5 top stories", "Azure Spotlight", "Tip of the Week", "Free forever"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-700/60 bg-slate-800/50 px-3 py-1 text-xs text-slate-400"
                  >
                    {item}
                  </span>
                )
              )}
            </motion.div>

            {/* Form or success state */}
            {state === "success" ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-500/15">
                  <CheckCircle className="h-7 w-7 text-accent-400" aria-hidden="true" />
                </div>
                <p className="text-lg font-semibold text-white">You&apos;re in!</p>
                <p className="text-sm text-slate-400">
                  Welcome aboard. Your first digest arrives this Saturday. Check your inbox for a welcome email.
                </p>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                onSubmit={handleSubmit}
                className="mx-auto max-w-md space-y-3"
                noValidate
              >
                <div>
                  <label htmlFor="newsletter-name" className="sr-only">
                    First name (optional)
                  </label>
                  <input
                    id="newsletter-name"
                    type="text"
                    placeholder="First name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={state === "loading"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label htmlFor="newsletter-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={state === "loading"}
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-white placeholder-slate-500 transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={state === "loading" || !email.trim()}
                    className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Subscribe to newsletter"
                  >
                    {state === "loading" ? (
                      <Mail className="h-4 w-4 animate-pulse" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="hidden sm:inline">
                      {state === "loading" ? "Subscribing…" : "Subscribe"}
                    </span>
                  </button>
                </div>

                {state === "error" && (
                  <p role="alert" className="text-sm text-red-400">
                    {errorMsg}
                  </p>
                )}

                <p className="text-xs text-slate-500">
                  No spam. Unsubscribe anytime with one click.
                </p>
              </motion.form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
