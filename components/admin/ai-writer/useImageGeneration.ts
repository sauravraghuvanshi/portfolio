"use client";

import { useState, useCallback, useRef } from "react";
import type { ImageTask } from "@/types/ai-writer";

interface UseImageGenerationReturn {
  tasks: ImageTask[];
  isGenerating: boolean;
  progress: string; // e.g. "1/3"
  initTasks: (tasks: ImageTask[]) => void;
  generateAll: (slug: string) => Promise<void>;
  retry: (taskId: string, slug: string) => Promise<void>;
  regenWithFeedback: (taskId: string, slug: string, feedback: string) => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook for managing async image generation via the
 * /api/admin/ai-writer/generate-image endpoint.
 *
 * Images are generated one-by-one (sequential, not parallel)
 * with live progress updates. Failed images don't block others.
 */
export function useImageGeneration(): UseImageGenerationReturn {
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? `${doneCount}/${tasks.length}` : "";

  const initTasks = useCallback((newTasks: ImageTask[]) => {
    setTasks(newTasks);
  }, []);

  const generateOne = useCallback(
    async (task: ImageTask, slug: string, index: number): Promise<ImageTask> => {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: "generating" as const } : t))
      );

      try {
        const res = await fetch("/api/admin/ai-writer/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: task.prompt, slug, index }),
          signal: abortRef.current?.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          const updated: ImageTask = {
            ...task,
            status: "error",
            error: err.error || `Failed (${res.status})`,
          };
          setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
          return updated;
        }

        const data = await res.json();
        const updated: ImageTask = {
          ...task,
          status: "done",
          url: data.url,
        };
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        return updated;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          throw err; // Let caller handle abort
        }
        const updated: ImageTask = {
          ...task,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        };
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        return updated;
      }
    },
    []
  );

  const generateAll = useCallback(
    async (slug: string) => {
      setIsGenerating(true);
      abortRef.current = new AbortController();

      try {
        // Process sequentially — image gen is expensive, sequential is fine
        for (let i = 0; i < tasks.length; i++) {
          const task = tasks[i];
          if (task.status === "done") continue; // Skip already completed
          await generateOne(task, slug, i);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // Generation was cancelled
        }
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [tasks, generateOne]
  );

  const retry = useCallback(
    async (taskId: string, slug: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const index = tasks.indexOf(task);
      setIsGenerating(true);
      abortRef.current = new AbortController();

      try {
        await generateOne(task, slug, index);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [tasks, generateOne]
  );

  const regenWithFeedback = useCallback(
    async (taskId: string, slug: string, feedback: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const index = tasks.indexOf(task);
      const enhancedPrompt = `${task.prompt}. Revision: ${feedback}`;
      const modifiedTask: ImageTask = {
        ...task,
        prompt: enhancedPrompt,
        status: "pending",
        url: undefined,
        error: undefined,
      };

      setIsGenerating(true);
      abortRef.current = new AbortController();
      try {
        await generateOne(modifiedTask, slug, index);
      } finally {
        setIsGenerating(false);
        abortRef.current = null;
      }
    },
    [tasks, generateOne]
  );

  const reset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setTasks([]);
    setIsGenerating(false);
  }, []);

  return { tasks, isGenerating, progress, initTasks, generateAll, retry, regenWithFeedback, reset };
}
