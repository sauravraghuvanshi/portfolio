import { streamFoundryAgent } from "@/lib/ai/foundry-agent";
import { buildChatbotSystemPrompt } from "@/lib/ai/chatbot-prompt";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { ChatMessage } from "@/types/foundry";

export const maxDuration = 60;

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Encode a UI message stream SSE line */
function sse(data: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
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
  const textId = `txt-${Date.now()}`;

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(sse({ type: "start", messageId: `msg-${Date.now()}` }));
      controller.enqueue(sse({ type: "start-step" }));
      controller.enqueue(sse({ type: "text-start", id: textId }));

      try {
        for await (const event of streamFoundryAgent(systemPrompt, messages, "chatbot")) {
          if (event.type === "text-delta") {
            controller.enqueue(sse({ type: "text-delta", id: textId, delta: event.text }));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[chatbot] Stream error:", msg);
        controller.enqueue(
          sse({ type: "text-delta", id: textId, delta: "Sorry, something went wrong. Please try again." })
        );
      }

      controller.enqueue(sse({ type: "text-end", id: textId }));
      controller.enqueue(sse({ type: "finish-step" }));
      controller.enqueue(sse({ type: "finish" }));
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "connection": "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
      "x-accel-buffering": "no",
    },
  });
}
