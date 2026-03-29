export type AIContentType = "blog" | "case-study" | "project" | "talk" | "event" | "social";

export interface ContentTypeConfig {
  key: AIContentType;
  label: string;
  description: string;
  icon: string; // lucide icon name
  requiredQuestions: string[];
  optionalQuestions: string[];
  saveable: boolean; // false for social (clipboard-only)
  saveEndpoint?: string; // admin API route
}

export interface GroundingResult {
  title: string;
  url: string;
  snippet: string;
}

export interface AIWriterPayload {
  contentType: AIContentType;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  tech: string[];
  timeline?: string;
  role?: string;
  impact: string[];
  cta?: string;
  assets: string[];
  sources: string[];
  verificationNotes: string[];
}
