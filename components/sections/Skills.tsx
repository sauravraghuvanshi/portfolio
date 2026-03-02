"use client";

import { motion } from "framer-motion";
import { Cloud, Layout, GitBranch, Shield, Cpu, Server } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  cloud: Cloud,
  layout: Layout,
  "git-branch": GitBranch,
  shield: Shield,
  cpu: Cpu,
  server: Server,
};

interface SkillGroup {
  icon: string;
  items: string[];
}

interface SkillsProps {
  skills: Record<string, SkillGroup>;
}

const badgeColors: Record<string, "blue" | "green" | "purple" | "orange" | "red" | "default"> = {
  "Cloud Platforms": "blue",
  "Architecture & Design": "blue",
  "DevOps & IaC": "green",
  "Security & Compliance": "red",
  "Data & AI": "purple",
  "Platform Engineering": "orange",
};

export default function Skills({ skills }: SkillsProps) {
  const entries = Object.entries(skills);

  return (
    <section id="skills" aria-labelledby="skills-heading" className="py-24 section-padding bg-slate-50 dark:bg-slate-900/30">
      <div className="section-container">
        <SectionHeader
          eyebrow="Expertise"
          title="Technical Skills"
          description="Deep hands-on experience across the Azure ecosystem, from infrastructure and security to data platforms and AI."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map(([groupName, group], i) => {
            const IconComponent = iconMap[group.icon] || Cloud;
            const color = badgeColors[groupName] || "default";

            return (
              <motion.article
                key={groupName}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-300 group"
                aria-label={`${groupName} skills`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl ${
                    color === "blue" ? "bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400" :
                    color === "green" ? "bg-accent-50 dark:bg-accent-950/50 text-accent-600 dark:text-accent-400" :
                    color === "purple" ? "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400" :
                    color === "orange" ? "bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400" :
                    color === "red" ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}>
                    <IconComponent className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{groupName}</h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <Badge key={skill} variant={color}>{skill}</Badge>
                  ))}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
