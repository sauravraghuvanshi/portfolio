import { getProfile, getFeaturedCaseStudies, getFeaturedProjects, getEvents, getTalks, getFeaturedBlogPosts, getCertifications } from "@/lib/content";
import Hero from "@/components/sections/Hero";
import CredibilityBar from "@/components/sections/CredibilityBar";
import About from "@/components/sections/About";
import Skills from "@/components/sections/Skills";
import FeaturedCaseStudies from "@/components/sections/FeaturedCaseStudies";
import FeaturedBlogPosts from "@/components/sections/FeaturedBlogPosts";
import ProjectsGrid from "@/components/sections/ProjectsGrid";
import Speaking from "@/components/sections/Speaking";
import FeaturedTalks from "@/components/sections/FeaturedTalks";
import Certifications from "@/components/sections/Certifications";
import NewsletterSignup from "@/components/sections/NewsletterSignup";
import Contact from "@/components/sections/Contact";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
  description:
    "Digital Cloud Solution Architect at Microsoft helping high-growth startups and unicorns build AI-powered, cloud-native platforms at scale. Azure · Generative AI · Agentic AI.",
};

interface ExperienceEntry {
  startDate?: string | null;
}

function computeYearsExperience(experience: ExperienceEntry[]): number {
  const starts = experience
    .map((e) => e.startDate)
    .filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}/.test(d))
    .map((d) => new Date(`${d}-01T00:00:00Z`).getTime())
    .filter((t) => Number.isFinite(t));
  if (starts.length === 0) return 4;
  const earliest = Math.min(...starts);
  const years = (Date.now() - earliest) / (365.25 * 24 * 3600 * 1000);
  return Math.max(1, Math.floor(years));
}

export default function HomePage() {
  const profile = getProfile();
  const caseStudies = getFeaturedCaseStudies();
  const projects = getFeaturedProjects();
  const allEvents = getEvents();
  const talks = getTalks().filter((t) => t.featured);
  const blogPosts = getFeaturedBlogPosts();
  const certifications = getCertifications();
  const speakingEvents = allEvents.filter((e) => e.featured);

  const yearsExperience = computeYearsExperience(profile.experience ?? []);
  const certCount = certifications.length;
  const certIssuers = Array.from(
    new Set(certifications.map((c) => c.issuer).filter(Boolean))
  ).slice(0, 3);

  return (
    <>
      <Hero headshot={profile.headshot} />
      <CredibilityBar stats={profile.credibilityStats} />
      <About
        summary={profile.summary}
        aboutLong={profile.aboutLong}
        whatImKnownFor={profile.whatImKnownFor}
        headshot={profile.headshot}
        yearsExperience={yearsExperience}
        certCount={certCount}
        certIssuers={certIssuers}
      />
      <Skills skills={profile.skills} />
      <FeaturedCaseStudies caseStudies={caseStudies} />
      <ProjectsGrid projects={projects} limit={6} />
      <FeaturedTalks talks={talks} />
      <FeaturedBlogPosts posts={blogPosts} />
      <Speaking events={speakingEvents} />
      <Certifications certifications={certifications} />
      <NewsletterSignup />
      <Contact
        email={profile.email}
        availability={profile.availability}
        social={profile.social}
      />
    </>
  );
}
