import { streamFoundryAgent } from "@/lib/ai/foundry-agent";
import { buildAdvisorQuizSystemPrompt } from "@/lib/ai/advisor-quiz-prompt";
import { QuizGenerateRequestSchema, QuizSchema } from "@/lib/api-schemas";
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

function extractJson(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return s;
  return s.slice(first, last + 1);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 10 quiz generations per IP per day. Cheaper than advisor (no MCP),
  // but still a Foundry call — keep it bounded.
  const rl = checkRateLimit(`advisor-quiz:${ip}`, { limit: 10, windowSeconds: 86400 });
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

  const parsed = QuizGenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request", issues: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const userMessage =
    `Generate the WAF quiz for the workload described below. Tailor questions to the brief where possible.\n\n` +
    `**Brief:** ${parsed.data.brief}`;

  const messages: ChatMessage[] = [{ role: "user", content: userMessage }];
  const systemPrompt = buildAdvisorQuizSystemPrompt();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sse({ type: "start" }));

      let buffer = "";
      try {
        // No MCP needed for quiz generation — stateless is fine, but we keep
        // it consistent with the advisor agent (stateful=true).
        for await (const event of streamFoundryAgent(systemPrompt, messages, "advisor", true)) {
          if (event.type === "text-delta") {
            buffer += event.text;
            controller.enqueue(sse({ type: "delta", text: event.text }));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[advisor-quiz] Stream error:", msg);
        controller.enqueue(sse({ type: "error", message: "Sorry, generating the quiz failed. Please try again." }));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      const jsonText = extractJson(buffer);
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(jsonText);
      } catch (e) {
        console.error("[advisor-quiz] JSON parse failed:", e, "raw:", buffer.slice(0, 400));
        controller.enqueue(sse({ type: "error", message: "The quiz generator returned malformed output. Please retry." }));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      const validated = QuizSchema.safeParse(parsedJson);
      if (!validated.success) {
        console.error("[advisor-quiz] Schema validation failed:", validated.error.flatten());
        controller.enqueue(sse({ type: "error", message: "The quiz response didn't match the expected shape. Please retry." }));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }

      controller.enqueue(sse({ type: "complete", quiz: validated.data }));
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
