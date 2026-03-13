/**
 * frontend/src/lib/runtimeClient.ts
 *
 * API client for the runtime command execution backend.
 *
 * Usage:
 *   import { sendCommand, getTaskStatus } from "@/lib/runtimeClient";
 *
 *   const { task_id } = await sendCommand({ command: "scrape_website", target: "example.com" });
 *   const status = await getTaskStatus(task_id);
 */

import { apiClient } from "@/lib/api";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RuntimeCommandRequest {
  command: string;
  target?: string | null;
  parameters?: Record<string, unknown>;
}

export interface RuntimeCommandResponse {
  task_id: string;
  status: "queued";
}

export type TaskStatus = "queued" | "running" | "completed" | "failed";

export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  command?: string;
  target?: string;
  logs: string[];
  result?: Record<string, unknown> | null;
  error?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SystemMetricsResponse {
  metrics: {
    uptime_seconds: number;
    counters: Record<string, number>;
    gauges: Record<string, number>;
  };
  worker_stats: {
    queue_size: number;
    tasks_last_hour: number;
    successes_last_hour: number;
    failures_last_hour: number;
  };
  queue_size: number;
  circuit_breakers: Record<
    string,
    { status: "closed" | "open" | "half_open"; failures: number }
  >;
}

export interface AgentActivityEntry {
  agent: string;
  task_id: string | null;
  level: string;
  message: string;
  timestamp: number;
}

// ─── Runtime Client ────────────────────────────────────────────────────────────

/**
 * Submit a command to the runtime execution engine.
 * Returns a task_id that can be polled with getTaskStatus().
 */
export async function sendCommand(
  payload: RuntimeCommandRequest,
): Promise<RuntimeCommandResponse> {
  const response = await apiClient.post<RuntimeCommandResponse>(
    "/api/v1/runtime/command",
    payload,
  );
  return response.data;
}

/**
 * Poll the status of a task by its ID.
 */
export async function getTaskStatus(
  taskId: string,
): Promise<TaskStatusResponse> {
  const response = await apiClient.get<TaskStatusResponse>(
    `/api/v1/runtime/task/${encodeURIComponent(taskId)}`,
  );
  return response.data;
}

/**
 * Fetch system health status.
 */
export async function getSystemHealth(): Promise<{
  status: string;
  checks: Array<{ name: string; status: string }>;
}> {
  const response = await apiClient.get<{
    status: string;
    checks: Array<{ name: string; status: string }>;
  }>("/api/v1/system/health");
  return response.data;
}

/**
 * Fetch system runtime metrics.
 */
export async function getSystemMetrics(): Promise<SystemMetricsResponse> {
  const response = await apiClient.get<SystemMetricsResponse>(
    "/api/v1/system/metrics",
  );
  return response.data;
}

/**
 * Fetch recent tasks.
 */
export async function getRecentTasks(
  limit = 50,
): Promise<{ tasks: TaskStatusResponse[] }> {
  const response = await apiClient.get<{ tasks: TaskStatusResponse[] }>(
    `/api/v1/system/tasks?limit=${encodeURIComponent(limit)}`,
  );
  return response.data;
}

/**
 * Fetch recent agent activity log entries.
 */
export async function getAgentActivity(
  limit = 100,
): Promise<{ entries: AgentActivityEntry[] }> {
  const response = await apiClient.get<{ entries: AgentActivityEntry[] }>(
    `/api/v1/system/agent-activity?limit=${encodeURIComponent(limit)}`,
  );
  return response.data;
}

/**
 * Poll a task until it reaches a terminal state (completed | failed).
 *
 * @param taskId  Task ID returned from sendCommand()
 * @param options Polling configuration
 */
export async function pollTaskUntilDone(
  taskId: string,
  options: {
    intervalMs?: number;
    timeoutMs?: number;
    onUpdate?: (task: TaskStatusResponse) => void;
  } = {},
): Promise<TaskStatusResponse> {
  const { intervalMs = 2000, timeoutMs = 300_000, onUpdate } = options;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const task = await getTaskStatus(taskId);
    onUpdate?.(task);

    if (task.status === "completed" || task.status === "failed") {
      return task;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Task ${taskId} timed out after ${timeoutMs / 1000}s`);
}

// ─── Chat / LLM ────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  reply: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  } | null;
}

/**
 * Send a natural-language message to the XPS Intelligence LLM agent (Groq).
 * Supports conversation history for multi-turn dialogue.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[] = [],
  system?: string,
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>("/api/v1/chat", {
    message,
    history,
    system,
  });
  return response.data;
}
