"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import type { ADREntry, ADRStatus, WAFPillar } from "@/lib/content";

interface ADREditorProps {
  mode: "create" | "edit";
  initialData?: ADREntry;
}

const STATUS_OPTIONS: { value: ADRStatus; label: string }[] = [
  { value: "accepted", label: "Accepted" },
  { value: "proposed", label: "Proposed" },
  { value: "deprecated", label: "Deprecated" },
  { value: "superseded", label: "Superseded" },
];

const WAF_PILLAR_OPTIONS: { value: WAFPillar; label: string }[] = [
  { value: "reliability", label: "Reliability" },
  { value: "security", label: "Security" },
  { value: "cost-optimization", label: "Cost Optimization" },
  { value: "operational-excellence", label: "Operational Excellence" },
  { value: "performance-efficiency", label: "Performance Efficiency" },
];

function toAdrId(n: number): string {
  return `adr-${String(n).padStart(3, "0")}`;
}

export default function ADREditor({ mode, initialData }: ADREditorProps) {
  const router = useRouter();

  const [id, setId] = useState(initialData?.id ?? "");
  const [number, setNumber] = useState(String(initialData?.number ?? ""));
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [status, setStatus] = useState<ADRStatus>(initialData?.status ?? "accepted");
  const [date, setDate] = useState(initialData?.date ?? new Date().toISOString().slice(0, 10));
  const [wafPillars, setWafPillars] = useState<WAFPillar[]>(initialData?.wafPillars ?? []);
  const [context, setContext] = useState(initialData?.context ?? "");
  const [options, setOptions] = useState(initialData?.options?.join("\n") ?? "");
  const [decision, setDecision] = useState(initialData?.decision ?? "");
  const [rationale, setRationale] = useState(initialData?.rationale ?? "");
  const [tradeoffs, setTradeoffs] = useState(initialData?.tradeoffs ?? "");
  const [outcome, setOutcome] = useState(initialData?.outcome ?? "");
  const [tags, setTags] = useState(initialData?.tags?.join(", ") ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleNumberChange(val: string) {
    setNumber(val);
    if (mode === "create") {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n > 0) setId(toAdrId(n));
    }
  }

  function togglePillar(pillar: WAFPillar) {
    setWafPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      setMessage({ type: "error", text: "Title is required" });
      return;
    }
    if (!id.trim()) {
      setMessage({ type: "error", text: "ID is required" });
      return;
    }
    if (wafPillars.length === 0) {
      setMessage({ type: "error", text: "Select at least one WAF pillar" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const payload = {
      id,
      number: parseInt(number, 10) || 1,
      title: title.trim(),
      status,
      date,
      wafPillars,
      context: context.trim(),
      options: options.split("\n").map((o) => o.trim()).filter(Boolean),
      decision: decision.trim(),
      rationale: rationale.trim(),
      tradeoffs: tradeoffs.trim(),
      outcome: outcome.trim(),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    const url =
      mode === "create"
        ? "/api/admin/decisions"
        : `/api/admin/decisions/${initialData!.id}`;
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
        text: mode === "create" ? "ADR created!" : "ADR updated!",
      });
      if (mode === "create" && data.id) {
        router.push(`/admin/decisions/${data.id}/edit`);
      } else {
        router.refresh();
      }
    } else {
      setMessage({
        type: "error",
        text: typeof data.error === "string" ? data.error : "Something went wrong",
      });
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-brand-500";
  const selectClass =
    "w-full rounded-lg border border-slate-700 bg-surface-dark-2 px-3 py-2.5 text-sm text-white outline-none transition focus:border-brand-500";
  const labelClass = "mb-1 block text-xs font-medium uppercase text-slate-400";

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
        {/* Number */}
        <div>
          <label className={labelClass}>Number</label>
          <input
            type="number"
            min={1}
            value={number}
            onChange={(e) => handleNumberChange(e.target.value)}
            className={inputClass}
            placeholder="e.g. 13"
          />
        </div>

        {/* ID */}
        <div>
          <label className={labelClass}>
            ID {mode === "edit" && <span className="text-slate-500 normal-case font-normal">(read-only)</span>}
          </label>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            readOnly={mode === "edit"}
            className={`${inputClass} ${mode === "edit" ? "opacity-50 cursor-not-allowed" : ""}`}
            placeholder="auto-generated from number"
          />
        </div>

        {/* Status */}
        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ADRStatus)} className={selectClass}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="lg:col-span-2">
          <label className={labelClass}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. Azure App Service over Container Apps and Static Web Apps"
          />
        </div>

        {/* Date */}
        <div>
          <label className={labelClass}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* WAF Pillars */}
        <div className="lg:col-span-3">
          <label className={labelClass}>WAF Pillars (select all that apply)</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {WAF_PILLAR_OPTIONS.map((p) => {
              const active = wafPillars.includes(p.value);
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => togglePillar(p.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    active
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Context */}
        <div className="lg:col-span-3">
          <label className={labelClass}>Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What problem or constraint triggered this decision?"
          />
        </div>

        {/* Options Considered */}
        <div className="lg:col-span-3">
          <label className={labelClass}>
            Options Considered{" "}
            <span className="text-slate-500 normal-case font-normal">(one per line)</span>
          </label>
          <textarea
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder={"Azure App Service\nAzure Container Apps\nVercel"}
          />
        </div>

        {/* Decision */}
        <div className="lg:col-span-3">
          <label className={labelClass}>Decision</label>
          <input
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className={inputClass}
            placeholder="What was decided?"
          />
        </div>

        {/* Rationale */}
        <div className="lg:col-span-3">
          <label className={labelClass}>Rationale</label>
          <textarea
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Why this option over the others?"
          />
        </div>

        {/* Trade-offs */}
        <div className="lg:col-span-3">
          <label className={labelClass}>Trade-offs</label>
          <textarea
            value={tradeoffs}
            onChange={(e) => setTradeoffs(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What did you give up or accept?"
          />
        </div>

        {/* Outcome */}
        <div className="lg:col-span-3">
          <label className={labelClass}>Outcome</label>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="What actually happened after the decision?"
          />
        </div>

        {/* Tags */}
        <div className="lg:col-span-3">
          <label className={labelClass}>
            Tags <span className="text-slate-500 normal-case font-normal">(comma-separated, optional)</span>
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="azure, nextjs, auth, hosting"
          />
        </div>
      </div>
    </div>
  );
}
