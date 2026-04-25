import {
  ManagedIdentityCredential,
  AzureCliCredential,
  type TokenCredential,
} from "@azure/identity";
import type {
  FoundryResponse,
  FoundryOutputItem,
  FoundryMessageOutput,
  FoundryMcpApprovalRequest,
  FoundryMcpApprovalInput,
  ChatMessage,
  FoundryStreamEvent,
} from "@/types/foundry";

const isDev = process.env.NODE_ENV === "development";
const log = isDev ? console.log : () => {};

let cachedCredential: TokenCredential | null = null;

function getCredential(): TokenCredential {
  if (!cachedCredential) {
    if (process.env.WEBSITE_SITE_NAME) {
      log("[foundry-agent] Using ManagedIdentityCredential (App Service)");
      cachedCredential = new ManagedIdentityCredential();
    } else {
      const tenantId = process.env.AZURE_TENANT_ID;
      log("[foundry-agent] Using AzureCliCredential (local dev)", tenantId ? `tenant: ${tenantId}` : "");
      cachedCredential = new AzureCliCredential(tenantId ? { tenantId } : undefined);
    }
  }
  return cachedCredential;
}

/** Extract plain text from a chat message */
export function messageText(m: ChatMessage): string {
  if (typeof m.content === "string") return m.content;
  if (Array.isArray(m.parts)) {
    return m.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("");
  }
  return "";
}

