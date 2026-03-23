import { getProfile, getCertifications } from "@/lib/content";
import { Download, MapPin, Mail, Linkedin, Github, CheckCircle2, Briefcase, GraduationCap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Resume of Saurav Raghuvanshi, Digital Cloud Solution Architect at Microsoft — Azure, Generative AI, Cloud-Native architecture, 8 certifications.",
};

export default function ResumePage() {
  const profile = getProfile();
  const certifications = getCertifications();

  return (
    <div className="py-16 section-padding">
      <div className="section-container max-w-4xl">
        {/* Header actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h1 className="heading-lg text-slate-900 dark:text-white mb-1">{profile.name}</h1>
            <p className="text-brand-600 dark:text-brand-400 font-medium">{profile.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              aria-label="View resume PDF in browser"
            >
              View PDF
            </a>
            <a
              href="/resume.pdf"
              download="SauravRaghuvanshi-Resume.pdf"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-colors shadow-sm hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              aria-label="Download resume as PDF"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Download PDF
            </a>
          </div>
        </div>

        {/* Contact bar */}
        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-10 pb-8 border-b border-slate-200 dark:border-slate-800">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" aria-hidden="true" />
            {profile.location}
          </span>
          <a href={`mailto:${profile.email}`} className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <Mail className="w-4 h-4" aria-hidden="true" />
            {profile.email}
          </a>
          <a href={profile.social.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <Linkedin className="w-4 h-4" aria-hidden="true" />
            LinkedIn
          </a>
          <a href={profile.social.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
            <Github className="w-4 h-4" aria-hidden="true" />
            GitHub
          </a>
        </div>

        {/* Summary */}
        <section aria-labelledby="resume-summary" className="mb-10">
          <h2 id="resume-summary" className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-brand-100 dark:bg-brand-950 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400" />
            </span>
            Summary
          </h2>
          <p className="body-md">{profile.summary}</p>
        </section>

        {/* Experience */}
        <section aria-labelledby="resume-experience" className="mb-10">
          <h2 id="resume-experience" className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            Experience
          </h2>
          <div className="space-y-8">
            {profile.experience.map(
              (job: { company: string; role: string; period: string; highlights: string[] }, i: number) => (
                <article key={i} className="pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{job.role}</h3>
                  <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">{job.company}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">{job.period}</p>
                  <ul className="space-y-2" role="list">
                    {job.highlights.map((h: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </article>
              )
            )}
          </div>
        </section>

        {/* Certifications */}
        <section aria-labelledby="resume-certs" className="mb-10">
          <h2 id="resume-certs" className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            Certifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {certifications.map(
              (cert) => (
                <div key={cert.code} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm">
                  <span className="font-mono text-xs bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 px-2 py-1 rounded font-medium">{cert.code}</span>
                  <span className="text-slate-700 dark:text-slate-300 flex-1">{cert.name}</span>
                  <span className="text-slate-400 text-xs">{cert.year}</span>
                </div>
              )
            )}
          </div>
        </section>

        {/* Skills summary */}
        <section aria-labelledby="resume-skills">
          <h2 id="resume-skills" className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xs">S</span>
            Core Skills
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(profile.skills).map(([group, data]: [string, unknown]) => {
              const skillData = data as { items: string[] };
              return (
                <div key={group}>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-2">{group}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{skillData.items.join(" · ")}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
