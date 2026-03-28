"use client";

import { useState, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Globe, X, Calendar, ArrowRight, Wifi, MousePointerClick } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { CityCluster } from "@/lib/content";

const GEO_URL = "/geo/countries-110m.json";

interface SpeakingMapProps {
  clusters: CityCluster[];
  virtualCount: number;
  selectedCity: string | null;
  onCitySelect: (city: string | null) => void;
}

/* ------------------------------------------------------------------ */
/*  Popup card                                                        */
/* ------------------------------------------------------------------ */
function PinPopup({
  cluster,
  onClose,
  onShowAll,
}: {
  cluster: CityCluster;
  onClose: () => void;
  onShowAll: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute z-30 w-[420px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-brand-500/10 overflow-hidden"
      style={{ bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 16 }}
    >
      {/* Header */}
      <div className="relative px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-500/10 dark:bg-brand-500/20 ring-1 ring-brand-500/20">
              <MapPin className="w-4 h-4 text-brand-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {cluster.city}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-500">
                {cluster.country} · {cluster.events.length} event{cluster.events.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Event cards with images */}
      <div className="max-h-[340px] overflow-y-auto p-2 space-y-1.5">
        {cluster.events.map((event) => (
          <Link
            key={event.slug}
            href={`/events/${event.slug}`}
            className="group flex gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            {/* Thumbnail */}
            <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-800">
              {event.coverImage ? (
                <Image
                  src={event.coverImage}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-950/50 dark:to-accent-950/50 flex items-center justify-center">
                  <span className="text-lg font-bold gradient-text opacity-30 select-none">
                    {event.title.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 py-0.5">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors leading-tight">
                {event.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {event.year}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium">
                  {event.format}
                </span>
              </div>
            </div>

            <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity self-center flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Footer action */}
      <button
        onClick={onShowAll}
        className="w-full px-4 py-2.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 border-t border-slate-100 dark:border-slate-800 transition-colors flex items-center justify-center gap-1.5"
      >
        Filter all {cluster.city} events
        <ArrowRight className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */
export default function SpeakingMap({
  clusters,
  virtualCount,
  selectedCity,
  onCitySelect,
}: SpeakingMapProps) {
  const [popupCluster, setPopupCluster] = useState<CityCluster | null>(null);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const physicalCount = clusters.reduce((sum, c) => sum + c.events.length, 0);
  const totalCities = clusters.length;

  const handlePinClick = useCallback((cluster: CityCluster) => {
    setPopupCluster((prev) => (prev?.city === cluster.city ? null : cluster));
  }, []);

  const handleShowAll = useCallback(
    (city: string) => {
      onCitySelect(city);
      setPopupCluster(null);
    },
    [onCitySelect]
  );

  return (
    <div className="relative rounded-2xl overflow-hidden mb-8 border border-slate-200 dark:border-slate-800">
      {/* ── Dark gradient background for the entire card ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-[#0c1222] dark:via-[#0f172a] dark:to-[#0c1222]" />

      {/* ── Header ─────────────────────────────────── */}
      <div className="relative px-5 py-4 border-b border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm tracking-tight">
              Speaking Footprint
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">
              {physicalCount + virtualCount} events · {totalCities} {totalCities === 1 ? "city" : "cities"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20">
            <MapPin className="w-3 h-3" />
            {physicalCount} in-person
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/10 dark:ring-white/10">
            <Wifi className="w-3 h-3" />
            {virtualCount} virtual
          </span>
        </div>
      </div>

      {/* ── Desktop map ────────────────────────────── */}
      <div className="hidden md:block relative" style={{ height: 620 }}>
        {/* Radial glow behind India */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute opacity-0 dark:opacity-100"
            style={{
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "600px",
              height: "600px",
              background: "radial-gradient(ellipse, rgba(59,130,246,0.08) 0%, transparent 70%)",
            }}
          />
        </div>

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [79, 22], scale: 1400 }}
          width={900}
          height={620}
          style={{ width: "100%", height: "100%" }}
        >
          <defs>
            <radialGradient id="pin-fill" cx="35%" cy="35%">
              <stop offset="0%" stopColor="var(--color-brand-400)" />
              <stop offset="100%" stopColor="var(--color-brand-600)" />
            </radialGradient>
            <radialGradient id="pin-fill-hover" cx="35%" cy="35%">
              <stop offset="0%" stopColor="var(--color-brand-300)" />
              <stop offset="100%" stopColor="var(--color-brand-500)" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feFlood floodColor="var(--color-brand-400)" floodOpacity="0.5" />
              <feComposite in2="b" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feFlood floodColor="var(--color-brand-400)" floodOpacity="0.7" />
              <feComposite in2="b" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ZoomableGroup center={[79, 22]} zoom={1} minZoom={0.7} maxZoom={5}>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name as string;
                  const isIndia = name === "India";
                  // Neighboring countries get a slightly visible fill
                  const isNeighbor = ["Pakistan", "China", "Nepal", "Bangladesh", "Myanmar", "Sri Lanka", "Afghanistan", "Bhutan"].includes(name);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={
                        isIndia
                          ? "var(--color-brand-100)"
                          : isNeighbor
                          ? "#e8ecf0"
                          : "#f0f2f5"
                      }
                      stroke={
                        isIndia
                          ? "var(--color-brand-300)"
                          : isNeighbor
                          ? "#d0d5dc"
                          : "#dde1e7"
                      }
                      strokeWidth={isIndia ? 1 : 0.3}
                      className={
                        isIndia
                          ? "dark:!fill-brand-900/50 dark:!stroke-brand-500/30"
                          : isNeighbor
                          ? "dark:!fill-[#141e33] dark:!stroke-[#1e2d47]"
                          : "dark:!fill-[#111827] dark:!stroke-[#1a2236]"
                      }
                      style={{
                        default: { outline: "none" },
                        hover: {
                          outline: "none",
                          fill: isIndia ? "var(--color-brand-200)" : undefined,
                        },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* ── Pins ── */}
            {clusters.map((cluster, i) => {
              const count = cluster.events.length;
              const pinR = Math.max(10, 7 + Math.sqrt(count) * 3.5);
              const isSelected = selectedCity === cluster.city;
              const isHovered = hoveredCity === cluster.city;
              const isActive = isSelected || isHovered;

              return (
                <Marker key={cluster.city} coordinates={[cluster.lng, cluster.lat]}>
                  {/* Animated glow ring for active pins */}
                  {isActive && (
                    <motion.circle
                      r={pinR + 8}
                      fill="none"
                      stroke="var(--color-brand-400)"
                      strokeWidth={1.5}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: [0.5, 0], scale: [1, 1.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                    />
                  )}

                  {/* Outer ambient glow (always visible, subtle) */}
                  <circle
                    r={pinR + 6}
                    fill="var(--color-brand-500)"
                    opacity={isActive ? 0.15 : 0.06}
                    className="transition-opacity duration-300"
                  />

                  {/* Main pin body */}
                  <motion.g
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: i * 0.1 }}
                    onClick={() => handlePinClick(cluster)}
                    onMouseEnter={() => setHoveredCity(cluster.city)}
                    onMouseLeave={() => setHoveredCity(null)}
                    style={{ cursor: "pointer" }}
                    filter={isActive ? "url(#glow-strong)" : "url(#glow)"}
                  >
                    <circle
                      r={pinR}
                      fill={isActive ? "url(#pin-fill-hover)" : "url(#pin-fill)"}
                      stroke="rgba(255,255,255,0.9)"
                      strokeWidth={2}
                    />
                    {/* Inner highlight */}
                    <circle
                      r={pinR - 3}
                      fill="none"
                      stroke="rgba(255,255,255,0.15)"
                      strokeWidth={1}
                    />

                    {count > 1 ? (
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fill="white"
                        fontSize={count > 9 ? 10 : 11}
                        fontWeight={800}
                        fontFamily="system-ui, -apple-system, sans-serif"
                        style={{ pointerEvents: "none" }}
                      >
                        {count}
                      </text>
                    ) : (
                      <circle r={2.5} fill="white" opacity={0.9} />
                    )}
                  </motion.g>

                  {/* City label with background */}
                  <g style={{ pointerEvents: "none" }}>
                    <rect
                      x={-30}
                      y={pinR + 8}
                      width={60}
                      height={16}
                      rx={4}
                      fill="white"
                      opacity={0.85}
                      className="dark:!fill-[#0f172a] dark:opacity-90"
                    />
                    <text
                      textAnchor="middle"
                      y={pinR + 20}
                      fill="currentColor"
                      fontSize={9}
                      fontWeight={600}
                      fontFamily="system-ui, -apple-system, sans-serif"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {cluster.city}
                    </text>
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Popup overlay */}
        <AnimatePresence>
          {popupCluster && (
            <div
              className="absolute z-30"
              style={{ left: "50%", top: "38%", transform: "translateX(-50%)" }}
            >
              <PinPopup
                cluster={popupCluster}
                onClose={() => setPopupCluster(null)}
                onShowAll={() => handleShowAll(popupCluster.city)}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Bottom legend */}
        <div className="absolute bottom-0 inset-x-0 z-10">
          <div className="bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#0c1222] dark:via-[#0c1222]/80 dark:to-transparent pt-10 pb-4 px-5">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {clusters.map((c) => (
                <button
                  key={c.city}
                  onClick={() => {
                    onCitySelect(selectedCity === c.city ? null : c.city);
                    setPopupCluster(null);
                  }}
                  onMouseEnter={() => setHoveredCity(c.city)}
                  onMouseLeave={() => setHoveredCity(null)}
                  className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                    selectedCity === c.city
                      ? "bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/30"
                      : "bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-brand-400 dark:hover:border-brand-500/50 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ring-2 ${
                      selectedCity === c.city
                        ? "bg-white ring-white/30"
                        : "bg-brand-500 ring-brand-500/20 group-hover:ring-brand-500/40"
                    }`}
                  />
                  {c.city}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    selectedCity === c.city
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                  }`}>
                    {c.events.length}
                  </span>
                </button>
              ))}
              <button
                onClick={() => {
                  onCitySelect(selectedCity === "virtual" ? null : "virtual");
                  setPopupCluster(null);
                }}
                className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                  selectedCity === "virtual"
                    ? "bg-slate-700 text-white border-slate-600 shadow-lg shadow-slate-700/30"
                    : "bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-slate-400 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/10"
                }`}
              >
                <Wifi className="w-3 h-3 opacity-70" />
                Virtual
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  selectedCity === "virtual"
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400"
                }`}>
                  {virtualCount}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Hint text */}
        <div className="absolute top-4 right-5 z-10 flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-600">
          <MousePointerClick className="w-3 h-3" />
          Click pins to explore
        </div>
      </div>

      {/* ── Mobile ─────────────────────────────────── */}
      <div className="md:hidden relative">
        <div className="h-56 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0c1222] dark:to-[#0f172a]" />
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ center: [79, 22], scale: 900 }}
            width={400}
            height={240}
            style={{ width: "100%", height: "100%" }}
          >
            <defs>
              <radialGradient id="pin-fill-m" cx="35%" cy="35%">
                <stop offset="0%" stopColor="var(--color-brand-400)" />
                <stop offset="100%" stopColor="var(--color-brand-600)" />
              </radialGradient>
              <filter id="glow-m">
                <feGaussianBlur stdDeviation="3" result="b" />
                <feFlood floodColor="var(--color-brand-400)" floodOpacity="0.4" />
                <feComposite in2="b" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name = geo.properties.name as string;
                  const isIndia = name === "India";
                  const isNeighbor = ["Pakistan", "China", "Nepal", "Bangladesh", "Myanmar", "Sri Lanka", "Afghanistan", "Bhutan"].includes(name);
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isIndia ? "var(--color-brand-100)" : isNeighbor ? "#e8ecf0" : "#f0f2f5"}
                      stroke={isIndia ? "var(--color-brand-300)" : "#dde1e7"}
                      strokeWidth={isIndia ? 0.8 : 0.3}
                      className={
                        isIndia
                          ? "dark:!fill-brand-900/50 dark:!stroke-brand-500/30"
                          : isNeighbor
                          ? "dark:!fill-[#141e33] dark:!stroke-[#1e2d47]"
                          : "dark:!fill-[#111827] dark:!stroke-[#1a2236]"
                      }
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>
            {clusters.map((cluster, i) => {
              const r = Math.max(6, 4 + Math.sqrt(cluster.events.length) * 2.5);
              return (
                <Marker key={cluster.city} coordinates={[cluster.lng, cluster.lat]}>
                  <circle r={r + 4} fill="var(--color-brand-500)" opacity={0.08} />
                  <motion.circle
                    r={r}
                    fill="url(#pin-fill-m)"
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={1.5}
                    filter="url(#glow-m)"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 250, damping: 18 }}
                  />
                  {cluster.events.length > 1 && (
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fill="white"
                      fontSize={8}
                      fontWeight={800}
                      style={{ pointerEvents: "none" }}
                    >
                      {cluster.events.length}
                    </text>
                  )}
                </Marker>
              );
            })}
          </ComposableMap>
        </div>

        {/* Mobile city chips */}
        <div className="relative flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide border-t border-slate-200/60 dark:border-white/5 bg-white/50 dark:bg-white/[0.02]">
          {clusters.map((c) => (
            <button
              key={c.city}
              onClick={() => onCitySelect(selectedCity === c.city ? null : c.city)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                selectedCity === c.city
                  ? "bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-500/25"
                  : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-brand-400"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${selectedCity === c.city ? "bg-white" : "bg-brand-500"}`} />
              {c.city}
              <span className="font-bold opacity-60">{c.events.length}</span>
            </button>
          ))}
          <button
            onClick={() => onCitySelect(selectedCity === "virtual" ? null : "virtual")}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
              selectedCity === "virtual"
                ? "bg-slate-700 text-white border-slate-600 shadow-md"
                : "bg-white dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-400"
            }`}
          >
            <Wifi className="w-3 h-3" />
            Virtual
            <span className="font-bold opacity-60">{virtualCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
