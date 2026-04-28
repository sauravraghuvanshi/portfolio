"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import type { RadarEntry, RadarQuadrant, RadarRing } from "@/lib/content";

interface RadarEntryEditorProps {
  mode: "create" | "edit";
  initialData?: RadarEntry;
}

const QUADRANT_OPTIONS: { value: RadarQuadrant; label: string }[] = [
  { value: "languages", label: "Languages & Frameworks" },
  { value: "platforms", label: "Platforms" },
  { value: "tools", label: "Tools" },
  { value: "techniques", label: "Techniques" },
];

const RING_OPTIONS: { value: RadarRing; label: string }[] = [
  { value: "adopt", label: "Adopt" },
  { value: "trial", label: "Trial" },
  { value: "assess", label: "Assess" },
  { value: "hold", label: "Hold" },
];

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function RadarEntryEditor({ mode, initialData }: RadarEntryEditorProps) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name ?? "");
  const [id, setId] = useState(initialData?.id ?? "");
  const [quadrant, setQuadrant] = useState<RadarQuadrant>(initialData?.quadrant ?? "tools");
  const [ring, setRing] = useState<RadarRing>(initialData?.ring ?? "trial");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [useWhen, setUseWhen] = useState(initialData?.useWhen ?? "");
  const [avoidWhen, setAvoidWhen] = useState(initialData?.avoidWhen ?? "");
  const [movedFrom, setMovedFrom] = useState<RadarRing | "">(initialData?.movedFrom ?? "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleNameChange(val: string) {
    setName(val);
    if (mode === "create") {
      setId(toSlug(val));
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    if (!summary.trim()) {
      setMessage({ type: "error", text: "Summary is required" });
      return;
    }
    if (!id.trim()) {
      setMessage({ type: "error", text: "ID is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload: Partial<RadarEntry> = {
      id,
      name,
      quadrant,
      ring,
      summary,
      ...(useWhen.trim() && { useWhen: useWhen.trim() }),
      ...(avoidWhen.trim() && { avoidWhen: avoidWhen.trim() }),
      ...(movedFrom && { movedFrom }),
    };

    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    if (parsedTags.length > 0) {
      payload.tags = parsedTags;
    }

    const url =
      mode === "create"
        ? "/api/admin/tech-radar"
        : `/api/admin/tech-radar/${initialData!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      setMessage({ type: "error", text: `Server error (${res.status})` });
      return;
    }

    const data = await res.json();

    if (res.ok) {
      setMessage({
        type: "success",
        text: mode === "create" ? "Entry created!" : "Entry updated!",
      });
      if (mode === "create" && data.id) {
        router.push(`/admin/tech-radar/${data.id}/edit`);
      } else {
        router.refresh();
      }
    } else {
      setMessage({ type: "error", text: typeof data.error === "string" ? data.error : "Something went wrong" });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500";
  const selectClass =
    "w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white outline-none transition focus:border-brand-500";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
        {/* Name */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. Azure Container Apps"
          />
        </div>

        {/* ID */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            ID {mode === "edit" && <span className="text-slate-500 normal-case font-normal">(read-only)</span>}
          </label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            readOnly={mode === "edit"}
            className={`${inputClass} ${mode === "edit" ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="auto-generated from name"
          />
        </div>

        {/* Quadrant */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Quadrant</label>
          <select
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value as RadarQuadrant)}
            className={selectClass}
          >
            {QUADRANT_OPTIONS.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>

        {/* Ring */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Ring</label>
          <select
            value={ring}
            onChange={(e) => setRing(e.target.value as RadarRing)}
            className={selectClass}
          >
            {RING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Moved From */}
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Moved From (optional)</label>
          <select
            value={movedFrom}
            onChange={(e) => setMovedFrom(e.target.value as RadarRing | "")}
            className={selectClass}
          >
            <option value="">— none —</option>
            {RING_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Summary</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="One-paragraph opinion based on production experience..."
          />
        </div>

        {/* Use When */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Use When <span className="text-slate-500 normal-case font-normal">(optional)</span>
          </label>
          <input
            value={useWhen}
            onChange={(e) => setUseWhen(e.target.value)}
            className={inputClass}
            placeholder="When is this the right choice?"
          />
        </div>

        {/* Avoid When */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Avoid When <span className="text-slate-500 normal-case font-normal">(optional)</span>
          </label>
          <input
            value={avoidWhen}
            onChange={(e) => setAvoidWhen(e.target.value)}
            className={inputClass}
            placeholder="When should you NOT use this?"
          />
        </div>

        {/* Tags */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Tags <span className="text-slate-500 normal-case font-normal">(comma-separated, optional)</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="azure, ai, devops"
          />
        </div>
      </div>
    </div>
  );
}
