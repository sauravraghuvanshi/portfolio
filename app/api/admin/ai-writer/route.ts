import { createUIMessageStreamResponse, createUIMessageStream } from "ai";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import { streamFoundryAgent } from "@/lib/ai/foundry-agent";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { AIContentType } from "@/types/ai-writer";
import type { ChatMessage } from "@/types/foundry";

export const maxDuration = 300; // 5 min

/**
 * Returns the agent name for the AI Writer.
 * Uses AI_WRITER_AGENT_NAME if set; falls back to AZURE_FOUNDRY_AGENT_NAME.
 */
function getAIWriterAgentName(): string {
  return (
    process.env.AI_WRITER_AGENT_NAME ||
    process.env.AZURE_FOUNDRY_AGENT_NAME ||
    ""
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rl = checkRateLimit(`ai-writer:${session.user.id}`, { limit: 3, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  const body = await req.json();
  const messages = body.messages as ChatMessage[];
  const contentType = body.contentType as AIContentType;

  if (!contentType || !CONTENT_TYPES[contentType]) {
    return new Response("Invalid content type", { status: 400 });
  }

  const agentName = getAIWriterAgentName();
  if (!agentName) {
    return new Response("AI Writer agent not configured", { status: 500 });
  }

  const schema = CONTENT_TYPES[contentType];
  const systemPrompt = buildSystemPrompt({ contentType, schema });

  // Override agent name for AI Writer (may use a stronger model)
  const savedAgentName = process.env.AZURE_FOUNDRY_AGENT_NAME;
  process.env.AZURE_FOUNDRY_AGENT_NAME = agentName;

  const textId = `txt-${Date.now()}`;

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        writer.write({ type: "start", messageId: `msg-${Date.now()}` });
        writer.write({ type: "start-step" });
        writer.write({ type: "text-start", id: textId });

        // Stream agent text to client in real-time — no buffering
        for await (const event of streamFoundryAgent(systemPrompt, messages, "ai-writer", true)) {
          if (event.type === "text-delta") {
            writer.write({ type: "text-delta", id: textId, delta: event.text });
          }
        }

        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish-step" });
        writer.write({ type: "finish" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[ai-writer] Stream error:", msg);
        // Write the error as text so the client sees it
        writer.write({ type: "text-delta", id: textId, delta: `\n\n**Error:** ${msg}` });
        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish-step" });
        writer.write({ type: "finish" });
      } finally {
        // Restore original agent name
        if (savedAgentName !== undefined) {
          process.env.AZURE_FOUNDRY_AGENT_NAME = savedAgentName;
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
