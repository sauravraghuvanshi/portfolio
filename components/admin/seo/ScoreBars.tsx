"use client";

import { motion } from "framer-motion";

export function ScoreBars({
  data,
}: {
  data: { name: string; value: number; color: string }[];
}) {
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <motion.div
          key={d.name}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
        >
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-slate-300">{d.name}</span>
            <span className="font-mono font-semibold text-white">
              {Math.round(d.value)}
            </span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-slate-800/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, d.value))}%` }}
              transition={{
                delay: i * 0.05 + 0.15,
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: d.color }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
