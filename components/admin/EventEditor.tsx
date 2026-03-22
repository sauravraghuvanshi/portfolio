"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Plus, X, Upload, Image as ImageIcon } from "lucide-react";
import type { EventMeta } from "@/lib/content";

interface EventEditorProps {
  mode: "create" | "edit";
  initialData?: EventMeta;
}

const FORMAT_OPTIONS = ["Speaker", "Organizer", "Mentor", "Panelist"];

export default function EventEditor({ mode, initialData }: EventEditorProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const additionalInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"cover" | "additional" | null>(null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [year, setYear] = useState(initialData?.year ?? new Date().getFullYear());
  const [format, setFormat] = useState(initialData?.format ?? "Speaker");
  const [topic, setTopic] = useState(initialData?.topic ?? "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [summary, setSummary] = useState(initialData?.summary ?? "");
  const [highlights, setHighlights] = useState<string[]>(
    initialData?.highlights?.length ? initialData.highlights : [""]
  );
  const [impact, setImpact] = useState<string[]>(
    initialData?.impact?.length ? initialData.impact : [""]
  );
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [coverImagePosition, setCoverImagePosition] = useState(
    initialData?.coverImagePosition ?? "center"
  );
  const [images, setImages] = useState(initialData?.images?.join(", ") ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function addHighlight() {
    setHighlights((prev) => [...prev, ""]);
  }
  function removeHighlight(index: number) {
    setHighlights((prev) => prev.filter((_, i) => i !== index));
  }
  function updateHighlight(index: number, val: string) {
    setHighlights((prev) => prev.map((h, i) => (i === index ? val : h)));
  }

  function addImpact() {
    setImpact((prev) => [...prev, ""]);
  }
  function removeImpact(index: number) {
    setImpact((prev) => prev.filter((_, i) => i !== index));
  }
  function updateImpact(index: number, val: string) {
    setImpact((prev) => prev.map((item, i) => (i === index ? val : item)));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "events");
    if (mode === "edit" && initialData?.slug) {
      formData.append("slug", initialData.slug);
    }
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url;
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("cover");
    const url = await uploadImage(file);
    setUploading(null);
    if (url) setCoverImage(url);
    e.target.value = "";
  }

  async function handleAdditionalUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading("additional");
    const url = await uploadImage(file);
    setUploading(null);
    if (url) {
      setImages((prev) => (prev ? `${prev}, ${url}` : url));
    }
    e.target.value = "";
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
      year,
      format,
      topic,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      summary,
      highlights: highlights.filter((h) => h.trim()),
      impact: impact.filter((i) => i.trim()),
      coverImage: coverImage || null,
      coverImagePosition,
      images: images
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean),
      featured,
    };

    const url =
      mode === "create"
        ? "/api/admin/events"
        : `/api/admin/events/${initialData!.slug}`;
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
        text: mode === "create" ? "Event created!" : "Event updated!",
      });
      if (mode === "create" && data.slug) {
        router.push(`/admin/events/${data.slug}/edit`);
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
            placeholder="Event title..."
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-surface-dark-2"
            />
            Featured Event
          </label>
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

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className={inputClass}
          >
            {FORMAT_OPTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Topic
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={inputClass}
            placeholder="e.g. Azure, AI"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Tags (comma-separated)
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="Azure, AI, Community"
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Summary
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className={inputClass}
            placeholder="Brief summary of the event..."
          />
        </div>

        {/* Highlights */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-2 block text-xs font-medium uppercase text-slate-400">
            Highlights
          </label>
          <div className="space-y-2">
            {highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={h}
                  onChange={(e) => updateHighlight(i, e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Highlight..."
                />
                <button
                  onClick={() => removeHighlight(i)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addHighlight}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Highlight
            </button>
          </div>
        </div>

        {/* Impact */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-2 block text-xs font-medium uppercase text-slate-400">
            Impact
          </label>
          <div className="space-y-2">
            {impact.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={item}
                  onChange={(e) => updateImpact(i, e.target.value)}
                  className={`flex-1 ${inputClass}`}
                  placeholder="Impact statement..."
                />
                <button
                  onClick={() => removeImpact(i)}
                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                  title="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={addImpact}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Impact
            </button>
          </div>
        </div>

        {/* Images */}
        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Cover Image
          </label>
          <div className="flex items-center gap-2">
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className={`flex-1 ${inputClass}`}
              placeholder="URL or upload an image..."
            />
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploading === "cover"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              {uploading === "cover" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload
            </button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              className="hidden"
            />
          </div>
          {coverImage && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={coverImage}
                alt="Cover preview"
                className="h-16 w-24 rounded-md border border-slate-700 object-cover"
              />
              <button
                onClick={() => setCoverImage("")}
                className="rounded-md p-1 text-slate-400 transition hover:text-red-400"
                title="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Cover Position
          </label>
          <select
            value={coverImagePosition}
            onChange={(e) => setCoverImagePosition(e.target.value as "top" | "center" | "bottom")}
            className={inputClass}
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Additional Images
          </label>
          <div className="flex items-center gap-2">
            <input
              value={images}
              onChange={(e) => setImages(e.target.value)}
              className={`flex-1 ${inputClass}`}
              placeholder="URLs (comma-separated) or upload..."
            />
            <button
              type="button"
              onClick={() => additionalInputRef.current?.click()}
              disabled={uploading === "additional"}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-700 disabled:opacity-50"
            >
              {uploading === "additional" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
              Add
            </button>
            <input
              ref={additionalInputRef}
              type="file"
              accept="image/*"
              onChange={handleAdditionalUpload}
              className="hidden"
            />
          </div>
          {images && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.split(",").map((img, i) => {
                const url = img.trim();
                if (!url) return null;
                return (
                  <div key={i} className="group relative">
                    <img
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="h-16 w-24 rounded-md border border-slate-700 object-cover"
                    />
                    <button
                      onClick={() => {
                        const updated = images
                          .split(",")
                          .map((s) => s.trim())
                          .filter((_, idx) => idx !== i)
                          .join(", ");
                        setImages(updated);
                      }}
                      className="absolute -right-1.5 -top-1.5 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
