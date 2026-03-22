"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

interface CategoryMultiSelectProps {
  presets: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  label?: string;
}

export default function CategoryMultiSelect({
  presets,
  selected,
  onChange,
  label = "Categories",
}: CategoryMultiSelectProps) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (cat: string) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
    }
    setCustomInput("");
  };

  const remove = (cat: string) => {
    onChange(selected.filter((c) => c !== cat));
  };

  // Merge presets + any custom categories the user already selected
  const allPresets = Array.from(new Set([...presets, ...selected]));

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-600/20 text-brand-400 text-xs font-medium rounded-lg border border-brand-600/30"
            >
              {cat}
              <button
                type="button"
                onClick={() => remove(cat)}
                className="hover:text-red-400 transition-colors"
                aria-label={`Remove ${cat}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Preset checkboxes */}
      <div className="flex flex-wrap gap-2 mb-3">
        {allPresets.map((cat) => (
          <label
            key={cat}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all border ${
              selected.includes(cat)
                ? "bg-brand-600/20 border-brand-500 text-brand-400"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(cat)}
              onChange={() => toggle(cat)}
              className="sr-only"
            />
            {cat}
          </label>
        ))}
      </div>

      {/* Custom category input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder="Add custom category..."
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-sm text-slate-300 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </button>
      </div>
    </div>
  );
}
