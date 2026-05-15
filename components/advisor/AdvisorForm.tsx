"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, AlertCircle } from "lucide-react";
import type { AdvisorResult } from "@/types/advisor";
import AdvisorResultView from "./AdvisorResult";

interface FormState {
  workload: string;
  scale: string;
  constraints: string;
  region: string;
}

const PRESET = {
  workload:
    "Multi-region B2B SaaS web app on Azure: React front-end + Node API + PostgreSQL. Tens of thousands of authenticated users, peak 5K req/s. Must stay up during a regional outage.",
  scale: "5K req/s peak, 30K MAU",
  constraints: "HIPAA-aligned\nBudget < $4K/month\n99.95% SLO",
  region: "East US + West Europe",
};

export default function AdvisorForm() {
  const [form, setForm] = useState<FormState>({
    workload: "",
    scale: "",
    constraints: "",
    region: "",
  });
  const [streaming, setStreaming] = useState(false);
  const [progress, setProgress] = useState(""); // raw streaming buffer for "Analyzing..." preview
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (streaming) return;
    setError(null);
    setResult(null);
    setProgress("");

    if (form.workload.trim().length < 10) {
      setError("Please describe the workload in at least 10 characters.");
      return;
    }

    setStreaming(true);
    try {
      const constraints = form.constraints
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10);

      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workload: form.workload.trim(),
          scale: form.scale.trim(),
          constraints,
          region: form.region.trim(),
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setError("You've hit the hourly limit (5 assessments/hour). Please try again later.");
        } else {
          setError("The advisor request failed. Please try again.");
        }
        setStreaming(false);
        return;
      }

      if (!res.body) {
        setError("No response from the advisor.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const blocks = buffer.split("\n\n");
        buffer = blocks.pop() ?? "";

        for (const block of blocks) {
          const dataLine = block.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const raw = dataLine.slice(5).trim();
          if (raw === "[DONE]") continue;
          try {
            const ev = JSON.parse(raw);
            if (ev.type === "delta" && typeof ev.text === "string") {
              setProgress((p) => p + ev.text);
            } else if (ev.type === "complete" && ev.result) {
              setResult(ev.result as AdvisorResult);
            } else if (ev.type === "error" && ev.message) {
              setError(ev.message);
            }
          } catch {
            /* ignore non-JSON keepalive */
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[advisor] client error:", msg);
      setError("Something went wrong. Please try again.");
    } finally {
      setStreaming(false);
    }
  }, [form, streaming]);

  const usePreset = () => setForm(PRESET);

  return (
    <div className="space-y-8">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4"
        aria-label="AI Architecture Advisor form"
      >
        <div>
          <label htmlFor="advisor-workload" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Workload description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="advisor-workload"
            required
            minLength={10}
            maxLength={2000}
            rows={5}
            value={form.workload}
            onChange={update("workload")}
            placeholder="e.g. Multi-region B2B SaaS web app: React + Node API + PostgreSQL, 5K req/s peak, must survive a regional outage…"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            What it does, where it runs, scale, and any must-haves.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="advisor-scale" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
              Scale / load
            </label>
            <input
              id="advisor-scale"
              type="text"
              maxLength={200}
              value={form.scale}
              onChange={update("scale")}
              placeholder="5K req/s peak, 30K MAU"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="advisor-region" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
              Region(s)
            </label>
            <input
              id="advisor-region"
              type="text"
              maxLength={100}
              value={form.region}
              onChange={update("region")}
              placeholder="East US + West Europe"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="advisor-constraints" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
            Constraints (one per line)
          </label>
          <textarea
            id="advisor-constraints"
            rows={3}
            maxLength={2000}
            value={form.constraints}
            onChange={update("constraints")}
            placeholder={"HIPAA-aligned\nBudget < $4K/month\n99.95% SLO"}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={streaming}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            {streaming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Analyzing…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" aria-hidden="true" />
                Assess my workload
              </>
            )}
          </button>
          <button
            type="button"
            onClick={usePreset}
            disabled={streaming}
            className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline disabled:opacity-50"
          >
            Use sample workload
          </button>
          <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
            5 assessments / hour
          </span>
        </div>
      </motion.form>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {streaming && !result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" aria-hidden="true" />
            Searching Microsoft Learn and assessing against the WAF…
          </div>
          <pre className="text-[11px] text-slate-500 dark:text-slate-400 max-h-40 overflow-hidden whitespace-pre-wrap leading-snug">
            {progress.slice(-1200)}
          </pre>
        </motion.div>
      )}

      {result && <AdvisorResultView result={result} />}
    </div>
  );
}
