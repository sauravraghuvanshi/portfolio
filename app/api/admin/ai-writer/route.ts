import { createUIMessageStreamResponse, createUIMessageStream } from "ai";
import {
  ManagedIdentityCredential,
  AzureCliCredential,
  type TokenCredential,
} from "@azure/identity";
import { auth } from "@/auth";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { CONTENT_TYPES } from "@/lib/ai/content-schemas";
import type { AIContentType } from "@/types/ai-writer";

export const maxDuration = 120;

// Cached credential (reused across requests)
let cachedCredential: TokenCredential | null = null;

function getCredential(): TokenCredential {
  if (!cachedCredential) {
    // WEBSITE_SITE_NAME is set automatically on Azure App Service
    if (process.env.WEBSITE_SITE_NAME) {
      console.log("[ai-writer] Using ManagedIdentityCredential (App Service)");
      cachedCredential = new ManagedIdentityCredential();
    } else {
      console.log("[ai-writer] Using AzureCliCredential (local dev)");
      cachedCredential = new AzureCliCredential();
    }
  }
  return cachedCredential;
}

/** Extract plain text from a chat message */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function messageText(m: any): string {
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("");
  }
  return "";
}

/** Extract assistant text from agent response output array */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(data: any): string {
  const parts: string[] = [];
  for (const item of data.output ?? []) {
    if (item.type === "message" && item.role === "assistant") {
      for (const c of item.content ?? []) {
        if (c.type === "output_text" && c.text) parts.push(c.text);
      }
    }
  }
  if (parts.length === 0 && data.output_text) {
    parts.push(data.output_text);
  }
  return parts.join("\n\n");
}

/** Check if agent output contains pending MCP approval requests */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findApprovalRequests(data: any): any[] {
  return (data.output ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => item.type === "mcp_approval_request"
  );
}

async function callFoundryAgent(
  systemPrompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  messages: any[]
): Promise<string> {
  const projectEndpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
  const agentName = process.env.AZURE_FOUNDRY_AGENT_NAME;

  if (!projectEndpoint || !agentName) {
    throw new Error(
      "Missing AZURE_FOUNDRY_PROJECT_ENDPOINT or AZURE_FOUNDRY_AGENT_NAME"
    );
  }

  // Use the stateful openai/responses endpoint (supports store + previous_response_id)
  const base = projectEndpoint.replace(/\/$/, "");
  const url = `${base}/openai/responses?api-version=2025-05-15-preview`;

  console.log("[ai-writer] Acquiring AAD token...");
  const credential = getCredential();
  const token = await credential.getToken("https://ai.azure.com/.default");
  if (!token) throw new Error("Failed to acquire AAD token for ai.azure.com");

  const headers = {
    Authorization: `Bearer ${token.token}`,
    "Content-Type": "application/json",
  };

  const agentRef = {
    type: "agent_reference",
    name: agentName,
  };

  // Build initial input — inject system prompt into first user message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const input: any[] = [];
  let systemInjected = false;

  for (const m of messages) {
    let text = messageText(m);
    if (!text) continue;

    const role = m.role === "user" ? "user" : "assistant";

    if (role === "user" && !systemInjected) {
      text = `[CONTEXT FOR THIS SESSION]\n${systemPrompt}\n\n[USER REQUEST]\n${text}`;
      systemInjected = true;
    }

    input.push({ role, content: text });
  }

  // Turn 1: Initial call with store=true so MCP approval flow works
  const MAX_TURNS = 5;

  console.log("[ai-writer] Agent call #1...");
  let res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input,
      agent_reference: agentRef,
      store: true,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("[ai-writer] Agent API error:", res.status, errText);
    throw new Error(`Foundry Agent ${res.status}: ${errText}`);
  }

  let data = await res.json();
  let itemTypes = (data.output ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any) => item.type
  );
  console.log("[ai-writer] Output types:", itemTypes.join(", "));

  // Check for immediate text (no approval needed)
  let text = extractText(data);
  if (text) {
    console.log(`[ai-writer] Got response (${text.length} chars) after 1 turn`);
    return text;
  }

  // Approval loop: handle MCP tool approvals using previous_response_id
  for (let turn = 1; turn < MAX_TURNS; turn++) {
    const approvals = findApprovalRequests(data);
    if (approvals.length === 0) {
      console.error("[ai-writer] No text and no approvals. Items:", itemTypes.join(", "));
      return "";
    }

    console.log(`[ai-writer] Auto-approving ${approvals.length} MCP tool call(s)...`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const approvalInputs = approvals.map((req: any) => ({
      type: "mcp_approval_response",
      approval_request_id: req.id,
      approve: true,
    }));

    console.log(`[ai-writer] Agent call #${turn + 1}...`);
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        input: approvalInputs,
        agent_reference: agentRef,
        previous_response_id: data.id,
        store: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[ai-writer] Agent API error:", res.status, errText);
      throw new Error(`Foundry Agent ${res.status}: ${errText}`);
    }

    data = await res.json();
    itemTypes = (data.output ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => item.type
    );
    console.log("[ai-writer] Output types:", itemTypes.join(", "));

    text = extractText(data);
    if (text) {
      console.log(
        `[ai-writer] Got response (${text.length} chars) after ${turn + 1} turns`
      );
      return text;
    }
  }

  console.error("[ai-writer] Max turns reached without final response");
  return "";
}

// ──────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const messages = body.messages as any[];
  const contentType = body.contentType as AIContentType;

  if (!contentType || !CONTENT_TYPES[contentType]) {
    return new Response("Invalid content type", { status: 400 });
  }

  const schema = CONTENT_TYPES[contentType];
  const systemPrompt = buildSystemPrompt({ contentType, schema });

  try {
    const agentResponse = await callFoundryAgent(systemPrompt, messages);

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
