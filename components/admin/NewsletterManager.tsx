"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Mail,
  Users,
  FileText,
  Sparkles,
  Send,
  CheckCircle,
  Clock,
  Trash2,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  status: "active" | "unsubscribed";
}

interface SubscriberStats {
  total: number;
  active: number;
  unsubscribed: number;
}

interface NewsletterDraft {
  id: string;
  title: string;
  subject: string;
  previewText: string;
  status: "draft" | "approved" | "sent";
  generatedAt: string;
  approvedAt?: string;
  sentAt?: string;
  weekOf: string;
  recipientCount?: number;
  sources: string[];
}

// ---------------------------------------------------------------------------
// Tab types
// ---------------------------------------------------------------------------

type Tab = "subscribers" | "drafts" | "generate";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function NewsletterManager() {
  const [activeTab, setActiveTab] = useState<Tab>("drafts");

  const tabs = [
    { id: "drafts" as Tab, label: "Drafts", icon: FileText },
    { id: "subscribers" as Tab, label: "Subscribers", icon: Users },
    { id: "generate" as Tab, label: "AI Generate", icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Newsletter</h1>
        <span className="text-xs text-slate-500">Powered by Resend + Azure OpenAI</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/50 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
              activeTab === tab.id
                ? "bg-brand-600/20 text-brand-400"
                : "text-slate-400 hover:text-white"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "drafts" && <DraftsTab />}
      {activeTab === "subscribers" && <SubscribersTab />}
      {activeTab === "generate" && <GenerateTab onDraftCreated={() => setActiveTab("drafts")} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drafts Tab
// ---------------------------------------------------------------------------

function DraftsTab() {
  const [drafts, setDrafts] = useState<NewsletterDraft[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/newsletter/drafts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load drafts");
      setDrafts(data.drafts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load drafts");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/admin/newsletter/drafts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDrafts((prev) => prev?.filter((d) => d.id !== id) ?? null);
    }
  };

  if (loading && !drafts) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={fetchDrafts} className="mt-3 text-sm text-slate-400 hover:text-white">
          Try again
        </button>
      </div>
    );
  }

  if (!drafts?.length) {
    return (
      <div className="rounded-xl border border-slate-800 bg-surface-dark p-16 text-center">
        <FileText className="mx-auto mb-4 h-10 w-10 text-slate-600" />
        <p className="text-slate-400">No newsletter drafts yet.</p>
        <p className="mt-1 text-sm text-slate-500">Use the AI Generate tab to create your first one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{drafts.length} newsletter{drafts.length !== 1 ? "s" : ""}</p>
        <button onClick={fetchDrafts} className="flex cursor-pointer items-center gap-1 text-xs text-slate-500 hover:text-white">
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>
      {drafts.map((draft) => (
        <DraftCard key={draft.id} draft={draft} onDelete={handleDelete} />
      ))}
    </div>
  );
}

function DraftCard({
  draft,
  onDelete,
}: {
  draft: NewsletterDraft;
  onDelete: (id: string, title: string) => void;
}) {
  const statusConfig = {
    draft: { label: "Draft", className: "bg-slate-700/50 text-slate-300" },
    approved: { label: "Approved", className: "bg-yellow-500/15 text-yellow-400" },
    sent: { label: "Sent", className: "bg-accent-500/15 text-accent-400" },
  };
  const sc = statusConfig[draft.status];

  return (
    <div className="rounded-xl border border-slate-800 bg-surface-dark p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", sc.className)}>
              {sc.label}
            </span>
            <span className="text-xs text-slate-500">Week of {draft.weekOf}</span>
          </div>
          <p className="truncate text-sm font-semibold text-white">{draft.title}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{draft.subject}</p>
          <p className="mt-1 text-xs text-slate-500">
            Generated {new Date(draft.generatedAt).toLocaleDateString()}
            {draft.sentAt && ` · Sent ${new Date(draft.sentAt).toLocaleDateString()} to ${draft.recipientCount ?? "?"} subscribers`}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link
            href={`/admin/newsletter/${draft.id}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
          {draft.status !== "sent" && (
            <button
              onClick={() => onDelete(draft.id, draft.title)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-red-900/20 hover:text-red-400 cursor-pointer"
              title="Delete draft"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <ChevronRight className="h-4 w-4 text-slate-600" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subscribers Tab
// ---------------------------------------------------------------------------

function SubscribersTab() {
  const [data, setData] = useState<{
    subscribers: Subscriber[];
    stats: SubscriberStats;
    lastSentAt: string | null;
    lastSentTitle: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/newsletter");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load subscribers");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportCsv = () => {
    if (!data?.subscribers.length) return;
    const rows = [
      ["email", "name", "status", "subscribedAt"],
      ...data.subscribers.map((s) => [s.email, s.name ?? "", s.status, s.subscribedAt]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <RefreshCw className="h-5 w-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={fetchData} className="mt-3 text-sm text-slate-400 hover:text-white">
          Try again
        </button>
      </div>
    );
  }

  const stats = data?.stats ?? { total: 0, active: 0, unsubscribed: 0 };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-white" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-accent-400" },
          { label: "Unsubscribed", value: stats.unsubscribed, icon: Mail, color: "text-slate-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-surface-dark p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600/15">
                <Icon className="h-5 w-5 text-brand-400" />
              </div>
              <div>
                <p className={cn("text-2xl font-bold", color)}>{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.lastSentAt && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-surface-dark px-4 py-3 text-sm text-slate-400">
          <Send className="h-4 w-4 shrink-0 text-accent-400" />
          <span>Last sent: <span className="text-white">{data.lastSentTitle}</span> on {new Date(data.lastSentAt).toLocaleDateString()}</span>
        </div>
      )}

      {/* Subscriber list */}
      <div className="rounded-xl border border-slate-800 bg-surface-dark">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Subscribers</h2>
          <button
            onClick={exportCsv}
            className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-400 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
        {!data?.subscribers.length ? (
          <div className="px-5 py-12 text-center text-slate-400">
            No subscribers yet. Add the signup form to your site to start collecting emails.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {data.subscribers.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{sub.email}</p>
                  {sub.name && <p className="text-xs text-slate-400">{sub.name}</p>}
                  <p className="text-xs text-slate-500">{new Date(sub.subscribedAt).toLocaleDateString()}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    sub.status === "active"
                      ? "bg-accent-500/15 text-accent-400"
                      : "bg-slate-700/50 text-slate-400"
                  )}
                >
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate Tab
// ---------------------------------------------------------------------------

function GenerateTab({ onDraftCreated }: { onDraftCreated: () => void }) {
  const [state, setState] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  const generate = async () => {
    setState("generating");
    setMessage("Searching for this week's AI & Cloud news...");

    // Simulate progress messages
    const progressMessages = [
      "Searching for this week's AI & Cloud news...",
      "Researching Azure announcements...",
      "Generating newsletter with GPT-4o...",
      "Creating cover image...",
      "Saving draft...",
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % progressMessages.length;
      setMessage(progressMessages[msgIdx]);
    }, 4000);

    try {
      const res = await fetch("/api/admin/newsletter/generate", { method: "POST" });
      const data = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraftTitle(data.draft?.title ?? "Newsletter draft");
      setState("done");
      setMessage("");
    } catch (e) {
      clearInterval(interval);
      setState("error");
      setMessage(e instanceof Error ? e.message : "Generation failed");
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-surface-dark p-8">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/15">
            <Sparkles className="h-8 w-8 text-brand-400" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-white">AI Newsletter Generator</h2>
          <p className="mb-6 text-sm text-slate-400 leading-relaxed">
            Searches the web for this week&apos;s top AI &amp; Cloud news, then uses GPT-4o to write a complete newsletter with Azure Spotlight, Tip of the Week, and a DALL-E cover image. Saved as a draft for your review.
          </p>

          {state === "idle" && (
            <button
              onClick={generate}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              <Sparkles className="h-4 w-4" />
              Generate This Week&apos;s Newsletter
            </button>
          )}

          {state === "generating" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 text-brand-400">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">{message}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-600" />
              </div>
              <p className="text-xs text-slate-500">This takes 30–60 seconds. Please wait…</p>
            </div>
          )}

          {state === "done" && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-accent-400">
                <CheckCircle className="h-6 w-6" />
                <span className="font-semibold">Draft created!</span>
              </div>
              <p className="text-sm text-slate-300">{draftTitle}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onDraftCreated}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-700"
                >
                  <Eye className="h-4 w-4" />
                  View Draft
                </button>
                <button
                  onClick={() => setState("idle")}
                  className="cursor-pointer text-sm text-slate-400 hover:text-white"
                >
                  Generate another
                </button>
              </div>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
                <p className="text-sm text-red-400">{message}</p>
              </div>
              <button
                onClick={() => setState("idle")}
                className="cursor-pointer text-sm text-slate-400 hover:text-white"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Clock, label: "Generation time", value: "~30–60 seconds" },
          { icon: Mail, label: "Rate limit", value: "3 per hour" },
          { icon: Send, label: "Schedule", value: "Every Saturday 8am UTC" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-slate-800 bg-surface-dark p-4 text-center">
            <Icon className="mx-auto mb-2 h-5 w-5 text-brand-400" />
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-white">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
