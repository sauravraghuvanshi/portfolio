/** Types for Azure AI Foundry Responses API */

export interface FoundryMessageContent {
  type: "output_text";
  text: string;
}

export interface FoundryMessageOutput {
  type: "message";
  role: "assistant";
  content: FoundryMessageContent[];
}

export interface FoundryMcpApprovalRequest {
  type: "mcp_approval_request";
  id: string;
  name?: string;
  server_label?: string;
}

export type FoundryOutputItem =
  | FoundryMessageOutput
  | FoundryMcpApprovalRequest
  | { type: string; [key: string]: unknown };

export interface FoundryResponse {
  id: string;
  output: FoundryOutputItem[];
  output_text?: string;
  status?: string;
}

export interface FoundryMcpApprovalInput {
  type: "mcp_approval_response";
  approval_request_id: string;
  approve: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | { type: string; text?: string }[];
  parts?: { type: string; text?: string }[];
}
