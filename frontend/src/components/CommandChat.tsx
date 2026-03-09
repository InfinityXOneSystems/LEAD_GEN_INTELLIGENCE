"use client";

import { useState, useRef } from "react";
import { Bot, Loader2, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  sendCommand,
  getTaskStatus,
  pollTaskUntilDone,
  type TaskStatusResponse,
  type RuntimeCommandRequest,
} from "@/lib/runtimeClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  taskId?: string;
  taskStatus?: TaskStatusResponse;
  timestamp: Date;
}

function parseCommand(input: string): RuntimeCommandRequest {
  const lower = input.toLowerCase().trim();

  if (lower.includes("scrape") || lower.includes("find") || lower.includes("search")) {
    return { command: "run_scraper", target: input, parameters: { query: input } };
  }
  if (lower.includes("seo") || lower.includes("audit")) {
    const urlMatch = input.match(/https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}/i);
    return {
      command: "run_seo_audit",
      target: urlMatch?.[0] ?? input,
      parameters: {},
    };
  }
  if (lower.includes("social") || lower.includes("linkedin") || lower.includes("facebook")) {
    const urlMatch = input.match(/https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}/i);
    return {
      command: "run_social_scan",
      target: urlMatch?.[0] ?? input,
      parameters: {},
    };
  }
  if (lower.includes("browse") || lower.includes("navigate") || lower.includes("visit")) {
    const urlMatch = input.match(/https?:\/\/[^\s]+|[a-z0-9-]+\.[a-z]{2,}/i);
    return {
      command: "run_browser",
      target: urlMatch?.[0] ?? input,
      parameters: { action: "navigate" },
    };
  }

  return {
    command: "health_check",
    target: null,
    parameters: { original_input: input },
  };
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    queued: "bg-gray-100 text-gray-600",
    running: "bg-blue-100 text-blue-700 animate-pulse",
    completed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colours[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status}
    </span>
  );
}

function TaskCard({ task }: { task: TaskStatusResponse }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-gray-500">{task.task_id.slice(0, 8)}…</span>
        <StatusBadge status={task.status} />
        <button
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto text-gray-400 hover:text-gray-600"
        >
          {expanded ? <X size={12} /> : <span className="text-xs">logs</span>}
        </button>
      </div>
      {task.error && (
        <p className="mt-1 text-red-600">{task.error}</p>
      )}
      {expanded && task.logs.length > 0 && (
        <pre className="mt-2 max-h-40 overflow-y-auto rounded bg-gray-900 p-2 text-green-400 text-[10px]">
          {task.logs.join("\n")}
        </pre>
      )}
    </div>
  );
}

export default function CommandChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content:
        'XPS Intelligence Runtime ready. Type a command like "scrape epoxy contractors in Ohio" or "run SEO audit on example.com".',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const full: ChatMessage = {
      ...msg,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, full]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    return full.id;
  };

  const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input.trim();
    setInput("");
    setLoading(true);

    addMessage({ role: "user", content: userText });

    try {
      const cmd = parseCommand(userText);
      const { task_id } = await sendCommand(cmd);

      const assistantId = addMessage({
        role: "assistant",
        content: `Command submitted (${cmd.command}). Polling for results…`,
        taskId: task_id,
        taskStatus: { task_id, status: "queued", logs: [] },
      });

      // Poll until done
      pollTaskUntilDone(task_id, {
        intervalMs: 2000,
        timeoutMs: 120_000,
        onUpdate: (task) => {
          updateMessage(assistantId, {
            taskStatus: task,
            content:
              task.status === "completed"
                ? `✅ Task completed (${cmd.command})`
                : task.status === "failed"
                  ? `❌ Task failed: ${task.error ?? "unknown error"}`
                  : `⏳ Status: ${task.status}…`,
          });
        },
      }).catch((err) => {
        updateMessage(assistantId, {
          content: `⚠️ Polling error: ${err.message}`,
        });
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Command failed";
      toast.error(message);
      addMessage({ role: "assistant", content: `❌ Error: ${message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
        <Bot className="h-4 w-4 text-blue-500" />
        <h2 className="text-sm font-semibold text-gray-700">Runtime Command Chat</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : msg.role === "system"
                    ? "bg-gray-100 text-gray-500 italic text-xs"
                    : "bg-gray-50 border border-gray-200 text-gray-800"
              }`}
            >
              {msg.content}
              {msg.taskStatus && <TaskCard task={msg.taskStatus} />}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-gray-100 px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='scrape epoxy contractors in Texas…'
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
