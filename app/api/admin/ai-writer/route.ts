import { createUIMessageStreamResponse, createUIMessageStream } from "ai";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import { callFoundryAgent } from "@/lib/ai/foundry-agent";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { AIContentType } from "@/types/ai-writer";
import type { ChatMessage } from "@/types/foundry";

export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit: 5 requests per minute per user
  const rl = checkRateLimit(`ai-writer:${session.user.id}`, { limit: 5, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  const body = await req.json();
  const messages = body.messages as ChatMessage[];
  const contentType = body.contentType as AIContentType;

  if (!contentType || !CONTENT_TYPES[contentType]) {
    return new Response("Invalid content type", { status: 400 });
  }

  const schema = CONTENT_TYPES[contentType];
  const systemPrompt = buildSystemPrompt({ contentType, schema });

  try {
    const agentResponse = await callFoundryAgent(systemPrompt, messages, "ai-writer");

    if (!agentResponse) {
      return new Response(
        JSON.stringify({ error: "Empty response from Foundry Agent" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const textId = `txt-${Date.now()}`;
    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "start", messageId: `msg-${Date.now()}` });
        writer.write({ type: "start-step" });
        writer.write({ type: "text-start", id: textId });
        writer.write({ type: "text-delta", id: textId, delta: agentResponse });
        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish-step" });
        writer.write({ type: "finish" });
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ai-writer] Foundry Agent error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
