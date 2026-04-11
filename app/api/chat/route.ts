import { createUIMessageStreamResponse, createUIMessageStream } from "ai";
import { callFoundryAgent } from "@/lib/ai/foundry-agent";
import { buildChatbotSystemPrompt } from "@/lib/ai/chatbot-prompt";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/foundry";

export const maxDuration = 60;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate limit: 10 messages per hour per IP
  const rl = checkRateLimit(`chatbot:${ip}`, { limit: 10, windowSeconds: 3600 });
  if (!rl.allowed) {
    return rateLimitResponse(rl.resetInSeconds);
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Cap conversation length to bound costs
  if (messages.length > 10) {
    return new Response(
      JSON.stringify({ error: "Conversation limit reached. Please start a new chat." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const systemPrompt = buildChatbotSystemPrompt();

  try {
    const agentResponse = await callFoundryAgent(systemPrompt, messages, "chatbot");

    if (!agentResponse) {
      return new Response(
        JSON.stringify({ error: "I couldn't generate a response. Please try again." }),
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
    console.error("[chatbot] Error:", msg);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again later." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
