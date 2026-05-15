import type { AdvisorRequest, Quiz, QuizAnswers, QuizScores, PillarKey } from "@/types/advisor";
import { PILLAR_KEYS, PILLAR_LABELS } from "@/types/advisor";

/**
 * Compute per-pillar rubric scores (1-5) from quiz answers.
 * Unanswered questions count as the worst option (weight 0).
 */
export function scoreQuiz(quiz: Quiz, answers: QuizAnswers): QuizScores {
  const sums: Record<PillarKey, { total: number; count: number }> = {
    reliability: { total: 0, count: 0 },
    security: { total: 0, count: 0 },
    costOptimization: { total: 0, count: 0 },
    operationalExcellence: { total: 0, count: 0 },
    performanceEfficiency: { total: 0, count: 0 },
  };

  for (const q of quiz.questions) {
    const idx = answers[q.id];
    const weight =
      typeof idx === "number" && q.options[idx]
        ? q.options[idx].weight
        : 0;
    sums[q.pillar].total += weight;
    sums[q.pillar].count += 1;
  }

  const scores = {} as QuizScores;
  for (const key of PILLAR_KEYS) {
    const { total, count } = sums[key];
    if (count === 0) {
      scores[key] = 1;
      continue;
    }
    // average weight in [0,1] → score in [1,5]
    const avg = total / count;
    scores[key] = Math.max(1, Math.min(5, Math.round(1 + avg * 4)));
  }
  return scores;
}

/** Average of the five pillar scores, rounded. */
export function overallScore(scores: QuizScores): number {
  const sum = PILLAR_KEYS.reduce((acc, k) => acc + scores[k], 0);
  return Math.round(sum / PILLAR_KEYS.length);
}

/** True when every question has an answer. */
export function isQuizComplete(quiz: Quiz, answers: QuizAnswers): boolean {
  return quiz.questions.every((q) => typeof answers[q.id] === "number");
}

/**
 * Build an AdvisorRequest body from the quiz brief + the user's selected
 * answers so the existing /api/advisor route can produce the full WAF
 * scorecard with Microsoft Learn citations + ADR.
 *
 * Strategy: append the answer summary to the workload field (2000 char
 * budget). Leave constraints empty — the answers themselves encode the
 * constraints implicitly.
 */
export function quizToAdvisorInput(
  quiz: Quiz,
  answers: QuizAnswers,
  scores: QuizScores
): AdvisorRequest {
  const sections: string[] = [quiz.brief.trim(), ""];
  sections.push("Self-assessment from a structured WAF quiz:");

  for (const key of PILLAR_KEYS) {
    const pillarQs = quiz.questions.filter((q) => q.pillar === key);
    if (pillarQs.length === 0) continue;
    sections.push("");
    sections.push(`${PILLAR_LABELS[key]} (self-score ${scores[key]}/5):`);
    for (const q of pillarQs) {
      const idx = answers[q.id];
      const opt = typeof idx === "number" ? q.options[idx] : undefined;
      if (opt) {
        sections.push(`- ${q.question} → ${opt.label}`);
      }
    }
  }

  let workload = sections.join("\n");
  // AdvisorRequest.workload max is 2000 chars.
  if (workload.length > 2000) workload = workload.slice(0, 1997) + "…";

  return {
    workload,
    scale: "",
    constraints: [],
    region: "",
  };
}
