"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import ImageWithShimmer from "@/components/ui/ImageWithShimmer";

interface AboutProps {
  summary: string;
  aboutLong: string;
  whatImKnownFor: string[];
  headshot?: string;
  yearsExperience: number;
  certCount: number;
  certIssuers?: string[];
}

export default function About({ summary, aboutLong, whatImKnownFor, headshot, yearsExperience, certCount, certIssuers }: AboutProps) {
  const issuersLabel = certIssuers && certIssuers.length > 0 ? ` (${certIssuers.join(" · ")})` : "";
  const extraParagraphs = aboutLong.split("\n\n").filter(Boolean);

  return (
    <section id="about" aria-labelledby="about-heading" className="py-24 section-padding">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: text */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55 }}
          >
            {headshot && (
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-8">
                <ImageWithShimmer
                  src={headshot.replace(/(\.[a-z]+)$/i, "-light.png")}
                  alt="Saurav Raghuvanshi"
                  fill
                  className="object-contain drop-shadow-xl"
                  sizes="(max-width: 640px) 128px, 160px"
                />
              </div>
            )}
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-4">
              About
            </p>
            <h2 id="about-heading" className="heading-lg text-slate-900 dark:text-white mb-6">
              Cloud Architect &amp;{" "}
              <span className="gradient-text">AI Enabler at Microsoft</span>
            </h2>
            <p className="body-lg mb-6">{summary}</p>
            {extraParagraphs.map((para, i) => (
              <p key={i} className="body-md mb-5">{para}</p>
            ))}
            <p className="body-md font-medium text-brand-600 dark:text-brand-400 mt-2">
              Let&apos;s connect if you&apos;re building for scale and want to explore how Cloud and AI can transform your business.
            </p>
          </motion.div>

          {/* Right: what I'm known for */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              What I&apos;m known for
            </h3>
            <ul className="space-y-4" role="list">
              {whatImKnownFor.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex gap-3 text-sm text-slate-700 dark:text-slate-300"
                >
                  <CheckCircle2 className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>

            {/* Quick facts */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide mb-1">Location</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">Bengaluru, India</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide mb-1">Primary Cloud</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">Microsoft Azure</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide mb-1">Experience</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{yearsExperience}+ Years</p>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-500 text-xs uppercase tracking-wide mb-1">Certifications</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{certCount}{issuersLabel}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
