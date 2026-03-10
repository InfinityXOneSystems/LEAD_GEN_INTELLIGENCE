// dashboard/components/RuntimeCommandChat.js
// =============================================
// XPS Intelligence – Runtime Command Chat Component
//
// Wires the chat UI directly to the backend runtime API:
//   POST  /api/v1/runtime/command   — submit a natural-language command
//   GET   /api/v1/runtime/task/{id} — poll for result/logs
//
// Designed for Next.js (pages router) with zero external dependencies.

import React, { useState, useRef, useEffect, useCallback } from "react";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 120; // 3 minutes max

function getApiBase() {
  if (typeof window === "undefined") return "http://localhost:8000";
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    window.__NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  );
}

// ---------------------------------------------------------------------------
// Helper: status badge colour
// ---------------------------------------------------------------------------
function statusColor(status) {
  const map = {
    queued: "#888",
    running: "#FFD700",
    completed: "#4ade80",
    failed: "#f87171",
    retrying: "#fb923c",
    pending: "#888",
  };
  return map[status] || "#888";
}

// ---------------------------------------------------------------------------
// TaskStatusPanel – inline progress display for a single task
// ---------------------------------------------------------------------------
function TaskStatusPanel({ task }) {
  if (!task) return null;
  return (
    <div style={styles.taskPanel}>
      <div style={styles.taskHeader}>
        <span
          style={{
            ...styles.statusDot,
            background: statusColor(task.status),
          }}
        />
        <span style={styles.taskLabel}>
          Task {task.task_id ? task.task_id.slice(0, 8) : "…"}
        </span>
        <span style={{ ...styles.statusText, color: statusColor(task.status) }}>
          {task.status?.toUpperCase()}
        </span>
      </div>

      {task.command_type && (
        <div style={styles.taskMeta}>
          Agent: <strong>{task.agent || task.command_type}</strong>
        </div>
      )}

      {task.logs && task.logs.length > 0 && (
        <div style={styles.logBox}>
          {task.logs.map((line, i) => (
            <div key={i} style={styles.logLine}>
              {line}
            </div>
          ))}
        </div>
      )}

      {task.result && (
        <pre style={styles.resultBox}>
          {typeof task.result === "string"
            ? task.result
            : JSON.stringify(task.result, null, 2)}
        </pre>
      )}

      {task.error && <div style={styles.errorBox}>⚠ {task.error}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble
// ---------------------------------------------------------------------------
function MessageBubble({ msg, onSuggestion }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        ...styles.messageRow,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      {!isUser && <div style={styles.avatar}>⚡</div>}
      <div
        style={{
          ...styles.bubble,
          background: isUser ? "#FFD700" : "#111",
          color: isUser ? "#000" : "#fff",
          border: isUser ? "none" : "1px solid #222",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        }}
      >
        <pre style={styles.bubbleText}>{msg.content}</pre>
        {msg.taskData && <TaskStatusPanel task={msg.taskData} />}
      </div>
      {isUser && (
        <div style={{ ...styles.avatar, background: "#FFD700", color: "#000" }}>
          U
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RuntimeCommandChat – main exported component
// ---------------------------------------------------------------------------
export default function RuntimeCommandChat({ suggestions = [] }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Welcome to **XPS Intelligence**!\n\n" +
        "I'm wired directly to the backend runtime.\n\n" +
        "Try:\n" +
        '• "scrape epoxy contractors in Orlando FL"\n' +
        '• "run seo analysis on example.com"\n' +
        '• "status"\n' +
        '• "help"',
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ------------------------------------------------------------------
  // Poll task until terminal state
  // ------------------------------------------------------------------
  const pollTask = useCallback(async (taskId, msgIdx) => {
    const apiBase = getApiBase();
    let attempts = 0;

    const tick = async () => {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setMessages((prev) => {
          const next = [...prev];
          if (next[msgIdx]) {
            next[msgIdx] = {
              ...next[msgIdx],
              taskData: {
                ...next[msgIdx].taskData,
                status: "failed",
                error: "Polling timeout",
              },
            };
          }
          return next;
        });
        return;
      }
      attempts++;

      try {
        const resp = await fetch(`${apiBase}/api/v1/runtime/task/${taskId}`);
        if (!resp.ok) {
          setTimeout(tick, POLL_INTERVAL_MS);
          return;
        }
        const data = await resp.json();

        setMessages((prev) => {
          const next = [...prev];
          if (next[msgIdx]) {
            next[msgIdx] = { ...next[msgIdx], taskData: data };
          }
          return next;
        });

        const terminal = ["completed", "failed"].includes(data.status);
        if (!terminal) {
          setTimeout(tick, POLL_INTERVAL_MS);
        } else {
          setLoading(false);
        }
      } catch {
        setTimeout(tick, POLL_INTERVAL_MS);
      }
    };

    tick();
  }, []);

  // ------------------------------------------------------------------
  // Send a command to the runtime API
  // ------------------------------------------------------------------
  const sendCommand = useCallback(
    async (text) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: msg }]);
      setLoading(true);

      const apiBase = getApiBase();

      try {
        const resp = await fetch(`${apiBase}/api/v1/runtime/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: msg, priority: 5 }),
        });

        if (!resp.ok) {
          const err = await resp
            .json()
            .catch(() => ({ detail: resp.statusText }));
          const errMsg =
            typeof err.detail === "string"
              ? err.detail
              : JSON.stringify(err.detail, null, 2);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: `❌ Error: ${errMsg}` },
          ]);
          setLoading(false);
          return;
        }

        const data = await resp.json();
        const taskId = data.task_id;

        // Insert a placeholder message that will be updated by polling
        const assistantContent =
          `✅ Command accepted\n` +
          `Agent: ${data.agent || data.command_type}\n` +
          `Task ID: ${taskId}`;

        setMessages((prev) => {
          const msgIdx = prev.length;
          // Start polling using the index we're about to insert
          setTimeout(() => pollTask(taskId, msgIdx), 500);
          return [
            ...prev,
            {
              role: "assistant",
              content: assistantContent,
              taskData: { task_id: taskId, status: data.status || "queued" },
            },
          ];
        });
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              `❌ Connection error: ${err.message}\n\n` +
              `Make sure the backend is running on ${apiBase}`,
          },
        ]);
        setLoading(false);
      }
    },
    [input, loading, pollTask],
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCommand();
    }
  };

  return (
    <div style={styles.container}>
      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((m, i) => (
          <MessageBubble key={i} msg={m} onSuggestion={sendCommand} />
        ))}
        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div style={styles.avatar}>⚡</div>
            <div
              style={{
                ...styles.bubble,
                background: "#111",
                border: "1px solid #222",
              }}
            >
              <span style={styles.typing}>●●●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      {suggestions.length > 0 && (
        <div style={styles.quickSuggestions}>
          {suggestions.map((s) => (
            <button key={s} style={styles.chip} onClick={() => sendCommand(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={styles.inputRow}>
        <textarea
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a command… (Enter to send, Shift+Enter for new line)"
          rows={2}
          disabled={loading}
        />
        <button
          style={{ ...styles.sendBtn, opacity: loading ? 0.5 : 1 }}
          onClick={() => sendCommand()}
          disabled={loading}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "#000",
    color: "#fff",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "1rem 1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#1a1a1a",
    border: "1px solid #FFD700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.85rem",
    flexShrink: 0,
  },
  bubble: {
    padding: "0.75rem 1rem",
    maxWidth: "75%",
  },
  bubbleText: {
    margin: 0,
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    fontSize: "0.9rem",
  },
  typing: {
    color: "#FFD700",
    letterSpacing: "0.15em",
  },
  quickSuggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    padding: "0.5rem 1.5rem",
    borderTop: "1px solid #111",
  },
  chip: {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "20px",
    color: "#888",
    padding: "0.3rem 0.75rem",
    fontSize: "0.75rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  inputRow: {
    display: "flex",
    gap: "0.75rem",
    padding: "1rem 1.5rem",
    borderTop: "1px solid #1a1a1a",
    background: "#0a0a0a",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    background: "#111",
    border: "1px solid #333",
    borderRadius: "12px",
    color: "#fff",
    padding: "0.75rem 1rem",
    fontSize: "0.9rem",
    fontFamily: "inherit",
    resize: "none",
    outline: "none",
    lineHeight: 1.5,
  },
  sendBtn: {
    background: "#FFD700",
    border: "none",
    borderRadius: "12px",
    color: "#000",
    width: "48px",
    height: "48px",
    fontSize: "1.2rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  // Task panel
  taskPanel: {
    marginTop: "0.75rem",
    background: "#0d0d0d",
    border: "1px solid #222",
    borderRadius: "8px",
    padding: "0.75rem",
    fontSize: "0.8rem",
  },
  taskHeader: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
    marginBottom: "0.4rem",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  taskLabel: {
    color: "#888",
    flex: 1,
  },
  statusText: {
    fontWeight: 700,
    fontSize: "0.7rem",
  },
  taskMeta: {
    color: "#666",
    marginBottom: "0.4rem",
  },
  logBox: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "4px",
    padding: "0.5rem",
    maxHeight: "120px",
    overflowY: "auto",
    marginBottom: "0.4rem",
  },
  logLine: {
    color: "#888",
    fontFamily: "monospace",
    fontSize: "0.75rem",
    lineHeight: 1.4,
  },
  resultBox: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "4px",
    padding: "0.5rem",
    color: "#4ade80",
    fontSize: "0.75rem",
    maxHeight: "200px",
    overflowY: "auto",
    margin: 0,
  },
  errorBox: {
    color: "#f87171",
    padding: "0.4rem 0",
  },
};
