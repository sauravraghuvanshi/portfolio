"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, X } from "lucide-react";
import type { Project } from "@/lib/content";
import CategoryMultiSelect from "./CategoryMultiSelect";
import { triggerReindex } from "@/lib/triggerReindex";

interface ProjectEditorProps {
  mode: "create" | "edit";
  initialData?: Project;
}

const categories = ["AI", "Azure", "DevOps"];

export default function ProjectEditor({ mode, initialData }: ProjectEditorProps) {
  const router = useRouter();

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [category, setCategory] = useState<string[]>(initialData?.category ?? ["Azure"]);
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [techStack, setTechStack] = useState(initialData?.techStack?.join(", ") ?? "");
  const [outcomes, setOutcomes] = useState<string[]>(
    initialData?.outcomes?.length ? initialData.outcomes : [""]
  );
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(initialData?.liveUrl ?? "");
  const [year, setYear] = useState(initialData?.year ?? new Date().getFullYear());
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function addOutcome() {
    setOutcomes((prev) => [...prev, ""]);
  }

  function removeOutcome(index: number) {
    setOutcomes((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOutcome(index: number, val: string) {
    setOutcomes((prev) => prev.map((o, i) => (i === index ? val : o)));
  }

  async function handleSave() {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      title,
      description,
      category,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      techStack: techStack
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      outcomes: outcomes.filter((o) => o.trim()),
      githubUrl: githubUrl || "#",
      liveUrl: liveUrl || "#",
      year,
      featured,
    };

    const url =
      mode === "create"
        ? "/api/admin/projects"
        : `/api/admin/projects/${initialData!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      setMessage({ type: "error", text: `Server error (${res.status}): unexpected response` });
      return;
    }

    const data = await res.json();

    if (res.ok) {
      setMessage({
        type: "success",
        text: mode === "create" ? "Project created!" : "Project updated!",
      });
      triggerReindex();
      if (mode === "create" && data.id) {
        router.push(`/admin/projects/${data.id}/edit`);
      } else {
        router.refresh();
      }
    } else {
      setMessage({ type: "error", text: data.error || "Something went wrong" });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-accent-500/30 bg-accent-500/10 text-accent-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-surface-dark p-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Project title..."
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Project description..."
          />
        </div>

        <CategoryMultiSelect
          presets={categories}
          selected={category}
          onChange={setCategory}
        />

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="Azure, AI, Cloud"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Tech Stack (comma-separated)
          </label>
          <input
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            className={inputClass}
            placeholder="Azure OpenAI, Python, ..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            GitHub URL
          </label>
          <input
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={inputClass}
            placeholder="https://github.com/..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Live URL
          </label>
          <input
            value={liveUrl}
            onChange={(e) => setLiveUrl(e.target.value)}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
            className={inputClass}
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-surface-dark-2 accent-brand-600"
            />
            Featured project
          </label>
        </div>

        {/* Outcomes */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-2 block text-xs font-medium uppercase text-slate-400">
            Outcomes
          </label>
          <div className="space-y-2">
            {outcomes.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={o}
                  onChange={(e) => updateOutcome(i, e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Outcome description..."
                />
                <button
                  onClick={() => removeOutcome(i)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                  title="Remove outcome"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addOutcome}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Outcome
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
