"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ShieldCheck, X } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CopyIdPill } from "@/components/sections/CopyIdPill";
import { cn } from "@/lib/utils";
import type { Certification } from "@/lib/content";

// ---------------------------------------------------------------------------
// Issuer theming (full-string Tailwind classes — never interpolated)
// ---------------------------------------------------------------------------

type IssuerKey = "microsoft" | "aws" | "udacity";

interface IssuerTheme {
  key: IssuerKey;
  label: string;
  short: string;
  matches: (issuer: string) => boolean;
  gradient: string;
  border: string;
  ring: string;
  glow: string;
  haloBg: string;
  shieldGradient: string;
  shieldFromHex: string;
  shieldToHex: string;
  accentText: string;
  chipActive: string;
  chipBadgeBg: string;
  verifyBtn: string;
}

const ISSUER_KEYS: IssuerKey[] = ["microsoft", "aws", "udacity"];

const ISSUERS: Record<IssuerKey, IssuerTheme> = {
  microsoft: {
    key: "microsoft",
    label: "Microsoft",
    short: "Microsoft Certified",
    matches: (i) => /microsoft/i.test(i),
    gradient:
      "bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-sky-950/40 dark:via-slate-900 dark:to-blue-950/40",
    border: "border-sky-200/70 dark:border-sky-800/50",
    ring: "ring-sky-500/40 dark:ring-sky-400/40",
    glow: "shadow-sky-500/20 dark:shadow-sky-400/10",
    haloBg: "bg-sky-400/40",
    shieldGradient: "url(#cert-shield-ms)",
    shieldFromHex: "#0ea5e9",
    shieldToHex: "#2563eb",
    accentText: "text-sky-700 dark:text-sky-300",
    chipActive:
      "bg-sky-600 text-white border-sky-600 dark:bg-sky-500 dark:border-sky-500",
    chipBadgeBg: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
    verifyBtn:
      "bg-sky-600 hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400",
  },
  aws: {
    key: "aws",
    label: "AWS",
    short: "AWS Certified",
    matches: (i) => /(amazon|aws)/i.test(i),
    gradient:
      "bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-950/40 dark:via-slate-900 dark:to-amber-950/40",
    border: "border-orange-200/70 dark:border-orange-800/50",
    ring: "ring-orange-500/40 dark:ring-orange-400/40",
    glow: "shadow-orange-500/20 dark:shadow-orange-400/10",
    haloBg: "bg-orange-400/40",
    shieldGradient: "url(#cert-shield-aws)",
    shieldFromHex: "#fb923c",
    shieldToHex: "#ea580c",
    accentText: "text-orange-700 dark:text-orange-300",
    chipActive:
      "bg-orange-600 text-white border-orange-600 dark:bg-orange-500 dark:border-orange-500",
    chipBadgeBg:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
    verifyBtn:
      "bg-orange-600 hover:bg-orange-500 dark:bg-orange-500 dark:hover:bg-orange-400",
  },
  udacity: {
    key: "udacity",
    label: "Udacity",
    short: "Udacity Nanodegree",
    matches: (i) => /udacity/i.test(i),
    gradient:
      "bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/40 dark:via-slate-900 dark:to-fuchsia-950/40",
    border: "border-violet-200/70 dark:border-violet-800/50",
    ring: "ring-violet-500/40 dark:ring-violet-400/40",
    glow: "shadow-violet-500/20 dark:shadow-violet-400/10",
    haloBg: "bg-violet-400/40",
    shieldGradient: "url(#cert-shield-ud)",
    shieldFromHex: "#a78bfa",
    shieldToHex: "#7c3aed",
    accentText: "text-violet-700 dark:text-violet-300",
    chipActive:
      "bg-violet-600 text-white border-violet-600 dark:bg-violet-500 dark:border-violet-500",
    chipBadgeBg:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
    verifyBtn:
      "bg-violet-600 hover:bg-violet-500 dark:bg-violet-500 dark:hover:bg-violet-400",
  },
};

function getIssuerKey(issuer: string): IssuerKey {
  for (const k of ISSUER_KEYS) if (ISSUERS[k].matches(issuer)) return k;
  return "microsoft";
}

function isAwsVerifyLink(url: string): boolean {
  return /aws\.amazon\.com\/verification/i.test(url);
}

// ---------------------------------------------------------------------------
// Shared SVG defs (gradient fills for the credential medallion)
// ---------------------------------------------------------------------------

function ShieldGradientDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="cert-shield-ms" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="cert-shield-aws" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <linearGradient id="cert-shield-ud" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Medallion — designed credential mark used when no badge image exists
// ---------------------------------------------------------------------------

interface MedallionProps {
  theme: IssuerTheme;
  code: string;
  className?: string;
}

