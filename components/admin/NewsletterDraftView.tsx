"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  Send,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Eye,
  Code2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NewsletterDraft {
  id: string;
  title: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  coverImageUrl?: string;
  status: "draft" | "approved" | "sent";
  generatedAt: string;
  approvedAt?: string;
  sentAt?: string;
  weekOf: string;
  sources: string[];
  recipientCount?: number;
}

export default function NewsletterDraftView({ id }: { id: string }) {
  const [draft, setDraft] = useState<NewsletterDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [actionMsg, setActionMsg] = useState("");
  const [previewMode, setPreviewMode] = useState<"preview" | "html">("preview");
  const [editSubject, setEditSubject] = useState("");
  const [editPreview, setEditPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/newsletter/drafts/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Not found");
        setDraft(data.draft);
        setEditSubject(data.draft.subject);
        setEditPreview(data.draft.previewText);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load draft");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const saveEdits = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/newsletter/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: editSubject, previewText: editPreview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setDraft(data.draft);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!draft || draft.status !== "draft") return;
    setActionState("loading");
    setActionMsg("Approving...");
    try {
      const res = await fetch(`/api/admin/newsletter/drafts/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Approve failed");
      setDraft(data.draft);
      setActionState("done");
      setActionMsg("Approved! Ready to send.");
    } catch (e) {
      setActionState("error");
      setActionMsg(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleSend = async () => {
    if (!draft || draft.status !== "approved") return;
    if (!confirm(`Send "${draft.subject}" to all active subscribers? This cannot be undone.`)) return;
    setActionState("loading");
    setActionMsg("Sending...");
    try {
      const res = await fetch(`/api/admin/newsletter/drafts/${id}/send`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setDraft((prev) => (prev ? { ...prev, status: "sent", sentAt: new Date().toISOString(), recipientCount: data.sent } : prev));
      setActionState("done");
      setActionMsg(`Sent to ${data.sent} subscriber(s)${data.failed > 0 ? ` (${data.failed} failed)` : ""}!`);
    } catch (e) {
      setActionState("error");
      setActionMsg(e instanceof Error ? e.message : "Send failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error || !draft) {
    return (
      <div className="space-y-4">
        <Link href="/admin/newsletter" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Newsletter
        </Link>
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-red-400">{error ?? "Draft not found"}</p>
        </div>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: "Draft", className: "bg-slate-700/50 text-slate-300" },
    approved: { label: "Approved", className: "bg-yellow-500/15 text-yellow-400" },
    sent: { label: "Sent", className: "bg-accent-500/15 text-accent-400" },
  };
  const sc = statusConfig[draft.status];

  const subjectDirty = editSubject !== draft.subject || editPreview !== draft.previewText;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/admin/newsletter" className="mt-1 text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", sc.className)}>
                {sc.label}
              </span>
              <span className="text-xs text-slate-500">Week of {draft.weekOf}</span>
            </div>
            <h1 className="text-xl font-bold text-white">{draft.title}</h1>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {draft.status === "draft" && (
            <button
              onClick={handleApprove}
              disabled={actionState === "loading"}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-yellow-500/15 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/25 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Approve
            </button>
          )}
          {draft.status === "approved" && (
            <button
              onClick={handleSend}
              disabled={actionState === "loading"}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {actionState === "loading" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send to Subscribers
            </button>
          )}
          {draft.status === "sent" && (
            <span className="flex items-center gap-2 text-sm text-accent-400">
              <CheckCircle className="h-4 w-4" />
              Sent {draft.recipientCount ? `to ${draft.recipientCount}` : ""}
            </span>
          )}
        </div>
      </div>

      {/* Action status */}
      {actionState !== "idle" && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            actionState === "done"
              ? "border-accent-700/50 bg-accent-950/20 text-accent-400"
              : actionState === "error"
              ? "border-red-900/50 bg-red-950/20 text-red-400"
              : "border-slate-700 bg-slate-900 text-slate-300"
          )}
        >
          {actionState === "loading" && <RefreshCw className="mr-2 inline h-3.5 w-3.5 animate-spin" />}
          {actionMsg}
        </div>
      )}

      {/* Editable fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Subject Line</label>
          <input
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
            disabled={draft.status === "sent"}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none disabled:opacity-60"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Preview Text</label>
          <input
            value={editPreview}
            onChange={(e) => setEditPreview(e.target.value)}
            disabled={draft.status === "sent"}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none disabled:opacity-60"
          />
        </div>
      </div>
      {subjectDirty && draft.status !== "sent" && (
        <div className="flex items-center gap-3">
          <button
            onClick={saveEdits}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-brand-700 bg-brand-600/10 px-3 py-1.5 text-xs font-medium text-brand-400 hover:bg-brand-600/20 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={() => { setEditSubject(draft.subject); setEditPreview(draft.previewText); }}
            className="cursor-pointer text-xs text-slate-500 hover:text-white"
          >
            Discard
          </button>
        </div>
      )}

      {/* Preview/HTML toggle */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1">
            <button
              onClick={() => setPreviewMode("preview")}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                previewMode === "preview" ? "bg-brand-600/20 text-brand-400" : "text-slate-400 hover:text-white"
              )}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <button
              onClick={() => setPreviewMode("html")}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
                previewMode === "html" ? "bg-brand-600/20 text-brand-400" : "text-slate-400 hover:text-white"
              )}
            >
              <Code2 className="h-3.5 w-3.5" /> HTML
            </button>
          </div>
          {draft.sources.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <ExternalLink className="h-3 w-3" />
              {draft.sources.length} source{draft.sources.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {previewMode === "preview" ? (
          <div className="rounded-xl border border-slate-800 bg-white overflow-hidden">
            <iframe
              srcDoc={buildPreviewHtml(draft)}
              className="h-[700px] w-full"
              title="Newsletter preview"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-auto max-h-[700px]">
            <pre className="p-4 text-xs text-slate-300 whitespace-pre-wrap font-mono">
              {draft.htmlContent}
            </pre>
          </div>
        )}
      </div>

      {/* Sources */}
      {draft.sources.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-surface-dark p-5">
          <h3 className="mb-3 text-sm font-semibold text-white">Source URLs</h3>
          <div className="space-y-1.5">
            {draft.sources.slice(0, 10).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-brand-400 truncate"
              >
                <ExternalLink className="h-3 w-3 shrink-0" />
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPreviewHtml(draft: NewsletterDraft): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{margin:0;padding:16px;background:#f0f4f8;}</style></head><body>
  ${draft.coverImageUrl ? `<img src="${draft.coverImageUrl}" style="width:100%;max-height:220px;object-fit:cover;border-radius:8px;margin-bottom:16px;" />` : ""}
  <div style="background:#1e293b;color:#f8fafc;padding:24px;border-radius:8px;margin-bottom:8px;">
    <h1 style="margin:0 0 8px;font-family:sans-serif;font-size:22px;">${draft.title}</h1>
    <p style="margin:0;font-family:sans-serif;font-size:13px;color:#94a3b8;">Week of ${draft.weekOf}</p>
  </div>
  ${draft.htmlContent}
  </body></html>`;
}
