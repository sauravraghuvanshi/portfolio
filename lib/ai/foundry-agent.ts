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

  const base = projectEndpoint.replace(/\/$/, "");
  const url = `${base}/openai/responses?api-version=2025-05-15-preview`;

  log(`[${label}] Acquiring AAD token...`);
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
    body: JSON.stringify({
      input,
      agent_reference: agentRef,
      store: true,
    }),
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
        agent_reference: agentRef,
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
