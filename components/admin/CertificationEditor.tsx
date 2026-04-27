"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Upload, X } from "lucide-react";
import type { Certification } from "@/lib/content";
import { triggerReindex } from "@/lib/triggerReindex";

interface CertificationEditorProps {
  mode: "create" | "edit";
  initialData?: Certification;
}

const colorOptions = ["blue", "purple", "orange", "green"];

export default function CertificationEditor({ mode, initialData }: CertificationEditorProps) {
  const router = useRouter();

  const [code, setCode] = useState(initialData?.code ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [issuer, setIssuer] = useState(initialData?.issuer ?? "");
  const [year, setYear] = useState(initialData?.year ?? new Date().getFullYear());
  const [verifyUrl, setVerifyUrl] = useState(initialData?.verifyUrl ?? "#");
  const [badge, setBadge] = useState(initialData?.badge ?? "");
  const [color, setColor] = useState(initialData?.color ?? "blue");
  const [credentialId, setCredentialId] = useState(initialData?.credentialId ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [status, setStatus] = useState<"draft" | "published">(initialData?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const badgeInputRef = useRef<HTMLInputElement>(null);

  async function uploadImage(file: File): Promise<string | null> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "certifications");
    formData.append("slug", code.trim() || "new");
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  }

  async function handleBadgeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const url = await uploadImage(file);
    setUploading(false);
    if (url) {
      setBadge(url);
    } else {
      setMessage({ type: "error", text: "Badge upload failed" });
    }
    e.target.value = "";
  }

  async function handleSave() {
    if (!code.trim()) {
      setMessage({ type: "error", text: "Code is required" });
      return;
    }
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      code: code.trim(),
      name: name.trim(),
      issuer: issuer.trim(),
      year,
      verifyUrl: verifyUrl.trim() || "#",
      badge: badge.trim(),
      color,
      credentialId: credentialId.trim() || undefined,
      featured,
      status,
    };

    const url =
      mode === "create"
        ? "/api/admin/certifications"
        : `/api/admin/certifications/${initialData!.code}`;
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
        text: mode === "create" ? "Certification created!" : "Certification updated!",
      });
      triggerReindex();
      if (mode === "create" && data.code) {
        router.push(`/admin/certifications/${data.code}/edit`);
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
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Code {mode === "edit" && <span className="normal-case text-slate-500">(read-only)</span>}
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            readOnly={mode === "edit"}
            className={`${inputClass} ${mode === "edit" ? "cursor-not-allowed opacity-60" : ""}`}
            placeholder="AZ-104"
          />
        </div>

        <div className="md:col-span-1 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Azure Administrator Associate"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Issuer
          </label>
          <input
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className={inputClass}
            placeholder="Microsoft"
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

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Color
          </label>
          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className={inputClass}
          >
            {colorOptions.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Verification URL
          </label>
          <input
            value={verifyUrl}
            onChange={(e) => setVerifyUrl(e.target.value)}
            className={inputClass}
            placeholder="https://learn.microsoft.com/..."
          />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Credential ID <span className="normal-case text-slate-500">(optional — shown on card for verification reference)</span>
          </label>
          <input
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            className={inputClass}
            placeholder="ZXNTTFQC51Q4Q0WB"
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
            Featured certification
          </label>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white outline-none transition focus:border-brand-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Badge Image <span className="normal-case text-slate-500">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className={`flex-1 ${inputClass}`}
              placeholder="https://... or upload"
            />
            <input
              ref={badgeInputRef}
              type="file"
              accept="image/*"
              onChange={handleBadgeUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => badgeInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Uploading..." : "Upload"}
            </button>
            {badge && (
              <button
                type="button"
                onClick={() => setBadge("")}
                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
                title="Remove badge"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {badge && (
            <div className="mt-2">
              <img
                src={badge}
                alt="Badge preview"
                className="h-16 w-16 rounded-lg border border-slate-700 object-contain bg-white p-1"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
