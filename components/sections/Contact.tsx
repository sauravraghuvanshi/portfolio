"use client";

import { motion } from "framer-motion";
import { Mail, Calendar, Linkedin, Clock, Send } from "lucide-react";
import { useState } from "react";

interface ContactProps {
  email: string;
  availability: string;
  social: {
    linkedin: string;
    calendly: string;
  };
}

export default function Contact({ email, availability, social }: ContactProps) {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(formState.subject || "Portfolio Inquiry")}&body=${encodeURIComponent(
      `Hi Alex,\n\nMy name is ${formState.name}.\n\n${formState.message}\n\nBest,\n${formState.name}`
    )}`;
    window.location.href = mailtoUrl;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <section id="contact" aria-labelledby="contact-heading" className="py-24 section-padding">
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: info */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-4">
              Contact
            </p>
            <h2 id="contact-heading" className="heading-lg text-slate-900 dark:text-white mb-4">
              Let&apos;s Build Something{" "}
              <span className="gradient-text">Remarkable</span>
            </h2>
            <p className="body-lg mb-8">
              Whether you have a cloud architecture challenge, want to discuss a specific project, or are exploring a full-time opportunity — I&apos;d love to hear from you.
            </p>

            <div className="space-y-4 mb-8">
              <a
                href={`mailto:${email}`}
                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label={`Send email to ${email}`}
              >
                <div className="p-2.5 bg-brand-50 dark:bg-brand-950/50 rounded-lg text-brand-600 dark:text-brand-400">
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wide">Email</p>
                  <p className="font-medium text-slate-900 dark:text-white text-sm group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{email}</p>
                </div>
              </a>

              <a
                href={social.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Book a 30-minute call"
              >
                <div className="p-2.5 bg-accent-50 dark:bg-accent-950/50 rounded-lg text-accent-600 dark:text-accent-400">
                  <Calendar className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wide">Book a Call</p>
                  <p className="font-medium text-slate-900 dark:text-white text-sm group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">30-min intro call · Outlook</p>
                </div>
              </a>

              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-brand-300 dark:hover:border-brand-600 hover:shadow-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Connect on LinkedIn"
              >
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <Linkedin className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 uppercase tracking-wide">LinkedIn</p>
                  <p className="font-medium text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Connect professionally</p>
                </div>
              </a>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
              <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>{availability}</span>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
          >
            <form
              onSubmit={handleSubmit}
              aria-label="Contact form"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-5"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white mb-6">Send a Message</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Your Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    placeholder="jane@company.com"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject
                </label>
                <input
                  id="contact-subject"
                  type="text"
                  value={formState.subject}
                  onChange={(e) => setFormState((s) => ({ ...s, subject: e.target.value }))}
                  placeholder="Azure Architecture Consultation"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={formState.message}
                  onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                  placeholder="Tell me about your project or opportunity..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                {submitted ? "Opening email client..." : "Send Message"}
              </button>

              <p className="text-xs text-center text-slate-400 dark:text-slate-600">
                This will open your email client. You can also email directly at {email}
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
