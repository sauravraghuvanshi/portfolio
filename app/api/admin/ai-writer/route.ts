import { streamText, convertToModelMessages } from "ai";
import { createAzure } from "@ai-sdk/azure";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import { extractAzureTopics, groundMicrosoftTopics } from "@/lib/ai/grounding";
import { getPortfolioContext } from "@/lib/ai/portfolio-context";
import type { AIContentType } from "@/types/ai-writer";

export const maxDuration = 60;

export async function POST(req: Request) {
  // 1. Auth check
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse request
  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = body.messages as any[];
  const contentType = body.contentType as AIContentType;

  if (!contentType || !CONTENT_TYPES[contentType]) {
    return new Response("Invalid content type", { status: 400 });
  }

  // 3. Check Azure OpenAI config
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT ?? "gpt-4o";

  if (!endpoint || !apiKey) {
    return new Response(
      JSON.stringify({
        error: "Azure OpenAI not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_API_KEY in environment.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Build context
  const schema = CONTENT_TYPES[contentType];
  const portfolioCtx = await getPortfolioContext(contentType);

  // 5. Grounding pass — extract text from messages for topic extraction
  // Messages from DefaultChatTransport use UIMessage format with parts[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textParts = messages.map((m: any) => {
    let text = "";
    if (typeof m.content === "string") {
      text = m.content;
    } else if (Array.isArray(m.parts)) {
      text = m.parts
        .filter((p: { type: string }) => p.type === "text")
        .map((p: { text: string }) => p.text)
        .join("");
    }
    return { role: m.role as string, content: text };
  });
  const topics = extractAzureTopics(textParts);
  const groundingResults =
    topics.length > 0 ? await groundMicrosoftTopics(topics) : [];

  // 6. Build system prompt
  const systemPrompt = buildSystemPrompt({
    contentType,
    schema,
    portfolioContext: portfolioCtx,
    groundingResults,
  });

  // 7. Create Azure OpenAI provider
  const azure = createAzure({
    resourceName: new URL(endpoint).hostname.split(".")[0],
    apiKey,
  });

  // 8. Stream response
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: azure.chat(deployment),
    system: systemPrompt,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
