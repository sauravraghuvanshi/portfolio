"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Download, Mail, Github, Linkedin, Twitter, Calendar } from "lucide-react";

const ROTATING_PHRASES = [
  "Harness the Power of Cloud & AI",
  "Build Scalable Cloud-Native Platforms",
  "Accelerate with Agentic AI",
  "Ship Faster with DevOps & Azure",
];

const ROTATE_INTERVAL = 3000;

const socialLinks = [
  { icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/in/sauravraghuvanshi/" },
  { icon: Github, label: "GitHub", href: "https://github.com/sauravraghuvanshi" },
  { icon: Twitter, label: "Twitter/X", href: "https://x.com/Saurav_Raghu" },
  { icon: Mail, label: "Email", href: "mailto:sauravraghuvanshi24@gmail.com" },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55 } },
};

export default function Hero() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % ROTATING_PHRASES.length);
    }, ROTATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Introduction"
      className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-mesh-light dark:bg-mesh-dark opacity-60" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-400/10 dark:bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-400/10 dark:bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Status chip */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent-50 dark:bg-accent-950/40 border border-accent-200 dark:border-accent-800/50 rounded-full text-sm text-accent-700 dark:text-accent-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" aria-hidden="true" />
              Open to speaking &amp; collaborations
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={itemVariants} className="heading-xl text-slate-900 dark:text-white mb-6">
            Helping Startups and Unicorns{" "}
            <br />
            <span className="relative grid overflow-y-clip">
              {/* All phrases in same grid cell — container height = tallest phrase */}
              {ROTATING_PHRASES.map((phrase) => (
                <span key={phrase} className="invisible [grid-area:1/1] whitespace-nowrap" aria-hidden="true">{phrase}</span>
              ))}
              <AnimatePresence mode="wait">
                <motion.span
                  key={phraseIndex}
                  className="gradient-text [grid-area:1/1] whitespace-nowrap"
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {ROTATING_PHRASES[phraseIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p variants={itemVariants} className="text-xl sm:text-2xl text-slate-700 dark:text-slate-200 font-semibold mb-3">
            Saurav Raghuvanshi · Digital Cloud Solution Architect @ Microsoft
          </motion.p>

          {/* Value prop */}
          <motion.p variants={itemVariants} className="body-lg max-w-2xl mb-10 text-slate-600 dark:text-slate-300">
            I help high-growth startups and unicorns{" "}
            <strong className="text-slate-900 dark:text-white font-semibold">design secure, scalable, AI-powered platforms on Azure</strong>
            {" "}— from cloud-native architecture and Generative AI to DevOps and cost optimization.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-10">
            <Link
              href="/#case-studies"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 group"
            >
              View Case Studies
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </Link>

            <a
              href="/resume"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download Resume
            </a>

            <a
              href="https://outlook.office.com/bookwithme/user/7724061ce7fa4a87acfd23b2dbaf800a@microsoft.com/meetingtype/ojiCbqKOdUCmNTWtPZFSnQ2?anonymous&ismsaljsauthenabled&ep=mlink"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-accent-400 dark:hover:border-accent-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
            >
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Book a Call
            </a>
          </motion.div>

          {/* Social row */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <span className="text-sm text-slate-500 dark:text-slate-500">Connect:</span>
            {socialLinks.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={label}
                className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          aria-hidden="true"
        >
          <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-[1px] h-8 bg-gradient-to-b from-slate-400 to-transparent dark:from-slate-600"
          />
        </motion.div>
      </div>
    </section>
  );
}
