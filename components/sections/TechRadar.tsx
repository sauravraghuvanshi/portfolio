"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { RadarEntry, RadarQuadrant, RadarRing, TechRadar } from "@/lib/content";

// ---------- geometry --------------------------------------------------------

const VIEW = 800;
const CENTER = VIEW / 2;

// outer radius for each ring
const RING_RADIUS: Record<RadarRing, number> = {
  adopt: 130,
  trial: 220,
  assess: 300,
  hold: 370,
};

const RING_ORDER: RadarRing[] = ["adopt", "trial", "assess", "hold"];

// ThoughtWorks-style layout:
// TL = techniques, TR = languages, BR = platforms, BL = tools
const QUADRANT_ANGLE: Record<RadarQuadrant, [number, number]> = {
  // angles in degrees, SVG convention (0° = +x axis, clockwise positive y-down)
  techniques: [180, 270],   // top-left
  languages:  [270, 360],   // top-right
  platforms:  [0, 90],      // bottom-right
  tools:      [90, 180],    // bottom-left
};

const QUADRANT_LABEL: Record<RadarQuadrant, string> = {
  languages: "Languages & Frameworks",
  platforms: "Platforms",
  tools: "Tools",
  techniques: "Techniques",
};

const RING_COLOR: Record<RadarRing, { fill: string; stroke: string; text: string }> = {
  adopt:  { fill: "#10b981", stroke: "#10b981", text: "Adopt" },
  trial:  { fill: "#3b82f6", stroke: "#3b82f6", text: "Trial" },
  assess: { fill: "#f59e0b", stroke: "#f59e0b", text: "Assess" },
  hold:   { fill: "#ef4444", stroke: "#ef4444", text: "Hold" },
};

// Deterministic [0,1) PRNG seeded from string id — keeps dot positions stable.
function hash01(s: string, salt = 0): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

interface PositionedEntry extends RadarEntry {
  cx: number;
  cy: number;
}