/** Extract assistant text from agent response output array */
function extractText(data: FoundryResponse): string {
  const parts: string[] = [];
  for (const item of data.output ?? []) {
    if (item.type === "message") {
      const msg = item as FoundryMessageOutput;
      for (const c of msg.content ?? []) {
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
function findApprovalRequests(data: FoundryResponse): FoundryMcpApprovalRequest[] {
  return (data.output ?? []).filter(
    (item): item is FoundryMcpApprovalRequest => item.type === "mcp_approval_request"
  );
}

/**
 * Build the application-scoped Responses API URL for an agent.
 * Format: {projectEndpoint}/applications/{agentName}/protocols/openai/responses
 */
function buildAgentUrl(projectEndpoint: string, agentName: string): string {
  const base = projectEndpoint.replace(/\/$/, "");
  return `${base}/applications/${agentName}/protocols/openai/responses?api-version=2025-11-15-preview`;
}

/**
 * Call the Azure AI Foundry agent with the given system prompt and messages.
 * Handles AAD token acquisition, MCP approval loops, and text extraction.
 */
export async function callFoundryAgent(
  systemPrompt: string,
  messages: ChatMessage[],
  label = "foundry-agent"
): Promise<string> {
  const projectEndpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
  const agentName = process.env.AZURE_FOUNDRY_AGENT_NAME;

  if (!projectEndpoint || !agentName) {
    throw new Error(
      "Missing AZURE_FOUNDRY_PROJECT_ENDPOINT or AZURE_FOUNDRY_AGENT_NAME"
    );
  }

  const url = buildAgentUrl(projectEndpoint, agentName);

  log(`[${label}] Acquiring AAD token...`);
  const credential = getCredential();
  const token = await credential.getToken("https://ai.azure.com/.default");
  if (!token) throw new Error("Failed to acquire AAD token for ai.azure.com");

  const headers = {
    Authorization: `Bearer ${token.token}`,
    "Content-Type": "application/json",
  };

  // Build input — inject system prompt into first user message
  const input: { role: string; content: string }[] = [];
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

  const MAX_TURNS = 5;

  log(`[${label}] Agent call #1...`);
  let res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ input, store: true }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[${label}] Agent API error:`, res.status, errText);
    throw new Error(`Foundry Agent ${res.status}: ${errText}`);
  }

  let data: FoundryResponse = await res.json();
  let itemTypes = (data.output ?? []).map(
    (item: FoundryOutputItem) => item.type
  );
  log(`[${label}] Output types:`, itemTypes.join(", "));

  let text = extractText(data);
  if (text) {
    log(`[${label}] Got response (${text.length} chars) after 1 turn`);
    return text;
  }

  // Approval loop: handle MCP tool approvals
  for (let turn = 1; turn < MAX_TURNS; turn++) {
    const approvals = findApprovalRequests(data);
    if (approvals.length === 0) {
      console.error(`[${label}] No text and no approvals. Items:`, itemTypes.join(", "));
      return "";
    }

    log(`[${label}] Auto-approving ${approvals.length} MCP tool call(s)...`);

    const approvalInputs: FoundryMcpApprovalInput[] = approvals.map((req) => ({
      type: "mcp_approval_response",
      approval_request_id: req.id,
      approve: true,
    }));

    log(`[${label}] Agent call #${turn + 1}...`);
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        input: approvalInputs,
        previous_response_id: data.id,
        store: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[${label}] Agent API error:`, res.status, errText);
      throw new Error(`Foundry Agent ${res.status}: ${errText}`);
    }

    data = await res.json();
    itemTypes = (data.output ?? []).map(
      (item: FoundryOutputItem) => item.type
    );
    log(`[${label}] Output types:`, itemTypes.join(", "));

    text = extractText(data);
    if (text) {
      log(`[${label}] Got response (${text.length} chars) after ${turn + 1} turns`);
      return text;
    }
  }

  console.error(`[${label}] Max turns reached without final response`);
  return "";
}

// ---------------------------------------------------------------------------
// SSE parser — parses "event: <type>\ndata: <json>\n\n" from a ReadableStream
// ---------------------------------------------------------------------------

interface SSEEvent {
  event: string;
  data: string;
}

async function* parseSSE(
  body: ReadableStream<Uint8Array>,
  label = ""
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventCount = 0;
  const t0 = Date.now();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by blank lines — handle \r\n and \n
      const normalized = buffer.replace(/\r\n/g, "\n");
      let boundary: number;
      buffer = normalized;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const block = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);
        if (!block) continue;

        let eventType = "message";
        let data = "";

        for (const line of block.split("\n")) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data += (data ? "\n" : "") + line.slice(5).trimStart();
          }
        }

        if (data) {
          eventCount++;
          yield { event: eventType, data };
        }
      }
    }
  } finally {
    log(`[${label}] SSE stream ended: ${eventCount} events in ${Date.now() - t0}ms`);
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Streaming Foundry Agent call — yields text deltas as they arrive
// ---------------------------------------------------------------------------

/**
 * Stream the Azure AI Foundry agent response token-by-token.
 * Handles MCP approval loops transparently — the consumer only sees text deltas.
 */
export async function* streamFoundryAgent(
  systemPrompt: string,
  messages: ChatMessage[],
  label = "foundry-agent-stream"
): AsyncGenerator<FoundryStreamEvent> {
  const projectEndpoint = process.env.AZURE_FOUNDRY_PROJECT_ENDPOINT;
  const agentName = process.env.AZURE_FOUNDRY_AGENT_NAME;

  if (!projectEndpoint || !agentName) {
    throw new Error(
      "Missing AZURE_FOUNDRY_PROJECT_ENDPOINT or AZURE_FOUNDRY_AGENT_NAME"
    );
  }

  const url = buildAgentUrl(projectEndpoint, agentName);

  log(`[${label}] Acquiring AAD token...`);
  const credential = getCredential();
  const token = await credential.getToken("https://ai.azure.com/.default");
  if (!token) throw new Error("Failed to acquire AAD token for ai.azure.com");

  const headers = {
    Authorization: `Bearer ${token.token}`,
    "Content-Type": "application/json",
  };

  // Build input — inject system prompt into first user message
  const input: { role: string; content: string }[] = [];
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

  const MAX_TURNS = 5;
  let previousResponseId: string | undefined;
  let currentInput: unknown = input;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    log(`[${label}] Streaming call #${turn + 1}...`);

    const body: Record<string, unknown> = {
      input: currentInput,
      store: true,
      stream: true,
    };
    if (previousResponseId) {
      body.previous_response_id = previousResponseId;
    }

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[${label}] Agent API error:`, res.status, errText);
      throw new Error(`Foundry Agent ${res.status}: ${errText}`);
    }

    if (!res.body) {
      throw new Error("Foundry Agent returned no response body for stream");
    }

    const mcpApprovals: string[] = [];
    let responseId = "";
    let gotText = false;

    for await (const sse of parseSSE(res.body, label)) {
      try {
        const data = JSON.parse(sse.data);

        if (sse.event === "response.output_text.delta") {
          gotText = true;
          yield { type: "text-delta", text: data.delta };
        } else if (sse.event === "response.output_item.added") {
          if (data.item?.type === "mcp_approval_request" && data.item?.id) {
            mcpApprovals.push(data.item.id);
            log(`[${label}] MCP approval request: ${data.item.id}`);
          }
        } else if (sse.event === "response.completed") {
          responseId = data.response?.id ?? "";
        }
      } catch {
        // Skip malformed SSE data lines (e.g. "[DONE]")
      }
    }

    if (gotText) {
      log(`[${label}] Stream complete after ${turn + 1} turn(s)`);
      yield { type: "done", responseId };
      return;
    }

    if (mcpApprovals.length > 0 && responseId) {
      log(`[${label}] Auto-approving ${mcpApprovals.length} MCP tool call(s)...`);
      previousResponseId = responseId;
      currentInput = mcpApprovals.map((id) => ({
        type: "mcp_approval_response",
        approval_request_id: id,
        approve: true,
      }));
      continue;
    }

    console.error(`[${label}] Stream ended with no text and no approvals`);
    return;
  }

  console.error(`[${label}] Max turns reached without final response`);
}
