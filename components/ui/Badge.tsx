import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "blue" | "green" | "purple" | "orange" | "red";
  className?: string;
}

const variantClasses = {
  default: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  blue: "bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300",
  green: "bg-accent-100 dark:bg-accent-950/60 text-accent-700 dark:text-accent-300",
  purple: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300",
  orange: "bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300",
  red: "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
