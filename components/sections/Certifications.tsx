"use client";

import { motion } from "framer-motion";
import { ExternalLink, Award } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface Certification {
  name: string;
  code: string;
  issuer: string;
  year: number;
  verifyUrl: string;
  color: string;
}

interface CertificationsProps {
  certifications: Certification[];
}

const colorMap: Record<string, string> = {
  blue: "from-brand-600 to-brand-800",
  purple: "from-purple-600 to-purple-800",
  green: "from-accent-600 to-accent-800",
};

export default function Certifications({ certifications }: CertificationsProps) {
  return (
    <section id="certifications" aria-labelledby="certs-heading" className="py-24 section-padding">
      <div className="section-container">
        <SectionHeader
          eyebrow="Credentials"
          title="Certifications"
          description="Validated expertise across cloud architecture, AI, DevOps, and security."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.code}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Verify ${cert.name} certification`}
                className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[cert.color] || colorMap.blue} flex items-center justify-center shadow-sm`}>
                  <Award className="w-6 h-6 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm leading-tight">{cert.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">{cert.issuer} · {cert.year}</p>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" aria-hidden="true" />
                  </div>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                    {cert.code}
                  </span>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
