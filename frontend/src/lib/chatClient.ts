/**
 * frontend/src/lib/chatClient.ts
 *
 * Typed client for the XPS Intelligence chat endpoint.
 * Calls the backend POST /api/chat/send which routes to Groq (primary)
 * or GitHub Copilot (fallback) depending on server configuration.
 */

import { apiClient } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ChatHistoryMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  agentRole?: string;
  sessionId?: string;
  /** Previous messages to include as context. */
  history?: ChatHistoryMessage[];
}

export interface ChatReply {
  id: string;
  role: "assistant";
  content: string;
  agentRole: string;
  timestamp: string;
  status: string;
  model?: string;
}

export interface ChatResponse {
  id: string;
  reply: ChatReply;
  agentRole: string;
  sessionId: string;
}

// ── Client ─────────────────────────────────────────────────────────────────────

/**
 * Send a chat message to the Groq / GitHub Copilot-backed AI agent.
 *
 * @param payload  The message, optional role, session ID, and history.
 * @returns        The assistant's reply.
 */
export async function sendChatMessage(
  payload: ChatRequest,
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>(
    "/api/chat/send",
    payload,
  );
  return response.data;
}