function positionEntries(entries: RadarEntry[]): PositionedEntry[] {
  // Group by quadrant+ring so we can spread within each band.
  const groups = new Map<string, RadarEntry[]>();
  entries.forEach((e) => {
    const key = `${e.quadrant}|${e.ring}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  });

  const positioned: PositionedEntry[] = [];
  groups.forEach((group, key) => {
    const [quadrant, ring] = key.split("|") as [RadarQuadrant, RadarRing];
    const [a0Deg, a1Deg] = QUADRANT_ANGLE[quadrant];
    const ringIdx = RING_ORDER.indexOf(ring);
    const innerR = ringIdx === 0 ? 0 : RING_RADIUS[RING_ORDER[ringIdx - 1]];
    const outerR = RING_RADIUS[ring];

    const padDeg = 4;
    const a0 = ((a0Deg + padDeg) * Math.PI) / 180;
    const a1 = ((a1Deg - padDeg) * Math.PI) / 180;
    const rPad = 14;
    const rLo = innerR + rPad;
    const rHi = outerR - rPad;

    group.forEach((entry, idx) => {
      // jittered grid: pick angle slot from idx, radius from hash
      const slot = (idx + 0.5) / group.length;
      const angleJitter = (hash01(entry.id, 1) - 0.5) * 0.45;
      const angle = a0 + (a1 - a0) * Math.min(1, Math.max(0, slot + angleJitter));
      const radius = rLo + (rHi - rLo) * (0.15 + 0.7 * hash01(entry.id, 2));
      positioned.push({
        ...entry,
        cx: Math.round((CENTER + Math.cos(angle) * radius) * 100) / 100,
        cy: Math.round((CENTER + Math.sin(angle) * radius) * 100) / 100,
      });
    });
  });
  return positioned;
}

// ---------- component -------------------------------------------------------

const QUADRANT_FILTERS: Array<RadarQuadrant | "all"> = [
  "all",
  "languages",
  "platforms",
  "tools",
  "techniques",
];

const QUADRANT_FILTER_LABEL: Record<RadarQuadrant | "all", string> = {
  all: "All",
  ...QUADRANT_LABEL,
};

export default function TechRadar({ radar }: { radar: TechRadar }) {
  const [filter, setFilter] = useState<RadarQuadrant | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const positioned = useMemo(() => positionEntries(radar.entries), [radar.entries]);
  const visible = useMemo(
    () => (filter === "all" ? positioned : positioned.filter((e) => e.quadrant === filter)),
    [positioned, filter]
  );

  const selected = useMemo(
    () => (selectedId ? positioned.find((e) => e.id === selectedId) ?? null : null),
    [selectedId, positioned]
  );

  // Esc to close drawer
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  const counts = useMemo(() => {
    const c: Record<RadarRing, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    radar.entries.forEach((e) => {
      c[e.ring]++;
    });
    return c;
  }, [radar.entries]);

  return (
    <div className="relative">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filter by quadrant">
        {QUADRANT_FILTERS.map((q) => {
          const count = q === "all" ? radar.entries.length : radar.entries.filter((e) => e.quadrant === q).length;
          const active = filter === q;
          return (
            <button
              key={q}
              type="button"
              onClick={() => setFilter(q)}
              aria-pressed={active}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {QUADRANT_FILTER_LABEL[q]}
              <span className="ml-1.5 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Ring legend */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 text-xs sm:text-sm">
        {RING_ORDER.map((ring) => (
          <div key={ring} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: RING_COLOR[ring].fill }}
              aria-hidden
            />
            <span className="text-slate-700 dark:text-slate-300 font-medium">{RING_COLOR[ring].text}</span>
            <span className="text-slate-500 dark:text-slate-500">({counts[ring]})</span>
          </div>
        ))}
      </div>

      {/* The radar */}
      <RadarSvg
        entries={visible}
        filter={filter}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {/* Quadrant grid lists below the radar (mobile-friendly + a11y) */}
      <QuadrantLists
        entries={radar.entries}
        filter={filter}
        onSelect={setSelectedId}
      />

      {/* Detail drawer */}
      <Drawer entry={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}

// ---------- radar SVG -------------------------------------------------------

function RadarSvg({
  entries,
  filter,
  selectedId,
  onSelect,
}: {
  entries: PositionedEntry[];
  filter: RadarQuadrant | "all";
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative w-full max-w-[760px] mx-auto aspect-square">
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="w-full h-full"
        role="img"
        aria-label="Tech radar diagram"
      >
        {/* rings */}
        {RING_ORDER.map((ring) => (
          <circle
            key={ring}
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS[ring]}
            fill="none"
            className="stroke-slate-300/60 dark:stroke-slate-700/60"
            strokeWidth={1}
          />
        ))}

        {/* quadrant dividers */}
        <line
          x1={CENTER}
          y1={CENTER - RING_RADIUS.hold}
          x2={CENTER}
          y2={CENTER + RING_RADIUS.hold}
          className="stroke-slate-300/60 dark:stroke-slate-700/60"
          strokeWidth={1}
        />
        <line
          x1={CENTER - RING_RADIUS.hold}
          y1={CENTER}
          x2={CENTER + RING_RADIUS.hold}
          y2={CENTER}
          className="stroke-slate-300/60 dark:stroke-slate-700/60"
          strokeWidth={1}
        />

        {/* quadrant labels */}
        {(Object.keys(QUADRANT_ANGLE) as RadarQuadrant[]).map((q) => {
          const [a0, a1] = QUADRANT_ANGLE[q];
          const mid = ((a0 + a1) / 2 / 180) * Math.PI;
          const r = RING_RADIUS.hold + 24;
          const x = CENTER + Math.cos(mid) * r;
          const y = CENTER + Math.sin(mid) * r;
          const dimmed = filter !== "all" && filter !== q;
          return (
            <text
              key={q}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`text-[18px] font-semibold transition-opacity ${
                dimmed ? "opacity-30" : "opacity-100"
              } fill-slate-800 dark:fill-slate-200`}
            >
              {QUADRANT_LABEL[q]}
            </text>
          );
        })}

        {/* ring labels (along vertical center line, top half) */}
        {RING_ORDER.map((ring, idx) => {
          const innerR = idx === 0 ? 0 : RING_RADIUS[RING_ORDER[idx - 1]];
          const outerR = RING_RADIUS[ring];
          const r = (innerR + outerR) / 2;
          return (
            <text
              key={ring}
              x={CENTER}
              y={CENTER - r}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] uppercase tracking-wider font-semibold fill-slate-400 dark:fill-slate-500"
            >
              {RING_COLOR[ring].text}
            </text>
          );
        })}

        {/* dots */}
        {entries.map((e) => {
          const isSelected = e.id === selectedId;
          return (
            <g
              key={e.id}
              transform={`translate(${e.cx} ${e.cy})`}
              className="cursor-pointer focus:outline-none"
              role="button"
              tabIndex={0}
              aria-label={`${e.name}, ${e.ring}, ${QUADRANT_LABEL[e.quadrant]}`}
              onClick={() => onSelect(e.id)}
              onKeyDown={(ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                  ev.preventDefault();
                  onSelect(e.id);
                }
              }}
            >
              <circle
                r={isSelected ? 11 : 8}
                fill={RING_COLOR[e.ring].fill}
                stroke="white"
                strokeWidth={isSelected ? 3 : 2}
                className="transition-all hover:opacity-80"
              />
              {e.movedFrom && (
                <text
                  x={0}
                  y={-13}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-700 dark:fill-slate-200"
                  aria-hidden
                >
                  {RING_ORDER.indexOf(e.ring) < RING_ORDER.indexOf(e.movedFrom) ? "▲" : "▼"}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------- lists below the radar (mobile + a11y fallback) ------------------

function QuadrantLists({
  entries,
  filter,
  onSelect,
}: {
  entries: RadarEntry[];
  filter: RadarQuadrant | "all";
  onSelect: (id: string) => void;
}) {
  const quadrants = filter === "all" ? (Object.keys(QUADRANT_LABEL) as RadarQuadrant[]) : [filter];

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
      {quadrants.map((q) => {
        const list = entries.filter((e) => e.quadrant === q);
        return (
          <div key={q}>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
              {QUADRANT_LABEL[q]}
              <span className="ml-2 text-xs text-slate-500 dark:text-slate-500 font-normal">
                ({list.length})
              </span>
            </h3>
            <div className="space-y-4">
              {RING_ORDER.map((ring) => {
                const items = list.filter((e) => e.ring === ring);
                if (items.length === 0) return null;
                return (
                  <div key={ring}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: RING_COLOR[ring].fill }}
                        aria-hidden
                      />
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                        {RING_COLOR[ring].text}
                      </span>
                    </div>
                    <ul className="flex flex-wrap gap-1.5">
                      {items.map((e) => (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => onSelect(e.id)}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-100 dark:hover:bg-brand-900/40 hover:text-brand-700 dark:hover:text-brand-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                          >
                            {e.name}
                            {e.movedFrom && (
                              <span className="ml-1 text-[10px] text-brand-600 dark:text-brand-400" aria-hidden>
                                {RING_ORDER.indexOf(e.ring) < RING_ORDER.indexOf(e.movedFrom) ? "▲" : "▼"}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- detail drawer ---------------------------------------------------

function Drawer({ entry, onClose }: { entry: RadarEntry | null; onClose: () => void }) {
  const open = !!entry;

  // lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleBackdrop = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  return (
    <AnimatePresence>
      {open && entry && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={handleBackdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="radar-drawer-title"
        >
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ background: RING_COLOR[entry.ring].fill }}
                    aria-hidden
                  />
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">
                    {RING_COLOR[entry.ring].text} · {QUADRANT_LABEL[entry.quadrant]}
                  </span>
                </div>
                <h2
                  id="radar-drawer-title"
                  className="text-2xl font-bold text-slate-900 dark:text-white"
                >
                  {entry.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="p-2 -m-2 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {entry.movedFrom && (
                <div className="text-xs px-3 py-2 rounded-md bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
                  Moved from <strong>{RING_COLOR[entry.movedFrom].text}</strong> →{" "}
                  <strong>{RING_COLOR[entry.ring].text}</strong>
                </div>
              )}

              <p className="text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                {entry.summary}
              </p>

              {entry.useWhen && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                    Use when
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{entry.useWhen}</p>
                </div>
              )}

              {entry.avoidWhen && (
                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-rose-700 dark:text-rose-400 mb-2">
                    Avoid when
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{entry.avoidWhen}</p>
                </div>
              )}

              {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
