"use client";

import { motion } from "framer-motion";

interface CredibilityStat {
  value: string;
  label: string;
}

interface CredibilityBarProps {
  stats: CredibilityStat[];
}

const domains = [
  "Azure Architecture",
  "AI Workloads",
  "App Modernization",
  "Landing Zones",
  "Platform Engineering",
];

export default function CredibilityBar({ stats }: CredibilityBarProps) {
  return (
    <section
      aria-label="Credentials summary"
      className="border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-12"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Domain tags */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-2 justify-center"
          aria-label="Areas of expertise"
        >
          {domains.map((domain) => (
            <span
              key={domain}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              {domain}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
