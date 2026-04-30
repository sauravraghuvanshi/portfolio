"use client";

import { useState, useEffect } from "react";
import { Save, X, Loader2 } from "lucide-react";
import type { AIContentType, AIWriterPayload } from "@/types/ai-writer";

export interface ReviewModalFields {
  contentType: AIContentType;
  title?: string;
  slug?: string;
  status?: "draft" | "published";
  tags?: string[];
  // blog / case-study
  description?: string;
  subtitle?: string;
  category?: string[];
  featured?: boolean;
  // project
  techStack?: string[];
  outcomes?: string[];
  githubUrl?: string;
  liveUrl?: string;
  year?: number;
  // talk
  topic?: string;
  // event
  format?: string;
  summary?: string;
  highlights?: string[];
  // adr
  number?: number;
  adrStatus?: "accepted" | "proposed" | "deprecated" | "superseded";
  date?: string;
  wafPillars?: string[];
  decision?: string;
  // tech-radar-entry
  name?: string;
  ring?: string;
  quadrant?: string;
  useWhen?: string;
  avoidWhen?: string;
}

interface ReviewModalProps {
  contentType: AIContentType;
  payload: AIWriterPayload;
  isOpen: boolean;
  isSaving: boolean;
  saveError?: string | null;
  onClose: () => void;
  onConfirm: (fields: ReviewModalFields) => Promise<void>;
}

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none";
const selectCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-brand-500 focus:outline-none";
const labelCls = "text-xs font-medium text-slate-400 mb-1 block";

const WAF_PILLARS = [
  "reliability",
  "security",
  "cost-optimization",
  "operational-excellence",
  "performance-efficiency",
] as const;

