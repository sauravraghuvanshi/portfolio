"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  role: string;
  company: string;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <section id="testimonials" aria-labelledby="testimonials-heading" className="py-24 section-padding bg-slate-50 dark:bg-slate-900/30">
      <div className="section-container">
        <SectionHeader
          eyebrow="Social Proof"
          title="What Clients Say"
          description="Outcomes speak louder than credentials. Here's what engineering leaders say about working together."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm relative flex flex-col"
              aria-label={`Testimonial from ${t.author}`}
            >
              <Quote className="w-8 h-8 text-brand-200 dark:text-brand-800 mb-4 flex-shrink-0" aria-hidden="true" />
              <blockquote className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed flex-1 mb-6">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0" aria-hidden="true">
                  {t.author.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm">{t.author}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">{t.role} · {t.company}</p>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
