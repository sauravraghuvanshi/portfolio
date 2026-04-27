"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, type ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MotionCard } from "./MotionCard";

interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  icon: ReactNode;
  /** Tailwind text color for the icon (e.g. "text-brand-400") */
  accent?: string;
  /** Sparkline points (0-100 range), optional */
  sparkline?: number[];
  delay?: number;
  suffix?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(0);
  const display = useTransform(mv, (latest) => Math.round(latest).toLocaleString());

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.0, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [value, mv]);

  return <motion.span>{display}</motion.span>;
}

function Sparkline({ points }: { points: number[] }) {
  if (!points || points.length < 2) return null;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const step = w / (points.length - 1);
  const pathD = points
    .map((p, i) => {
      const x = i * step;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={`${pathD} L${w},${h} L0,${h} Z`}
        fill="url(#spark-fill)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      />
      <motion.path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.0, ease: "easeOut" }}
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  icon,
  accent = "text-brand-400",
  sparkline,
  delay = 0,
  suffix,
}: StatCardProps) {
  const trend =
    delta === undefined ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : Minus;
  const trendColor =
    trend === "up"
      ? "text-accent-400 bg-accent-500/10"
      : trend === "down"
      ? "text-rose-400 bg-rose-500/10"
      : "text-slate-400 bg-slate-500/10";

  return (
    <MotionCard delay={delay} hoverable className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/60 [&_svg]:h-4 [&_svg]:w-4", accent)}>
            {icon}
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
        </div>
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold",
              trendColor
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {delta > 0 ? "+" : ""}
            {delta}
            {deltaLabel ? ` ${deltaLabel}` : ""}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <p className="text-3xl font-bold tabular-nums text-white">
          <AnimatedNumber value={value} />
          {suffix && <span className="ml-0.5 text-lg text-slate-400">{suffix}</span>}
        </p>
      </div>
      {sparkline && sparkline.length > 1 && (
        <div className={cn("mt-3", accent)}>
          <Sparkline points={sparkline} />
        </div>
      )}
    </MotionCard>
  );
}
