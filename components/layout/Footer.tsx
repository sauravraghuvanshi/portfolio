"use client";

import Link from "next/link";
import { useState } from "react";
import { Github, Linkedin, Mail, Twitter, ExternalLink, ArrowRight } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  Navigate: [
    { label: "About", href: "/#about" },
    { label: "Skills", href: "/#skills" },
    { label: "Case Studies", href: "/#case-studies" },
    { label: "Blog", href: "/blog" },
    { label: "Projects", href: "/projects" },
    { label: "Resume", href: "/resume" },
  ],
  Connect: [
    { label: "LinkedIn", href: "https://linkedin.com/in/sauravraghuvanshi/", external: true },
    { label: "GitHub", href: "https://github.com/sauravraghuvanshi", external: true },
    { label: "Email", href: "mailto:sauravraghuvanshi24@gmail.com" },
    { label: "Book a Call", href: "https://outlook.office.com/bookwithme/user/7724061ce7fa4a87acfd23b2dbaf800a@microsoft.com/meetingtype/ojiCbqKOdUCmNTWtPZFSnQ2?anonymous&ismsaljsauthenabled&ep=mlink", external: true },
  ],
};

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com/in/sauravraghuvanshi/", icon: Linkedin },
  { label: "GitHub", href: "https://github.com/sauravraghuvanshi", icon: Github },
  { label: "Twitter", href: "https://x.com/Saurav_Raghu", icon: Twitter },
  { label: "Email", href: "mailto:sauravraghuvanshi24@gmail.com", icon: Mail },
];

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubState("loading");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSubState(res.ok ? "done" : "error");
    } catch {
      setSubState("error");
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 mt-24" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section */}
        <div className="py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
                SR
              </div>
              <div>
                <p className="font-semibold text-white">Saurav Raghuvanshi</p>
                <p className="text-xs text-slate-500">Digital Cloud Solution Architect · Microsoft</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-sm mb-6">
              Microsoft Digital Cloud Solution Architect helping high-growth startups and unicorns build AI-powered, cloud-native platforms on Azure. Available for speaking engagements, collaborations, and consulting.
            </p>
            <div className="flex items-center gap-2">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Compact newsletter signup */}
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-white">Cloud &amp; AI Weekly</p>
              {subState === "done" ? (
                <p className="text-xs text-accent-400">Subscribed! See you Saturday.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={subState === "loading"}
                    required
                    aria-label="Email for newsletter"
                    className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none disabled:opacity-60"
                  />
                  <button
                    type="submit"
                    disabled={subState === "loading"}
                    aria-label="Subscribe"
                    className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                  >
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </form>
              )}
              {subState === "error" && <p className="mt-1 text-xs text-red-400">Failed. Try again.</p>}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-white mb-4">{group}</h3>
              <ul className="space-y-3" role="list">
                {links.map(({ label, href, external }) => (
                  <li key={label}>
                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm flex items-center gap-1 hover:text-white transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                      >
                        {label}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    ) : (
                      <Link
                        href={href}
                        className="text-sm hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                      >
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {year} Saurav Raghuvanshi. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-accent-500 animate-pulse" aria-hidden="true" />
              Open to speaking &amp; collaborations
            </span>
            <span className="text-slate-600">·</span>
            <span>Bengaluru, India (IST)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
