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
import Contact from "@/components/sections/Contact";
import type { Metadata } from "next";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Saurav Raghuvanshi — Digital Cloud Solution Architect @ Microsoft",
  description:
    "Digital Cloud Solution Architect at Microsoft helping high-growth startups and unicorns build AI-powered, cloud-native platforms at scale. Azure · Generative AI · Agentic AI.",
};

export default function HomePage() {
  const profile = getProfile();
  const caseStudies = getFeaturedCaseStudies();
  const projects = getFeaturedProjects();
  const allEvents = getEvents();
  const talks = getTalks().filter((t) => t.featured);
  const blogPosts = getFeaturedBlogPosts();
  const certifications = getCertifications();
  const speakingEvents = allEvents.filter((e) => e.featured);

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
      <Certifications certifications={certifications} />
      <Contact
        email={profile.email}
        availability={profile.availability}
        social={profile.social}
      />
    </>
  );
}
