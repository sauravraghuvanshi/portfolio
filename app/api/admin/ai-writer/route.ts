import { createUIMessageStreamResponse, createUIMessageStream } from "ai";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import { callFoundryAgent } from "@/lib/ai/foundry-agent";
import { processImageMarkers } from "@/lib/ai/image-generator";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import type { AIContentType } from "@/types/ai-writer";
import type { ChatMessage } from "@/types/foundry";

export const maxDuration = 300; // 5 min — image generation adds latency

/**
 * Returns the agent name for the AI Writer.
 * Uses AI_WRITER_AGENT_NAME if set; falls back to AZURE_FOUNDRY_AGENT_NAME.
 * This lets the AI Writer use a more capable model (e.g. gpt-4.1) while
 * the "Ask about Saurav" chatbot keeps its own agent.
 */
function getAIWriterAgentName(): string {
  return (
    process.env.AI_WRITER_AGENT_NAME ||
    process.env.AZURE_FOUNDRY_AGENT_NAME ||
    ""
  );
}

/**
 * Extract slug from content for image blob path namespacing.
 * Tries to find "slug" in the last assistant message's JSON payload.
 * Falls back to a timestamp-based name.
 */
function extractSlugFromMessages(messages: ChatMessage[]): string {
  const lastAI = [...messages].reverse().find((m) => m.role === "assistant");
  if (lastAI) {
    const text = typeof lastAI.content === "string" ? lastAI.content : "";
    const match = text.match(/"slug"\s*:\s*"([^"]+)"/);
    if (match) return match[1];
  }
  return `post-${Date.now()}`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Rate limit: 3 requests per minute (image gen is slow and expensive)
  const rl = checkRateLimit(`ai-writer:${session.user.id}`, { limit: 3, windowSeconds: 60 });
  if (!rl.allowed) return rateLimitResponse(rl.resetInSeconds);

  const body = await req.json();
  const messages = body.messages as ChatMessage[];
  const contentType = body.contentType as AIContentType;
  const skipImages = body.skipImages === true; // opt-out for follow-up messages

  if (!contentType || !CONTENT_TYPES[contentType]) {
    return new Response("Invalid content type", { status: 400 });
  }

  const agentName = getAIWriterAgentName();
  if (!agentName) {
    return new Response("AI Writer agent not configured", { status: 500 });
  }

  const schema = CONTENT_TYPES[contentType];
  const systemPrompt = buildSystemPrompt({ contentType, schema });

  try {
    // Use AI_WRITER_AGENT_NAME override so AI Writer uses a different (stronger) model
    // than the "Ask about Saurav" chatbot agent
    const savedAgentName = process.env.AZURE_FOUNDRY_AGENT_NAME;
    process.env.AZURE_FOUNDRY_AGENT_NAME = agentName;

    let agentResponse = await callFoundryAgent(systemPrompt, messages, "ai-writer");

    // Restore original agent name
    if (savedAgentName !== undefined) {
      process.env.AZURE_FOUNDRY_AGENT_NAME = savedAgentName;
    }

    if (!agentResponse) {
      return new Response(
        JSON.stringify({ error: "Empty response from Foundry Agent" }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Auto-process image markers if this looks like a final generation
    // (i.e. the response contains a ```json block with bodyMarkdown)
    const hasJsonPayload = /```json[\s\S]*?"bodyMarkdown"/.test(agentResponse);
    if (hasJsonPayload && !skipImages) {
      const slug = extractSlugFromMessages([
        ...messages,
        { role: "assistant", content: agentResponse },
      ]);
      agentResponse = await processAgentResponseImages(agentResponse, slug);
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

/**
 * Finds [GENERATE_IMAGE: "..."] markers in both the preview section AND the
 * JSON payload's bodyMarkdown, generates real images for each, and replaces
 * the markers with actual markdown image syntax. Also updates the JSON payload
 * fields: coverImage, bodyMarkdown.
 */
async function processAgentResponseImages(
  response: string,
  slug: string
): Promise<string> {
  // Extract the JSON payload to get bodyMarkdown
  const jsonMatch = response.match(/```json\s*([\s\S]*?)```/);
  if (!jsonMatch) return response;

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(jsonMatch[1]);
  } catch {
    return response;
  }

  const bodyMarkdown = (payload.bodyMarkdown as string) || "";
  if (!bodyMarkdown) return response;

  // Process images in the bodyMarkdown
  const { processed, coverImageUrl } = await processImageMarkers(bodyMarkdown, slug);

  // Update the payload
  payload.bodyMarkdown = processed;
  if (coverImageUrl) {
    payload.coverImage = coverImageUrl;
  }

  // Also process the preview section (outside the JSON block)
  const previewSection = response.slice(0, response.indexOf("```json"));
  const { processed: processedPreview } = await processImageMarkers(previewSection, slug);

  // Reconstruct the full response with updated JSON
  const updatedJson = "```json\n" + JSON.stringify(payload, null, 2) + "\n```";
  const afterJson = response.slice(response.indexOf("```json") + jsonMatch[0].length);
  return processedPreview + updatedJson + afterJson;
}
