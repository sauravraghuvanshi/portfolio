import type { AIContentType, ContentTypeConfig } from "@/types/ai-writer";

export const CONTENT_TYPES: Record<AIContentType, ContentTypeConfig> = {
  blog: {
    key: "blog",
    label: "Blog Post",
    description: "Write blog posts and technical articles",
    icon: "FileText",
    requiredQuestions: [
      "Topic + target audience",
      "Goal (teach / opinion / how-to / architecture guidance)",
      "Key points to cover (bullets)",
      "Technologies involved (Azure services)",
      "Desired length (short/medium/long)",
    ],
    optionalQuestions: [
      "Any customer story (optional, anonymised)",
      "Call-to-action (what reader should do next)",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/blog",
  },
  "case-study": {
    key: "case-study",
    label: "Case Study",
    description: "Document customer solutions and architecture",
    icon: "BookOpen",
    requiredQuestions: [
      "Title (working)",
      "Customer / Scenario (can anonymise)",
      "Problem statement (pain + constraints)",
      "My role (what I owned)",
      "Azure/Microsoft services used (list)",
      "Solution overview (high level)",
      "Architecture details (components + data flow)",
      "Security/Compliance considerations (if any)",
      "Results/Impact (numbers if available)",
      "Lessons learned",
    ],
    optionalQuestions: [
      "Timeline",
      "Cost optimisation details",
      "HA/DR approach",
      "Diagram notes (if you have one)",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/case-studies",
  },
  project: {
    key: "project",
    label: "Project",
    description: "Showcase portfolio projects",
    icon: "FolderKanban",
    requiredQuestions: [
      "Project name",
      "What it does (1–2 lines)",
      "My role + contributions",
      "Tech stack (Azure services, languages, tools)",
      "Key features",
      "Challenges + how I solved them",
      "Outcomes (impact, adoption, efficiency)",
    ],
    optionalQuestions: [
      "Links (GitHub/demo/blog)",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/projects",
  },
  talk: {
    key: "talk",
    label: "Talk",
    description: "Create talk abstracts and agendas",
    icon: "Video",
    requiredQuestions: [
      "Talk title",
      "Event/community name",
      "Audience level (Beginner/Intermediate/Advanced)",
      "Abstract (what attendees learn)",
      "Agenda (3–6 bullets)",
      "Demos/labs (yes/no + what)",
    ],
    optionalQuestions: [
      "Outcomes (feedback, attendance, links)",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/talks",
  },
  event: {
    key: "event",
    label: "Event",
    description: "Write event descriptions and summaries",
    icon: "Calendar",
    requiredQuestions: [
      "Event name",
      "Type (workshop/hackathon/meetup/webinar)",
      "Date/location (or online)",
      "My role (speaker/organiser)",
      "Key theme",
      "Agenda/session titles",
    ],
    optionalQuestions: [
      "Impact metrics (attendance, reach) if known",
      "Photos/album link",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/events",
  },
  social: {
    key: "social",
    label: "Social Post",
    description: "Draft LinkedIn, X, and social media posts",
    icon: "Share2",
    requiredQuestions: [
      "Platform (LinkedIn/X/etc.)",
      "Post intent (announce/share lesson/celebrate/educate)",
      "Key message",
      "Tone (professional/enthusiastic/informative)",
      "Max length (e.g., 300/600/1300 chars)",
    ],
    optionalQuestions: [
      "Any link to include",
    ],
    saveable: false,
  },
  adr: {
    key: "adr",
    label: "Architecture Decision",
    description: "Document architecture decisions with WAF pillars and real trade-offs",
    icon: "GitBranch",
    requiredQuestions: [
      "ADR number (e.g., 13)",
      "Short title (what was decided)",
      "Context — what problem or constraint triggered this decision",
      "Options considered (list 2–4)",
      "The decision made",
      "Rationale — why this option over the others",
      "Trade-offs — what you gave up or accepted",
      "Outcome — what actually happened after the decision",
      "WAF pillars affected (reliability / security / cost-optimization / operational-excellence / performance-efficiency)",
    ],
    optionalQuestions: [
      "Tags (e.g., azure, nextjs, auth)",
      "Date (defaults to today)",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/decisions",
  },
  "tech-radar-entry": {
    key: "tech-radar-entry",
    label: "Tech Radar Entry",
    description: "Add a technology opinion to your radar — Adopt, Trial, Assess, or Hold",
    icon: "Crosshair",
    requiredQuestions: [
      "Technology name",
      "Quadrant (languages / platforms / tools / techniques)",
      "Ring (adopt / trial / assess / hold)",
      "Summary — your opinion based on production experience",
      "When to use it",
      "When to avoid it",
    ],
    optionalQuestions: [
      "Moved from (previous ring, if changed)",
      "Tags",
    ],
    saveable: true,
    saveEndpoint: "/api/admin/tech-radar",
  },
};

export function getContentTypeConfig(type: AIContentType): ContentTypeConfig {
  return CONTENT_TYPES[type];
}

export function getAllContentTypes(): ContentTypeConfig[] {
  return Object.values(CONTENT_TYPES);
}
