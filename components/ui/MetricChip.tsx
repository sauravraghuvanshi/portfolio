"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricChipProps {
  value: string;
  label: string;
  className?: string;
  index?: number;
}

export function MetricChip({ value, label, className, index = 0 }: MetricChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center shadow-sm",
        className
      )}
    >
      <p className="text-2xl sm:text-3xl font-bold gradient-text mb-1">{value}</p>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </motion.div>
  );
}
