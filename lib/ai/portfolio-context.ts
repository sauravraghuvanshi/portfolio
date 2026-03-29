import {
  getAllBlogPosts,
  getProjects,
  getEvents,
  getTalks,
  getAllCaseStudies,
  getProfile,
} from "@/lib/content";
import type { AIContentType } from "@/types/ai-writer";

/**
 * Reads existing portfolio content to provide style/fact context to the AI.
 * Returns a concise summary string (stays under ~1000 tokens).
 */
export async function getPortfolioContext(contentType: AIContentType): Promise<string> {
  const profile = getProfile();
  const sections: string[] = [];

  // Author basics
  sections.push(
    `Author: ${profile.name}, ${profile.title} at ${profile.company}.`,
    `Location: ${profile.location}. Tagline: "${profile.tagline}".`,
  );

  if (profile.whatImKnownFor?.length) {
    sections.push(`Known for: ${profile.whatImKnownFor.join(", ")}.`);
  }

  // Content-type-specific context
  switch (contentType) {
    case "blog": {
      const posts = getAllBlogPosts().slice(0, 5);
      if (posts.length) {
        sections.push(
          `Recent blogs: ${posts.map((p) => `"${p.title}" (${p.category.join(", ")})`).join("; ")}.`
        );
      }
      break;
    }
    case "case-study": {
      const studies = getAllCaseStudies().slice(0, 5);
      if (studies.length) {
        sections.push(
          `Recent case studies: ${studies.map((s) => `"${s.title}" — ${s.client}`).join("; ")}.`
        );
      }
      break;
    }
    case "project": {
      const projects = getProjects().slice(0, 5);
      if (projects.length) {
        sections.push(
          `Recent projects: ${projects.map((p) => `"${p.title}" (${p.techStack.join(", ")})`).join("; ")}.`
        );
      }
      break;
    }
    case "talk": {
      const talks = getTalks().slice(0, 5);
      if (talks.length) {
        sections.push(
          `Recent talks: ${talks.map((t) => `"${t.title}" — ${t.topic}`).join("; ")}.`
        );
      }
      break;
    }
    case "event": {
      const events = getEvents().slice(0, 5);
      if (events.length) {
        sections.push(
          `Recent events: ${events.map((e) => `"${e.title}" (${e.format}, ${e.year})`).join("; ")}.`
        );
      }
      break;
    }
    case "social": {
      // Use blog titles + recent events for social post context
      const posts = getAllBlogPosts().slice(0, 3);
      const events = getEvents().slice(0, 3);
      if (posts.length) {
        sections.push(`Recent blogs: ${posts.map((p) => `"${p.title}"`).join(", ")}.`);
      }
      if (events.length) {
        sections.push(`Recent events: ${events.map((e) => `"${e.title}"`).join(", ")}.`);
      }
      break;
    }
  }

  // Skills summary
  if (profile.skills) {
    const skillNames = Object.keys(profile.skills);
    sections.push(`Skill categories: ${skillNames.join(", ")}.`);
  }

  return sections.join("\n");
}

/**
 * Reads all existing content of a given type (for deduplication/consistency checks).
 */
export function getExistingTitles(contentType: AIContentType): string[] {
  switch (contentType) {
    case "blog":
      return getAllBlogPosts().map((p) => p.title);
    case "case-study":
      return getAllCaseStudies().map((s) => s.title);
    case "project":
      return getProjects().map((p) => p.title);
    case "talk":
      return getTalks().map((t) => t.title);
    case "event":
      return getEvents().map((e) => e.title);
    default:
      return [];
  }
}
