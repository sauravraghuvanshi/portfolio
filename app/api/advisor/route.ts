import { streamFoundryAgent } from "@/lib/ai/foundry-agent";
import { buildAdvisorSystemPrompt } from "@/lib/ai/advisor-prompt";
import { AdvisorRequestSchema, AdvisorResultSchema } from "@/lib/api-schemas";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/foundry";

export const maxDuration = 120;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

/** Strip ```json fences and leading/trailing prose, leave the outermost {...}. */
function extractJson(raw: string): string {
  let s = raw.trim();
  // remove leading code fence
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return s;
  return s.slice(first, last + 1);
}

function buildUserMessage(parsed: {
  workload: string;
  scale?: string;
  constraints?: string[];
  region?: string;
}): string {
  const lines = [
    "Assess the following workload against the Microsoft Well-Architected Framework. Return the JSON document only.",
    "",
    `**Workload description:** ${parsed.workload}`,
  ];
  if (parsed.scale) lines.push(`**Scale / load:** ${parsed.scale}`);
  if (parsed.region) lines.push(`**Target region(s):** ${parsed.region}`);
  if (parsed.constraints && parsed.constraints.length) {
    lines.push(`**Constraints:**`);
    for (const c of parsed.constraints) lines.push(`- ${c}`);
  }
  return lines.join("\n");
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Tighter limit than the chatbot — each advisor call fans out into multiple MCP searches.
  const rl = checkRateLimit(`advisor:${ip}`, { limit: 5, windowSeconds: 3600 });
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetInSeconds);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = AdvisorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const userMessage = buildUserMessage(parsed.data);
  const messages: ChatMessage[] = [{ role: "user", content: userMessage }];
  const systemPrompt = buildAdvisorSystemPrompt();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sse({ type: "start" }));

      let buffer = "";
      try {
        // stateful=true is required for MCP approval loops (Lesson 64).
        for await (const event of streamFoundryAgent(systemPrompt, messages, "advisor", true)) {
          if (event.type === "text-delta") {
            buffer += event.text;
            controller.enqueue(sse({ type: "delta", text: event.text }));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[advisor] Stream error:", msg);
        controller.enqueue(sse({ type: "error", message: "Sorry, the advisor failed. Please try again." }));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      // Parse + validate final JSON
      const jsonText = extractJson(buffer);
      let result: unknown;
      try {
        result = JSON.parse(jsonText);
      } catch (e) {
        console.error("[advisor] JSON parse failed:", e, "raw:", buffer.slice(0, 400));
        controller.enqueue(sse({ type: "error", message: "The advisor returned malformed output. Please retry." }));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      const validated = AdvisorResultSchema.safeParse(result);
      if (!validated.success) {
        console.error("[advisor] Schema validation failed:", validated.error.flatten());
        controller.enqueue(sse({ type: "error", message: "The advisor's response didn't match the expected shape. Please retry." }));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      controller.enqueue(sse({ type: "complete", result: validated.data }));
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}
