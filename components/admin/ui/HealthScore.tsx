"use client";

import { motion } from "framer-motion";

interface HealthScoreProps {
  score: number; // 0-100
  label?: string;
  size?: number;
}

/**
 * Animated radial health gauge. Color encodes severity:
 *  - green ≥ 80, amber ≥ 60, red < 60
 */
export function HealthScore({ score, label = "Health", size = 160 }: HealthScoreProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  const color =
    clamped >= 80 ? "#22c55e" : clamped >= 60 ? "#f59e0b" : "#ef4444";
  const colorBg =
    clamped >= 80 ? "#22c55e22" : clamped >= 60 ? "#f59e0b22" : "#ef444422";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(30 41 59)"
          strokeWidth="10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill={colorBg}
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="text-3xl font-bold tabular-nums text-white"
        >
          {clamped}
        </motion.span>
        <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}
