"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface MotionCardProps extends HTMLMotionProps<"div"> {
  delay?: number;
  hoverable?: boolean;
}

/**
 * Reusable animated card for the admin shell.
 * Uses a subtle fade + lift entrance and an optional hover translate.
 * Visual: dark glass surface with a hairline border and gradient on hover.
 */
export function MotionCard({
  className,
  delay = 0,
  hoverable = false,
  children,
  ...rest
}: MotionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={hoverable ? { y: -2 } : undefined}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/60 to-slate-950/60 backdrop-blur-sm",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_8px_24px_rgba(0,0,0,0.25)]",
        hoverable && "transition-colors hover:border-slate-700",
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