export default function ReviewModal({
  contentType,
  payload,
  isOpen,
  isSaving,
  saveError,
  onClose,
  onConfirm,
}: ReviewModalProps) {
  // Common fields
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [featured, setFeatured] = useState(false);

  // Blog / case-study
  const [description, setDescription] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("");

  // Project
  const [techStack, setTechStack] = useState("");
  const [outcomes, setOutcomes] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());

  // Talk
  const [topic, setTopic] = useState("");

  // Event
  const [format, setFormat] = useState("Speaker");
  const [summary, setSummary] = useState("");
  const [highlights, setHighlights] = useState("");

  // ADR
  const [number, setNumber] = useState<number>(1);
  const [adrStatus, setAdrStatus] = useState<"accepted" | "proposed" | "deprecated" | "superseded">("accepted");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [wafPillars, setWafPillars] = useState<string[]>(["operational-excellence"]);
  const [decision, setDecision] = useState("");

  // Tech radar
  const [name, setName] = useState("");
  const [ring, setRing] = useState("trial");
  const [quadrant, setQuadrant] = useState("tools");
  const [useWhen, setUseWhen] = useState("");
  const [avoidWhen, setAvoidWhen] = useState("");

  // Pre-fill from payload when opening
  useEffect(() => {
    if (!isOpen) return;

    setTitle(payload.title || "");
    setTags((payload.tags || []).join(", "));
    setStatus("draft");
    setFeatured(false);

    switch (contentType) {
      case "blog":
        setDescription(payload.summary || "");
        setCategory((payload.tags || []).slice(0, 3).join(", "));
        break;
      case "case-study":
        setSubtitle(payload.summary || "");
        setCategory((payload.tags || []).slice(0, 2).join(", "));
        break;
      case "project":
        setDescription(payload.summary || "");
        setTechStack((payload.tech || []).join("\n"));
        setOutcomes((payload.impact || []).join("\n"));
        setGithubUrl(payload.githubUrl || "");
        setLiveUrl(payload.liveUrl || "");
        setYear(new Date().getFullYear());
        break;
      case "talk":
        setTopic((payload.tags || [])[0] || "");
        setDescription(payload.summary || "");
        break;
      case "event":
        setFormat("Speaker");
        setTopic((payload.tags || [])[0] || "");
        setSummary(payload.summary || "");
        setHighlights((payload.impact || []).join("\n"));
        setYear(new Date().getFullYear());
        break;
      case "adr":
        setNumber(payload.number ?? 1);
        setAdrStatus((payload.status as typeof adrStatus) ?? "accepted");
        setDate(payload.date || new Date().toISOString().slice(0, 10));
        setWafPillars(payload.wafPillars?.length ? payload.wafPillars : ["operational-excellence"]);
        setDecision(payload.decision || payload.summary || "");
        break;
      case "tech-radar-entry":
        setName(payload.title || "");
        setRing(payload.ring || "trial");
        setQuadrant(payload.quadrant || "tools");
        setSummary(payload.summary || "");
        setUseWhen(payload.useWhen || "");
        setAvoidWhen(payload.avoidWhen || "");
        break;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  function buildFields(): ReviewModalFields {
    const base: ReviewModalFields = {
      contentType,
      title,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    switch (contentType) {
      case "blog":
        return {
          ...base,
          description,
          category: category.split(",").map((t) => t.trim()).filter(Boolean),
          featured,
          status,
        };
      case "case-study":
        return {
          ...base,
          subtitle,
          category: category.split(",").map((t) => t.trim()).filter(Boolean),
          featured,
          status,
        };
      case "project":
        return {
          ...base,
          description,
          techStack: techStack.split("\n").map((t) => t.trim()).filter(Boolean),
          outcomes: outcomes.split("\n").map((t) => t.trim()).filter(Boolean),
          githubUrl,
          liveUrl,
          year,
          featured,
          status,
        };
      case "talk":
        return { ...base, topic, description, featured, status };
      case "event":
        return {
          ...base,
          format,
          topic,
          summary,
          highlights: highlights.split("\n").map((t) => t.trim()).filter(Boolean),
          year,
          featured,
          status,
        };
      case "adr":
        return { ...base, number, adrStatus, date, wafPillars, decision };
      case "tech-radar-entry":
        return { ...base, name, ring, quadrant, summary, useWhen, avoidWhen, status };
      default:
        return base;
    }
  }

  async function handleConfirm() {
    await onConfirm(buildFields());
  }

  function toggleWafPillar(pillar: string) {
    setWafPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    );
  }

  const modalTitle = {
    blog: "Review & Save Blog Post",
    "case-study": "Review & Save Case Study",
    project: "Review & Save Project",
    talk: "Review & Save Talk",
    event: "Review & Save Event",
    adr: "Review & Save ADR",
    "tech-radar-entry": "Review & Save Radar Entry",
    social: "Review Post",
  }[contentType] ?? "Review & Save";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Save className="h-4 w-4 text-brand-400" />
            {modalTitle}
          </h2>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          {/* --- Blog --- */}
          {contentType === "blog" && (
            <>
              <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
              <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} /></Field>
              <Field label="Category (comma-separated)"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} /></Field>
              <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
              <StatusAndFeatured status={status} onStatus={setStatus} featured={featured} onFeatured={setFeatured} />
            </>
          )}

          {/* --- Case Study --- */}
          {contentType === "case-study" && (
            <>
              <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
              <Field label="Subtitle / Summary"><textarea value={subtitle} onChange={(e) => setSubtitle(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
              <Field label="Category (comma-separated)"><input value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls} /></Field>
              <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
              <StatusAndFeatured status={status} onStatus={setStatus} featured={featured} onFeatured={setFeatured} />
            </>
          )}

          {/* --- Project --- */}
          {contentType === "project" && (
            <>
              <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
              <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
              <Field label="Tech Stack (one per line)"><textarea value={techStack} onChange={(e) => setTechStack(e.target.value)} rows={5} className={`${inputCls} font-mono text-xs resize-none`} /></Field>
              <Field label="Outcomes / Impact (one per line)"><textarea value={outcomes} onChange={(e) => setOutcomes(e.target.value)} rows={4} className={`${inputCls} font-mono text-xs resize-none`} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="GitHub URL"><input value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." className={inputCls} /></Field>
                <Field label="Live URL"><input value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." className={inputCls} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
                <Field label="Year"><input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} className={inputCls} /></Field>
              </div>
              <StatusAndFeatured status={status} onStatus={setStatus} featured={featured} onFeatured={setFeatured} />
            </>
          )}

          {/* --- Talk --- */}
          {contentType === "talk" && (
            <>
              <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
              <Field label="Topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls} /></Field>
              <Field label="Description / Abstract"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} /></Field>
              <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
              <StatusAndFeatured status={status} onStatus={setStatus} featured={featured} onFeatured={setFeatured} />
            </>
          )}

          {/* --- Event --- */}
          {contentType === "event" && (
            <>
              <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Year"><input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())} className={inputCls} /></Field>
                <Field label="Format">
                  <select value={format} onChange={(e) => setFormat(e.target.value)} className={selectCls}>
                    {["Speaker", "Organizer", "Mentor", "Panelist"].map((f) => <option key={f}>{f}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Topic"><input value={topic} onChange={(e) => setTopic(e.target.value)} className={inputCls} /></Field>
              <Field label="Summary"><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
              <Field label="Highlights (one per line)"><textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={3} className={`${inputCls} font-mono text-xs resize-none`} /></Field>
              <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
              <StatusAndFeatured status={status} onStatus={setStatus} featured={featured} onFeatured={setFeatured} />
            </>
          )}

          {/* --- ADR --- */}
          {contentType === "adr" && (
            <>
              <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Number"><input type="number" value={number} onChange={(e) => setNumber(parseInt(e.target.value) || 1)} className={inputCls} /></Field>
                <Field label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
              </div>
              <Field label="ADR Status">
                <select value={adrStatus} onChange={(e) => setAdrStatus(e.target.value as typeof adrStatus)} className={selectCls}>
                  <option value="accepted">Accepted</option>
                  <option value="proposed">Proposed</option>
                  <option value="deprecated">Deprecated</option>
                  <option value="superseded">Superseded</option>
                </select>
              </Field>
              <Field label="Decision (one sentence)"><textarea value={decision} onChange={(e) => setDecision(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
              <Field label="WAF Pillars">
                <div className="flex flex-wrap gap-2 mt-1">
                  {WAF_PILLARS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleWafPillar(p)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        wafPillars.includes(p)
                          ? "bg-brand-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
            </>
          )}

          {/* --- Tech Radar Entry --- */}
          {contentType === "tech-radar-entry" && (
            <>
              <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Ring">
                  <select value={ring} onChange={(e) => setRing(e.target.value)} className={selectCls}>
                    {["adopt", "trial", "assess", "hold"].map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </Field>
                <Field label="Quadrant">
                  <select value={quadrant} onChange={(e) => setQuadrant(e.target.value)} className={selectCls}>
                    {["languages", "platforms", "tools", "techniques"].map((q) => <option key={q} value={q} className="capitalize">{q}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Summary"><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
              <Field label="Use When"><input value={useWhen} onChange={(e) => setUseWhen(e.target.value)} className={inputCls} /></Field>
              <Field label="Avoid When"><input value={avoidWhen} onChange={(e) => setAvoidWhen(e.target.value)} className={inputCls} /></Field>
              <Field label="Tags (comma-separated)"><input value={tags} onChange={(e) => setTags(e.target.value)} className={inputCls} /></Field>
              <div>
                <label className={labelCls}>Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className={selectCls}>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </>
          )}

          {saveError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {saveError}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-800 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving || !title.trim() && contentType !== "tech-radar-entry"}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? "Saving..." : "Confirm & Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function StatusAndFeatured({
  status,
  onStatus,
  featured,
  onFeatured,
}: {
  status: "draft" | "published";
  onStatus: (v: "draft" | "published") => void;
  featured: boolean;
  onFeatured: (v: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 items-end">
      <div>
        <label className={labelCls}>Status</label>
        <select value={status} onChange={(e) => onStatus(e.target.value as "draft" | "published")} className={selectCls}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-300 pb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => onFeatured(e.target.checked)}
          className="h-4 w-4 rounded border-slate-700 bg-slate-800 accent-brand-600"
        />
        Featured
      </label>
    </div>
  );
}
