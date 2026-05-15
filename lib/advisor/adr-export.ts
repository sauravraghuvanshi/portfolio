import type { AdvisorResult } from "@/types/advisor";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Render an AdvisorResult.suggestedADR as ADR markdown that mirrors the shape
 * of ADREntrySchema. Public visitors download this; only the admin can save
 * it into content/decisions.json via /admin/decisions.
 */
export function buildADRMarkdown(result: AdvisorResult): string {
  const adr = result.suggestedADR;
  const today = new Date().toISOString().slice(0, 10);
  const id = `adr-${slugify(adr.title) || "draft"}`;

  const pillarList = adr.wafPillars.map((p) => `- ${p}`).join("\n");
  const options = adr.options.length
    ? adr.options.map((o, i) => `${i + 1}. ${o}`).join("\n")
    : "_(none listed)_";
  const tags = adr.tags.length ? adr.tags.join(", ") : "_(none)_";

  return `---
id: ${id}
title: ${adr.title}
status: proposed
date: ${today}
tags: [${adr.tags.map((t) => `"${t}"`).join(", ")}]
---

# ${adr.title}

> Drafted by Saurav's AI Architecture Advisor — review before adopting.

## Status
Proposed · ${today}

## WAF Pillars
${pillarList}

## Context
${adr.context}

## Options Considered
${options}

## Decision
${adr.decision}

## Rationale
${adr.rationale}

## Trade-offs
${adr.tradeoffs}

## Expected Outcome
${adr.outcome}

## Tags
${tags}
`;
}

export function adrFileName(result: AdvisorResult): string {
  const slug = slugify(result.suggestedADR.title) || "advisor-adr";
  return `${slug}.md`;
}
