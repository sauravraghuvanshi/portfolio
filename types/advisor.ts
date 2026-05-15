import type { z } from "zod";
import type {
  AdvisorRequestSchema,
  AdvisorResultSchema,
  QuizGenerateRequestSchema,
  QuizSchema,
} from "@/lib/api-schemas";

export type AdvisorRequest = z.infer<typeof AdvisorRequestSchema>;
export type AdvisorResult = z.infer<typeof AdvisorResultSchema>;
export type PillarAssessment = AdvisorResult["pillars"]["reliability"];
export type Citation = PillarAssessment["citations"][number];

export type QuizGenerateRequest = z.infer<typeof QuizGenerateRequestSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type QuizQuestion = Quiz["questions"][number];
export type QuizOption = QuizQuestion["options"][number];
/** Map of questionId → selected option index. */
export type QuizAnswers = Record<string, number>;
/** Per-pillar rubric scores (1-5) derived from answers. */
export type QuizScores = Record<PillarKey, number>;

export const PILLAR_KEYS = [
  "reliability",
  "security",
  "costOptimization",
  "operationalExcellence",
  "performanceEfficiency",
] as const;

export type PillarKey = (typeof PILLAR_KEYS)[number];

export const PILLAR_LABELS: Record<PillarKey, string> = {
  reliability: "Reliability",
  security: "Security",
  costOptimization: "Cost Optimization",
  operationalExcellence: "Operational Excellence",
  performanceEfficiency: "Performance Efficiency",
};

/** Map advisor pillar keys → ADREntrySchema wafPillars enum values. */
export const PILLAR_TO_WAF: Record<PillarKey, string> = {
  reliability: "reliability",
  security: "security",
  costOptimization: "cost-optimization",
  operationalExcellence: "operational-excellence",
  performanceEfficiency: "performance-efficiency",
};
