import { getProfile, getFeaturedCaseStudies, getProjects, getEvents, getTalks, getFeaturedBlogPosts } from "@/lib/content";
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
import Contact from "@/components/sections/Contact";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
  description:
    "Digital Cloud Solution Architect at Microsoft helping high-growth startups and unicorns build AI-powered, cloud-native platforms at scale. Azure · Generative AI · Agentic AI.",
};

const SPEAKING_SLUGS = [
  "microsoft-ai-tour-bangalore",
  "microsoft-future-ready-technology-summit",
  "azure-developer-day",
  "microsoft-india-town-hall-meet-mlsa-edition",
  "enhancing-cloud-engineering-with-github-copilot",
  "azure-developer-day-in-bengaluru-by-msa-cit-chapter",
  "azure-devops-day",
  "building-your-own-copilot-using-azure-openai",
];

export default function HomePage() {
  const profile = getProfile();
  const caseStudies = getFeaturedCaseStudies();
  const projects = getProjects();
  const allEvents = getEvents();
  const talks = getTalks().filter((t) => t.featured);
  const blogPosts = getFeaturedBlogPosts();
  const speakingEvents = SPEAKING_SLUGS
    .map((slug) => allEvents.find((e) => e.slug === slug))
    .filter((e): e is NonNullable<typeof e> => e != null);

  return (
    <>
      <Hero />
      <CredibilityBar stats={profile.credibilityStats} />
      <About summary={profile.summary} aboutLong={profile.aboutLong} whatImKnownFor={profile.whatImKnownFor} />
      <Skills skills={profile.skills} />
      <FeaturedCaseStudies caseStudies={caseStudies} />
      <ProjectsGrid projects={projects} limit={6} />
      <FeaturedTalks talks={talks} />
      <FeaturedBlogPosts posts={blogPosts} />
      <Speaking events={speakingEvents} />
      <Certifications certifications={profile.certifications} />
      <Contact
        email={profile.email}
        availability={profile.availability}
        social={profile.social}
      />
    </>
  );
}
