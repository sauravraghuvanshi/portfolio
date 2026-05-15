"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, AlertCircle, Sparkles } from "lucide-react";
import type {
  AdvisorResult,
  Quiz,
  QuizAnswers,
  QuizScores,
} from "@/types/advisor";
import { PILLAR_KEYS } from "@/types/advisor";
import {
  scoreQuiz,
  isQuizComplete,
  quizToAdvisorInput,
} from "@/lib/advisor/quiz-scoring";
import QuizQuestion from "./QuizQuestion";
import QuizScorecard from "./QuizScorecard";
import AdvisorResultView from "./AdvisorResult";

type Phase = "brief" | "answering" | "deep-dive";

const SAMPLE_BRIEF =
  "Enterprise RAG chatbot on Microsoft AI Foundry. Next.js web app + Foundry Agent grounded in Azure AI Search over 50K internal docs. gpt-4o GlobalStandard. Entra ID SSO. Multi-region active-passive.";

export default function AdvisorQuiz() {
  const [phase, setPhase] = useState<Phase>("brief");
  const [brief, setBrief] = useState("");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [deepDiving, setDeepDiving] = useState(false);
  const [deepProgress, setDeepProgress] = useState("");
  const [deepResult, setDeepResult] = useState<AdvisorResult | null>(null);

  const scores: QuizScores | null = useMemo(() => {
    if (!quiz) return null;
    return scoreQuiz(quiz, answers);
  }, [quiz, answers]);

  const allAnswered = quiz ? isQuizComplete(quiz, answers) : false;

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (generating) return;
    setError(null);
    setQuiz(null);
    setAnswers({});
    setDeepResult(null);
    setGenProgress("");

    const trimmed = brief.trim();
    if (trimmed.length < 10) {
      setError("Please describe the workload in at least 10 characters.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/advisor/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: trimmed }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setError("You've hit the daily quiz limit (10/day). Try again tomorrow or use the Describe workload tab.");
        } else {
          setError("Generating the quiz failed. Please try again.");
        }
        setGenerating(false);
        return;
      }
      if (!res.body) {
        setError("No response from the quiz generator.");
        setGenerating(false);
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
              setGenProgress((p) => p + ev.text);
            } else if (ev.type === "complete" && ev.quiz) {
              setQuiz(ev.quiz as Quiz);
              setPhase("answering");
            } else if (ev.type === "error" && ev.message) {
              setError(ev.message);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[advisor-quiz] client error:", msg);
      setError("Something went wrong. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [brief, generating]);

  const handleSelect = useCallback((id: string, index: number) => {
    setAnswers((a) => ({ ...a, [id]: index }));
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("brief");
    setQuiz(null);
    setAnswers({});
    setError(null);
    setGenProgress("");
    setDeepResult(null);
    setDeepProgress("");
  }, []);

  const handleDeepDive = useCallback(async () => {
    if (!quiz || !scores) return;
    if (deepDiving) return;
    setError(null);
    setDeepResult(null);
    setDeepProgress("");
    setPhase("deep-dive");
    setDeepDiving(true);

    try {
      const payload = quizToAdvisorInput(quiz, answers, scores);
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 429) {
          setError("You've hit the hourly advisor limit (5/hour). Please try again later.");
        } else {
          setError("The deep-dive request failed. Please try again.");
        }
        setDeepDiving(false);
        return;
      }
      if (!res.body) {
        setError("No response from the advisor.");
        setDeepDiving(false);
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
              setDeepProgress((p) => p + ev.text);
            } else if (ev.type === "complete" && ev.result) {
              setDeepResult(ev.result as AdvisorResult);
            } else if (ev.type === "error" && ev.message) {
              setError(ev.message);
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[advisor-quiz] deep-dive error:", msg);
      setError("Something went wrong. Please try again.");
    } finally {
      setDeepDiving(false);
    }
  }, [quiz, scores, answers, deepDiving]);

  // ---------- Render ----------
  if (phase === "brief") {
    return (
      <div className="space-y-6">
        <motion.form
          onSubmit={handleGenerate}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 space-y-4"
          aria-label="WAF quiz brief form"
        >
          <div>
            <label htmlFor="quiz-brief" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
              Describe your workload in 1-2 sentences <span className="text-red-500">*</span>
            </label>
            <textarea
              id="quiz-brief"
              required
              minLength={10}
              maxLength={500}
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. Enterprise RAG chatbot on Microsoft AI Foundry, grounded in Azure AI Search, multi-region active-passive…"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              We&apos;ll generate {PILLAR_KEYS.length} pillars × 5 questions tailored to your workload.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Generating quiz…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Generate my quiz
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setBrief(SAMPLE_BRIEF)}
              disabled={generating}
              className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline disabled:opacity-50"
            >
              Use sample brief
            </button>
            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
              10 quizzes / day
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

        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" aria-hidden="true" />
              Designing 25 questions tailored to your brief…
            </div>
            <pre className="text-[11px] text-slate-500 dark:text-slate-400 max-h-40 overflow-hidden whitespace-pre-wrap leading-snug">
              {genProgress.slice(-800)}
            </pre>
          </motion.div>
        )}
      </div>
    );
  }

  // ---------- answering / deep-dive ----------
  if (!quiz) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">
            Quiz for your workload
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            {quiz.brief}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRestart}
          className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline-offset-2 hover:underline"
        >
          Use a different brief
        </button>
      </div>

      <ol className="space-y-3 list-none">
        {quiz.questions.map((q, i) => (
          <li key={q.id}>
            <QuizQuestion
              question={q}
              number={i + 1}
              selectedIndex={answers[q.id]}
              onSelect={(idx) => handleSelect(q.id, idx)}
            />
          </li>
        ))}
      </ol>

      {scores && (
        <QuizScorecard
          scores={scores}
          onDeepDive={handleDeepDive}
          onRestart={handleRestart}
          deepDiveDisabled={!allAnswered || deepDiving}
        />
      )}

      {!allAnswered && (
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
          Answer every question to unlock the AI deep-dive.
        </p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-4 flex items-start gap-2 text-sm text-red-700 dark:text-red-300"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {deepDiving && !deepResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 mb-3">
            <Loader2 className="w-4 h-4 animate-spin text-brand-500" aria-hidden="true" />
            <Send className="w-4 h-4 text-brand-500" aria-hidden="true" />
            Searching Microsoft Learn and building the full WAF deep-dive…
          </div>
          <pre className="text-[11px] text-slate-500 dark:text-slate-400 max-h-40 overflow-hidden whitespace-pre-wrap leading-snug">
            {deepProgress.slice(-1200)}
          </pre>
        </motion.div>
      )}

      {deepResult && <AdvisorResultView result={deepResult} />}
    </div>
  );
}
