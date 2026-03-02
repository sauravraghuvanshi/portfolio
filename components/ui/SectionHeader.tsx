"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({ eyebrow, title, description, align = "center", className }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "mb-12 lg:mb-16",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
          {eyebrow}
        </p>
      )}
      <h2 className="heading-lg text-slate-900 dark:text-white mb-4">
        {title}
      </h2>
      {description && (
        <p className={cn("body-lg max-w-2xl", align === "center" && "mx-auto")}>
          {description}
        </p>
      )}
    </motion.div>
  );
}
