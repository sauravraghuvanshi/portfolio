"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  as?: "div" | "article" | "section";
}

export function Card({ children, className, hover = false, glass = false, as: Tag = "div" }: CardProps) {
  const baseClasses = cn(
    "rounded-2xl border transition-all duration-300",
    glass
      ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-white/20 dark:border-slate-700/50 shadow-glass dark:shadow-glass-dark"
      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm",
    hover && "hover:border-brand-300 dark:hover:border-brand-700 hover:-translate-y-1 hover:shadow-md dark:hover:shadow-lg cursor-pointer",
    className
  );

  return <Tag className={baseClasses}>{children}</Tag>;
}

interface AnimatedCardProps extends CardProps {
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
}

export function AnimatedCard({ children, className, hover, glass, delay = 0, direction = "up", as: Tag = "div" }: AnimatedCardProps) {
  const initial =
    direction === "up" ? { opacity: 0, y: 32 } :
    direction === "left" ? { opacity: 0, x: -32 } :
    direction === "right" ? { opacity: 0, x: 32 } :
    { opacity: 0 };

  return (
    <motion.div
      initial={initial}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      <Card className={className} hover={hover} glass={glass} as={Tag}>
        {children}
      </Card>
    </motion.div>
  );
}
