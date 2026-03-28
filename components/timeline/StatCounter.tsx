"use client";

import { useEffect, useRef } from "react";
import {
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "framer-motion";

/** Parse "30K+" → { num: 30, suffix: "K+" } or "700+" → { num: 700, suffix: "+" } */
function parseStatValue(value: string): { num: number; suffix: string } {
  const match = value.match(/^(\d+)(.*)/);
  if (!match) return { num: 0, suffix: value };
  return { num: parseInt(match[1], 10), suffix: match[2] };
}

export function StatCounter({ value, label }: { value: string; label: string }) {
  const { num, suffix } = parseStatValue(value);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const prefersReducedMotion = useReducedMotion();

  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    stiffness: 60,
    damping: 20,
    duration: 1.5,
  });

  useEffect(() => {
    if (isInView) {
      const timeout = setTimeout(() => motionVal.set(num), 100);
      return () => clearTimeout(timeout);
    }
  }, [isInView, num, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest) + suffix;
      }
    });
    return unsubscribe;
  }, [springVal, suffix]);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
      <p className="text-xl font-bold gradient-text">
        {prefersReducedMotion ? (
          <span>{value}</span>
        ) : (
          <span ref={ref}>0{suffix}</span>
        )}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
