"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import type { Talk } from "@/lib/content";

interface TalkEditorProps {
  mode: "create" | "edit";
  initialData?: Talk;
}

export default function TalkEditor({ mode, initialData }: TalkEditorProps) {
  const router = useRouter();

  const [id, setId] = useState(initialData?.id ?? "");
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [topic, setTopic] = useState(initialData?.topic ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSave() {
    if (!id.trim() || !title.trim()) {
      setMessage({ type: "error", text: "YouTube Video ID and Title are required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      id: id.trim(),
      title,
      topic,
      description: description || undefined,
      featured,
    };

    const url =
      mode === "create"
        ? "/api/admin/talks"
        : `/api/admin/talks/${initialData!.id}`;
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
        text: mode === "create" ? "Talk created!" : "Talk updated!",
      });
      if (mode === "create" && data.id) {
        router.push(`/admin/talks/${data.id}/edit`);
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
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-800 bg-surface-dark p-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            YouTube Video ID
          </label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={inputClass}
            placeholder="e.g. akZUKGwA4hE"
            disabled={mode === "edit"}
          />
          {mode === "create" && (
            <p className="mt-1 text-xs text-slate-500">
              The ID from the YouTube URL (e.g. youtube.com/watch?v=<strong>akZUKGwA4hE</strong>)
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Topic
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={inputClass}
            placeholder="e.g. Azure AI, DevOps"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Talk title..."
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Brief description of the talk..."
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
            Featured talk
          </label>
        </div>
      </div>
    </div>
  );
}
