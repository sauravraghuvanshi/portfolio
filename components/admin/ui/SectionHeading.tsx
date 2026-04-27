"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  icon,
  title,
  subtitle,
  action,
  className,
}: SectionHeadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("flex items-end justify-between gap-4", className)}
    >
      <div>
        <div className="flex items-center gap-2 text-slate-300 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-brand-400">
          {icon}
          <h2 className="text-lg font-semibold text-white">{title}</h2>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </motion.div>
  );
}
