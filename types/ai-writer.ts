export type AIContentType = "blog" | "case-study" | "project" | "talk" | "event" | "social";

export type ImageStatus = "pending" | "generating" | "done" | "error";

export interface ImageTask {
  id: string;            // "cover" | "img-1" | "img-2"
  placeholder: string;   // The full [GENERATE_IMAGE: "..."] marker
  prompt: string;
  status: ImageStatus;
  url?: string;          // Blob URL after generation
  error?: string;
}

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
  coverImage?: string;        // URL — populated after image generation
  coverImagePrompt?: string;  // DALL-E prompt used
  inlineImagePrompts?: { placeholder: string; prompt: string }[];
  youtubeEmbeds?: { placeholder: string; url: string; title: string }[];
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
