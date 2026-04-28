import { z } from "zod";

// ---------- Blog ----------
export const BlogPostSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(500).optional().default(""),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  coverImage: z.string().max(500).optional(),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  content: z.string().optional().default(""),
  externalUrl: z.string().url().max(500).optional().or(z.literal("")),
  externalSource: z.string().max(100).optional(),
});

export const BlogPostUpdateSchema = BlogPostSchema.partial();

// ---------- Case Study ----------
export const CaseStudySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subtitle: z.string().max(300).optional().default(""),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  timeline: z.string().max(100).optional().default(""),
  role: z.string().max(200).optional().default(""),
  client: z.string().max(200).optional().default(""),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  coverImage: z.string().max(500).optional().default(""),
  metrics: z
    .array(z.object({ label: z.string(), value: z.string() }))
    .max(20)
    .optional()
    .default([]),
  content: z.string().optional().default(""),
});

export const CaseStudyUpdateSchema = CaseStudySchema.partial();

// ---------- Project ----------
export const ProjectSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional().default(""),
  outcomes: z.array(z.string().max(500)).max(20).optional().default([]),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  category: z.union([z.string(), z.array(z.string())]).optional(),
  techStack: z.array(z.string().max(50)).max(30).optional().default([]),
  githubUrl: z.string().max(500).optional().default("#"),
  liveUrl: z.string().max(500).optional().default("#"),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  year: z.number().int().min(2000).max(2100).optional(),
});

export const ProjectUpdateSchema = ProjectSchema.partial();

// ---------- Talk ----------
export const TalkSchema = z.object({
  id: z.string().min(1, "ID is required").max(100),
  title: z.string().min(1, "Title is required").max(200),
  topic: z.string().max(200).optional().default(""),
  description: z.string().max(1000).optional(),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const TalkUpdateSchema = TalkSchema.partial();

// ---------- Event ----------
const LocationSchema = z
  .object({
    city: z.string().max(100),
    country: z.string().max(100),
    lat: z.number(),
    lng: z.number(),
  })
  .nullable()
  .optional();

export const EventSchema = z.object({
  title: z.string().min(1, "Title is required").max(300),
  year: z.number().int().min(2000).max(2100).optional(),
  format: z.string().max(50).optional().default("Speaker"),
  topic: z.string().max(300).optional().default(""),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  summary: z.string().max(2000).optional().default(""),
  highlights: z.array(z.string().max(500)).max(20).optional().default([]),
  impact: z.array(z.string().max(500)).max(20).optional().default([]),
  coverImage: z.string().max(500).nullable().optional(),
  coverImagePosition: z.enum(["top", "center", "bottom"]).optional(),
  images: z.array(z.string().max(500)).max(50).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
  location: LocationSchema,
});

export const EventUpdateSchema = EventSchema.partial();

// ---------- Certification ----------
export const CertificationSchema = z.object({
  code: z.string().min(1, "Code is required").max(30),
  name: z.string().min(1, "Name is required").max(200),
  issuer: z.string().max(100).optional().default(""),
  year: z.number().int().min(2000).max(2100).optional(),
  verifyUrl: z.string().max(500).optional().default("#"),
  badge: z.string().max(500).optional().default(""),
  color: z.string().max(30).optional().default("blue"),
  credentialId: z.string().max(100).optional(),
  featured: z.boolean().optional().default(false),
  status: z.enum(["draft", "published"]).optional().default("draft"),
});

export const CertificationUpdateSchema = CertificationSchema.partial();

// ---------- Tech Radar ----------
export const RadarEntrySchema = z.object({
  id: z.string().min(1, "ID is required").max(100).regex(/^[a-z0-9-]+$/, "ID must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1, "Name is required").max(100),
  quadrant: z.enum(["languages", "platforms", "tools", "techniques"]),
  ring: z.enum(["adopt", "trial", "assess", "hold"]),
  summary: z.string().min(1, "Summary is required").max(1000),
  useWhen: z.string().max(500).optional(),
  avoidWhen: z.string().max(500).optional(),
  movedFrom: z.enum(["adopt", "trial", "assess", "hold"]).optional(),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
});

export const RadarEntryUpdateSchema = RadarEntrySchema.partial();

// ---------- Upload params ----------
export const UploadParamsSchema = z.object({
  folder: z
    .string()
    .max(100)
    .transform((v) => v.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .optional(),
  slug: z
    .string()
    .max(200)
    .transform((v) => v.replace(/[^a-zA-Z0-9._-]/g, "-"))
    .optional(),
});
