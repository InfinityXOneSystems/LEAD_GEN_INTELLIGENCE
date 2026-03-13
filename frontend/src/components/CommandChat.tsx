"use client";

import { useState, useRef, useEffect, CSSProperties } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  sendCommand,
  sendChatMessage,
  pollTaskUntilDone,
  type TaskStatusResponse,
  type RuntimeCommandRequest,
  type ChatMessage as LLMChatMessage,
} from "@/lib/runtimeClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  taskId?: string;
  taskStatus?: TaskStatusResponse;
  timestamp: Date;
}

// Easily extensible list of contractor/trade keywords used in scrape command detection
const SCRAPE_KEYWORDS = [
  "epoxy",
  "flooring",
  "tile",
  "carpet",
  "hardwood",
  "vinyl",
  "concrete",
  "roofing",
  "hvac",
  "plumbing",
  "electrical",
  "solar",
  "painting",
  "siding",
  "pool",
  "landscaping",
  "fence",
  "deck",
  "drywall",
  "insulation",
  "waterproofing",
  "garage",
  "foundation",
  "windows",
  "doors",
];

// Commands that should also dispatch a backend runtime task
const COMMAND_PATTERNS: Array<{
  test: (s: string) => boolean;
  build: (s: string) => RuntimeCommandRequest;
}> = [
  {
    test: (s) =>
      /\b(scrape|find|discover|search|get)\b.*(leads?|contractors?|businesses?)/i.test(
        s,
      ),
    build: (s) => {
      const kw =
        s.match(new RegExp(`\\b(${SCRAPE_KEYWORDS.join("|")})\\b`, "i"))?.[0] ??
        "contractor";
      const city =
        s
          .match(/\b(in|near|around)\s+([A-Za-z\s]+(?:,\s*[A-Z]{2})?)/i)?.[2]
          ?.trim() ?? "";
      return {
        command: "scrape_leads",
        command_type: "scrape",
        params: { keyword: `${kw} contractor`, location: city },
        priority: 5,
        timeout_seconds: 60,
      };
    },
  },
  {
    test: (s) => /\baudit\b/i.test(s),
    build: () => ({
      command: "run_audit",
      command_type: "audit",
      params: {},
      priority: 3,
      timeout_seconds: 120,
    }),
  },
];

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Task status badge ──────────────────────────────────────────────────────────
function TaskCard({ task }: { task: TaskStatusResponse }) {
  const done = task.status === "completed" || task.status === "failed";
  const colour =
    task.status === "completed"
      ? "#4ade80"
      : task.status === "failed"
        ? "#f87171"
        : "#FFD700";
  return (
    <div
      style={{
        marginTop: 8,
        padding: "4px 8px",
        background: "#111",
        borderRadius: 6,
        fontSize: 11,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: colour,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "#666" }}>{task.task_id?.slice(0, 12)}…</span>
      <span style={{ color: colour, fontWeight: 600 }}>{task.status}</span>
      {done && task.logs?.length > 0 && (
        <details style={{ marginLeft: 4 }}>
          <summary style={{ cursor: "pointer", color: "#888", fontSize: 10 }}>
            logs
          </summary>
          <pre style={{ color: "#aaa", marginTop: 4, fontSize: 10 }}>
            {task.logs.join("\n")}
          </pre>
        </details>
      )}
    </div>
  );
}

// ── Markdown render components (dark theme) ──────────────────────────────────
const MD_TABLE: CSSProperties = {
  borderCollapse: "collapse",
  width: "100%",
  marginTop: 8,
  marginBottom: 8,
  fontSize: 12,
};
const MD_TH: CSSProperties = {
  background: "#111",
  color: "#FFD700",
  padding: "4px 8px",
  textAlign: "left",
  fontWeight: 600,
  border: "1px solid #333",
};
const MD_TD: CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #222",
  color: "#ccc",
};
const MD_CODE: CSSProperties = {
  background: "#1a1a1a",
  color: "#4ade80",
  padding: "2px 6px",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "monospace",
};
const MD_PRE: CSSProperties = {
  background: "#0d0d0d",
  border: "1px solid #333",
  borderRadius: 6,
  padding: "10px 12px",
  overflowX: "auto",
  margin: "8px 0",
};
const MD_STRONG: CSSProperties = { color: "#FFD700", fontWeight: 700 };
const MD_P: CSSProperties = { margin: "4px 0", lineHeight: 1.6 };
const MD_LI: CSSProperties = { marginBottom: 2 };
const MD_UL: CSSProperties = { paddingLeft: 18, margin: "4px 0" };

const mdComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <table style={MD_TABLE}>{children}</table>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead>{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => <tr>{children}</tr>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th style={MD_TH}>{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td style={MD_TD}>{children}</td>
  ),
  code: ({
    inline,
    children,
  }: {
    inline?: boolean;
    children?: React.ReactNode;
  }) =>
    inline ? (
      <code style={MD_CODE}>{children}</code>
    ) : (
      <pre style={MD_PRE}>
        <code style={{ ...MD_CODE, background: "none", padding: 0 }}>
          {children}
        </code>
      </pre>
    ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={MD_STRONG}>{children}</strong>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={MD_P}>{children}</p>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li style={MD_LI}>{children}</li>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul style={MD_UL}>{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol style={{ ...MD_UL, listStyleType: "decimal" }}>{children}</ol>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1
      style={{
        color: "#FFD700",
        margin: "8px 0 4px",
        fontSize: 16,
        fontWeight: 700,
      }}
    >
      {children}
    </h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2
      style={{
        color: "#FFD700",
        margin: "8px 0 4px",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3
      style={{
        color: "#FFD700",
        margin: "6px 0 3px",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {children}
    </h3>
  ),
  hr: () => (
    <hr
      style={{ border: "none", borderTop: "1px solid #333", margin: "8px 0" }}
    />
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote
      style={{
        borderLeft: "3px solid #FFD700",
        paddingLeft: 10,
        color: "#aaa",
        margin: "6px 0",
      }}
    >
      {children}
    </blockquote>
  ),
};

// ── Main component ────────────────────────────────────────────────────────────
export default function CommandChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "sys-init",
      role: "system",
      content:
        'XPS Intelligence AI ready. Ask me anything — I can scrape contractors, analyze leads, run audits, or answer questions about your data. Try: "Find epoxy floor contractors in Houston, TX"',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildHistory = (): LLMChatMessage[] =>
    messages
      .filter((m) => m.role !== "system")
      .slice(-20)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

  const addMessage = (msg: Omit<ChatMessage, "id" | "timestamp">) => {
    const full: ChatMessage = { ...msg, id: genId(), timestamp: new Date() };
    setMessages((prev) => [...prev, full]);
    return full.id;
  };

  const updateMessage = (id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = input.trim();
    if (!userText || loading) return;
    setInput("");
    setLoading(true);

    addMessage({ role: "user", content: userText });
    const assistantId = addMessage({ role: "assistant", content: "…" });

    try {
      const history = buildHistory();
      const chatResp = await sendChatMessage(userText, history);

      updateMessage(assistantId, { content: chatResp.reply });

      // Optionally also dispatch a runtime command
      const pattern = COMMAND_PATTERNS.find((p) => p.test(userText));
      if (pattern) {
        const cmd = pattern.build(userText);
        const taskResp = await sendCommand(cmd).catch(() => null);
        if (taskResp?.task_id) {
          const taskId = taskResp.task_id;
          updateMessage(assistantId, {
            taskId,
            taskStatus: { task_id: taskId, status: "queued", logs: [] },
          });
          pollTaskUntilDone(taskId, {
            intervalMs: 2000,
            timeoutMs: 120_000,
            onUpdate: (task) =>
              updateMessage(assistantId, { taskStatus: task }),
          }).catch(() => {
            /* ignore */
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed";
      updateMessage(assistantId, { content: `❌ Error: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#050505",
        border: "1px solid #222",
        borderRadius: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderBottom: "1px solid #1a1a1a",
        }}
      >
        <span style={{ fontSize: 18 }}>🤖</span>
        <h2
          style={{ color: "#FFD700", fontSize: 15, fontWeight: 700, margin: 0 }}
        >
          XPS Intelligence AI Agent
        </h2>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#555" }}>
          Powered by Groq
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "90%",
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                lineHeight: 1.5,
                ...(msg.role === "user"
                  ? {
                      background: "#1a1a00",
                      border: "1px solid #FFD700",
                      color: "#FFD700",
                    }
                  : msg.role === "system"
                    ? {
                        background: "#0a0a0a",
                        border: "1px solid #1a1a1a",
                        color: "#666",
                        fontStyle: "italic",
                        fontSize: 12,
                      }
                    : {
                        background: "#0d0d0d",
                        border: "1px solid #222",
                        color: "#ccc",
                      }),
              }}
            >
              {msg.role === "assistant" ? (
                <div style={{ color: "#ccc" }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={
                      mdComponents as Record<
                        string,
                        React.ComponentType<React.HTMLAttributes<HTMLElement>>
                      >
                    }
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
              )}
              {msg.taskStatus && <TaskCard task={msg.taskStatus} />}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                background: "#0d0d0d",
                border: "1px solid #222",
                color: "#555",
                fontSize: 13,
              }}
            >
              <span style={{ animation: "pulse 1s infinite" }}>
                ⚡ Thinking…
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          borderTop: "1px solid #1a1a1a",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything — scrape leads, analyze data, run audits…"
          disabled={loading}
          style={{
            flex: 1,
            background: "#111",
            border: "1px solid #333",
            borderRadius: 8,
            color: "#fff",
            fontSize: "0.875rem",
            outline: "none",
            padding: "0.5rem 0.75rem",
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? "#333" : "#FFD700",
            border: "none",
            borderRadius: 8,
            color: loading || !input.trim() ? "#666" : "#000",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            padding: "0.5rem 1rem",
            transition: "all 0.15s",
          }}
        >
          {loading ? "⌛" : "➤ Send"}
        </button>
      </form>
    </div>
  );
}