function Medallion({ theme, code, className }: MedallionProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("w-full h-full", className)}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="56" fill={theme.shieldGradient} opacity="0.15" />
      <path
        d="M 28 90 L 20 118 L 38 108 L 46 100 Z"
        fill={theme.shieldFromHex}
        opacity="0.9"
      />
      <path
        d="M 92 90 L 100 118 L 82 108 L 74 100 Z"
        fill={theme.shieldToHex}
        opacity="0.9"
      />
      <path
        d="M 60 10 L 100 24 L 100 64 Q 100 88 60 108 Q 20 88 20 64 L 20 24 Z"
        fill={theme.shieldGradient}
        stroke="white"
        strokeWidth="2"
        opacity="0.95"
      />
      <path
        d="M 60 22 L 88 32 L 88 62 Q 88 80 60 96 Q 32 80 32 62 L 32 32 Z"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        opacity="0.55"
      />
      <text
        x="60"
        y="62"
        textAnchor="middle"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fontWeight="700"
        fontSize={code.length > 6 ? 14 : 18}
        fill="white"
        letterSpacing="0.5"
      >
        {code}
      </text>
      <path
        d="M 60 74 L 62 79 L 67 79.5 L 63 83 L 64.5 88 L 60 85.5 L 55.5 88 L 57 83 L 53 79.5 L 58 79 Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Credential tile
// ---------------------------------------------------------------------------

interface TileProps {
  cert: Certification;
  theme: IssuerTheme;
  selected: boolean;
  onOpen: (code: string) => void;
  badgeAvailable: boolean;
}

function CredentialTile({ cert, theme, selected, onOpen, badgeAvailable }: TileProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(cert.code)}
      aria-label={`${cert.name} (${cert.code}) — ${cert.issuer}, ${cert.year}`}
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "group relative text-left w-full",
        "rounded-xl border overflow-hidden",
        "p-3 flex flex-col gap-2",
        "transition-shadow duration-300",
        "shadow-sm hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
        theme.gradient,
        theme.border,
        theme.ring,
        theme.glow,
        selected && "ring-2"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider",
            theme.chipBadgeBg
          )}
        >
          <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
          {theme.label}
        </span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          {cert.year}
        </span>
      </div>

      <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity",
            theme.haloBg
          )}
          aria-hidden="true"
        />
        {badgeAvailable ? (
          <Image
            src={cert.badge}
            alt=""
            width={80}
            height={80}
            className="relative w-full h-full object-contain drop-shadow"
          />
        ) : (
          <div className="relative w-full h-full drop-shadow">
            <Medallion theme={theme} code={cert.code} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 items-center text-center">
        <span
          className={cn(
            "inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded",
            theme.chipBadgeBg
          )}
        >
          {cert.code}
        </span>
        <h3 className="text-[11px] font-semibold text-slate-900 dark:text-white leading-tight line-clamp-2">
          {cert.name}
        </h3>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------

interface DrawerProps {
  cert: Certification | null;
  theme: IssuerTheme | null;
  onClose: () => void;
  badgeAvailable: boolean;
}

function CertDrawer({ cert, theme, onClose, badgeAvailable }: DrawerProps) {
  useEffect(() => {
    if (!cert) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = prev;
    };
  }, [cert, onClose]);

  return (
    <AnimatePresence>
      {cert && theme && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40"
            aria-hidden="true"
          />
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cert-drawer-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(92vw,28rem)] max-h-[85vh] overflow-y-auto rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            <div className={cn("relative p-6 sm:p-8", theme.gradient)}>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close details"
                className="absolute top-3 right-3 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                    theme.chipBadgeBg
                  )}
                >
                  <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                  {theme.short}
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {cert.year}
                </span>
              </div>

              <div className="mx-auto w-32 h-32 mb-5">
                {badgeAvailable ? (
                  <Image
                    src={cert.badge}
                    alt=""
                    width={128}
                    height={128}
                    className="w-full h-full object-contain drop-shadow-lg"
                  />
                ) : (
                  <Medallion theme={theme} code={cert.code} />
                )}
              </div>

              <h3
                id="cert-drawer-title"
                className="text-xl font-bold text-slate-900 dark:text-white mb-1 text-center"
              >
                {cert.name}
              </h3>
              <p className="text-center text-sm text-slate-600 dark:text-slate-300 mb-5">
                <span className="font-mono">{cert.code}</span>
                <span className="mx-1.5 opacity-50">·</span>
                Issued by <span className="font-medium">{cert.issuer}</span>
              </p>

              {cert.credentialId && (
                <div className="flex justify-center mb-5">
                  <CopyIdPill
                    value={cert.credentialId}
                    hintForAws={isAwsVerifyLink(cert.verifyUrl)}
                  />
                </div>
              )}

              {cert.verifyUrl && cert.verifyUrl !== "#" && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Verify ${cert.name} credential`}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors",
                    theme.verifyBtn
                  )}
                >
                  Verify credential
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

type Filter = "all" | IssuerKey;

interface Props {
  certifications: Certification[];
}

export default function Certifications({ certifications }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [verifiedBadges, setVerifiedBadges] = useState<Set<string>>(new Set());

  const decorated = useMemo(() => {
    return certifications.map((c) => {
      const issuerKey = getIssuerKey(c.issuer);
      return { cert: c, issuerKey, theme: ISSUERS[issuerKey] };
    });
  }, [certifications]);

  const counts = useMemo(() => {
    const acc: Record<Filter, number> = {
      all: decorated.length,
      microsoft: 0,
      aws: 0,
      udacity: 0,
    };
    for (const d of decorated) acc[d.issuerKey] += 1;
    return acc;
  }, [decorated]);

  const visible = useMemo(() => {
    const list =
      filter === "all" ? decorated : decorated.filter((d) => d.issuerKey === filter);
    return [...list].sort((a, b) => {
      if (b.cert.year !== a.cert.year) return b.cert.year - a.cert.year;
      return a.issuerKey.localeCompare(b.issuerKey);
    });
  }, [decorated, filter]);

  const groupedForA11y = useMemo(() => {
    const groups: Record<IssuerKey, { cert: Certification; theme: IssuerTheme }[]> = {
      microsoft: [],
      aws: [],
      udacity: [],
    };
    for (const d of visible) groups[d.issuerKey].push({ cert: d.cert, theme: d.theme });
    return groups;
  }, [visible]);

  const selected = useMemo(
    () => decorated.find((d) => d.cert.code === selectedCode) ?? null,
    [decorated, selectedCode]
  );

  const handleOpen = useCallback((code: string) => setSelectedCode(code), []);
  const handleClose = useCallback(() => setSelectedCode(null), []);

  const isBadgeAvailable = useCallback(
    (cert: Certification) => verifiedBadges.has(cert.code),
    [verifiedBadges]
  );

  // Probe each badge once on mount; only confirmed-present badges render <Image>.
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      const next = new Set<string>();
      await Promise.all(
        certifications.map(async (c) => {
          if (!c.badge) return;
          try {
            const res = await fetch(c.badge, { method: "HEAD" });
            if (res.ok) next.add(c.code);
          } catch {
            /* ignore — stays unverified, medallion is rendered */
          }
        })
      );
      if (!cancelled && next.size > 0) setVerifiedBadges(next);
    };
    probe();
    return () => {
      cancelled = true;
    };
  }, [certifications]);

  return (
    <section id="certifications" className="py-24 section-padding bg-slate-50 dark:bg-slate-950">
      <ShieldGradientDefs />
      <div className="section-container">
        <SectionHeader
          eyebrow="Credentials"
          title="Certifications"
          description="Twelve certifications across Microsoft, AWS, and Udacity — multi-cloud architecture, AI, and product. Click any badge to verify."
        />

        {/* Filter chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {(["all", ...ISSUER_KEYS] as Filter[]).map((key) => {
            const isActive = filter === key;
            const label = key === "all" ? "All" : ISSUERS[key as IssuerKey].label;
            const activeClass =
              key === "all"
                ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                : ISSUERS[key as IssuerKey].chipActive;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={isActive}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
                  isActive
                    ? activeClass
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
                )}
              >
                {label}
                <span
                  className={cn(
                    "inline-flex items-center justify-center min-w-[1.5rem] px-1.5 py-0.5 rounded-full text-[10px] font-mono",
                    isActive
                      ? "bg-white/20 text-current"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Badge wall — grid of tiles */}
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        >
          {visible.map((d) => (
            <CredentialTile
              key={d.cert.code}
              cert={d.cert}
              theme={d.theme}
              selected={d.cert.code === selectedCode}
              onOpen={handleOpen}
              badgeAvailable={isBadgeAvailable(d.cert)}
            />
          ))}
        </motion.div>

        {/* Visually-hidden grouped list for screen readers + tests */}
        <div className="sr-only">
          {ISSUER_KEYS.map((key) => {
            const group = groupedForA11y[key];
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <h3>{`${ISSUERS[key].label} (${group.length})`}</h3>
                <ul>
                  {group.map(({ cert }) => (
                    <li key={cert.code}>
                      {cert.name} ({cert.code}) — {cert.year}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      <CertDrawer
        cert={selected?.cert ?? null}
        theme={selected?.theme ?? null}
        onClose={handleClose}
        badgeAvailable={selected ? isBadgeAvailable(selected.cert) : false}
      />
    </section>
  );
}
