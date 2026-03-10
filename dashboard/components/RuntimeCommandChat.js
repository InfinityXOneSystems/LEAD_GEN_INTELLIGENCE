// dashboard/components/RuntimeCommandChat.js
// =============================================
// XPS Intelligence – Autonomous LLM Chat Agent
//
// Full capabilities:
//   ✅ Autonomous orchestration (multi-step pipelines)
//   ✅ Autonomous coding (generate/edit/deploy code)
//   ✅ Shadow scraping (background scrape + enrich)
//   ✅ Frontend & backend code/UI editing
//   ✅ Access to all connected accounts (via connectors API)
//   ✅ GitHub sandbox (create branches, PRs, commit code)
//   ✅ Google Workspace (Gmail, Drive, Calendar, Docs, Sheets)
//   ✅ Vercel deploy trigger
//   ✅ Docker MCP commands
//   ✅ Settings sync

import React, { useState, useRef, useEffect, useCallback } from "react";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 120;

function getApiBase() {
  if (typeof window === "undefined") return "http://localhost:8000";
  return process.env.NEXT_PUBLIC_API_URL || window.__NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

// Full set of autonomous capabilities organised by category
const CAPABILITY_GROUPS = [
  {
    label: "🕷️ Scraping",
    cmds: [
      "scrape epoxy contractors in Pompano Beach FL",
      "scrape flooring contractors in Miami FL",
      "shadow scrape — background enrichment run",
    ],
  },
  {
    label: "🤖 Orchestration",
    cmds: [
      "run full pipeline: scrape → score → dedup → outreach",
      "run autonomous seo + outreach campaign",
      "run parallel 4-agent scrape across FL cities",
    ],
  },
  {
    label: "💻 Coding",
    cmds: [
      "generate React lead card component",
      "write Python data enrichment script",
      "create REST API endpoint for lead export",
    ],
  },
  {
    label: "🔌 Accounts",
    cmds: [
      "send outreach email via Gmail",
      "create lead report in Google Sheets",
      "trigger Vercel frontend deploy",
      "push code to GitHub sandbox branch",
    ],
  },
  {
    label: "🎨 UI/Edit",
    cmds: [
      "edit dashboard homepage CSS",
      "generate settings page UI",
      "create business proposal template",
    ],
  },
];

function statusColor(status) {
  return { queued: "#888", running: "#FFD700", completed: "#4ade80", failed: "#f87171", retrying: "#fb923c", pending: "#888" }[status] || "#888";
}

function TaskStatusPanel({ task }) {
  if (!task) return null;
  return (
    <div style={styles.taskPanel}>
      <div style={styles.taskHeader}>
        <span style={{ ...styles.statusDot, background: statusColor(task.status) }} />
        <span style={styles.taskLabel}>Task {task.task_id ? task.task_id.slice(0, 8) : "…"}</span>
        <span style={{ ...styles.statusText, color: statusColor(task.status) }}>{task.status?.toUpperCase()}</span>
      </div>
      {task.agent && <div style={styles.taskMeta}>agent: {task.agent}</div>}
      {task.result && (
        <pre style={styles.taskResult}>{typeof task.result === "string" ? task.result : JSON.stringify(task.result, null, 2)}</pre>
      )}
    </div>
  );
}

function MessageBubble({ msg, onSuggestion }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ ...styles.messageRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && <div style={styles.avatar}>⚡</div>}
      <div style={{
        ...styles.bubble,
        background: isUser ? "#FFD700" : "#111",
        color: isUser ? "#000" : "#fff",
        border: isUser ? "none" : "1px solid #222",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
      }}>
        <pre style={styles.bubbleText}>{msg.content}</pre>
        {msg.taskData && <TaskStatusPanel task={msg.taskData} />}
      </div>
      {isUser && <div style={{ ...styles.avatar, background: "#FFD700", color: "#000" }}>U</div>}
    </div>
  );
}

export default function RuntimeCommandChat({ suggestions = [] }) {
  const [messages, setMessages] = useState([{
    role: "assistant",
    content:
      "👋 Welcome to XPS Intelligence Autonomous Agent!\n\n" +
      "I have full autonomous capabilities:\n" +
      "  🕷️  Shadow scraping — background enrichment\n" +
      "  🤖  Autonomous orchestration — multi-step pipelines\n" +
      "  💻  Coding — generate/edit frontend & backend code\n" +
      "  📬  Outreach — Gmail, Google Sheets, Vercel deploy\n" +
      "  🐙  GitHub — create branches, commit code, trigger Actions\n" +
      "  🐋  Docker MCP — container management\n" +
      "  🔌  All connected accounts via Settings\n\n" +
      "Try a quick command below ↓",
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const [showCaps, setShowCaps] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const pollTask = useCallback(async (taskId, msgIdx) => {
    const apiBase = getApiBase();
    let attempts = 0;
    const tick = async () => {
      if (attempts >= MAX_POLL_ATTEMPTS) {
        setMessages((prev) => {
          const next = [...prev];
          if (next[msgIdx]) next[msgIdx] = { ...next[msgIdx], taskData: { ...next[msgIdx].taskData, status: "failed", error: "Polling timeout" } };
          return next;
        });
        return;
      }
      attempts++;
      try {
        const resp = await fetch(`${apiBase}/api/v1/runtime/task/${taskId}`);
        if (!resp.ok) { setTimeout(tick, POLL_INTERVAL_MS); return; }
        const data = await resp.json();
        setMessages((prev) => {
          const next = [...prev];
          if (next[msgIdx]) next[msgIdx] = { ...next[msgIdx], taskData: data };
          return next;
        });
        if (!["completed", "failed"].includes(data.status)) { setTimeout(tick, POLL_INTERVAL_MS); }
        else { setLoading(false); }
      } catch { setTimeout(tick, POLL_INTERVAL_MS); }
    };
    tick();
  }, []);

  const sendCommand = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    const apiBase = getApiBase();

    // Handle special local commands
    if (msg === "help" || msg === "?") {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "🤖 XPS Agent Commands:\n\nscrape <type> in <city> <state>\nrun seo analysis on <url>\nrun outreach campaign\nexport leads\ngenerate <code/ui/report>\nsend email via gmail\ncreate sheet in google sheets\ntrigger vercel deploy\npush to github <branch>\ndocker list containers\nrun full pipeline\nstatus\nhelp",
      }]);
      setLoading(false);
      return;
    }

    if (msg === "status") {
      try {
        const r = await fetch(`${apiBase}/health`);
        const d = await r.json();
        setMessages((prev) => [...prev, { role: "assistant", content: `🟢 System Status\n\n${JSON.stringify(d, null, 2)}` }]);
      } catch (e) {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ Backend unreachable: ${e.message}` }]);
      }
      setLoading(false);
      return;
    }

    // Route account actions through connectors
    if (msg.toLowerCase().includes("gmail") || msg.toLowerCase().includes("send email")) {
      try {
        const r = await fetch(`${apiBase}/api/v1/connectors/google/workspace`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service: "gmail", action: "send", payload: { command: msg } }),
        });
        const d = await r.json();
        setMessages((prev) => [...prev, { role: "assistant", content: `📧 Gmail: ${d.message || JSON.stringify(d)}` }]);
      } catch (e) {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ Gmail error: ${e.message}` }]);
      }
      setLoading(false);
      return;
    }

    if (msg.toLowerCase().includes("vercel deploy") || msg.toLowerCase().includes("trigger deploy")) {
      try {
        const r = await fetch(`${apiBase}/api/v1/connectors/vercel/deploy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        const d = await r.json();
        setMessages((prev) => [...prev, { role: "assistant", content: `▲ Vercel: ${d.message}\n\nWebhook: prj_eNK90PC48eWsMW3O6aHHRWsM4wwI\nStatus: ${d.success ? "✅ Triggered" : "❌ Failed"}` }]);
      } catch (e) {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ Vercel deploy error: ${e.message}` }]);
      }
      setLoading(false);
      return;
    }

    if (msg.toLowerCase().includes("docker")) {
      try {
        const r = await fetch(`${apiBase}/api/v1/connectors/docker/action`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "list", payload: { command: msg } }),
        });
        const d = await r.json();
        setMessages((prev) => [...prev, { role: "assistant", content: `🐋 Docker: ${d.message || JSON.stringify(d)}` }]);
      } catch (e) {
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ Docker MCP error: ${e.message}` }]);
      }
      setLoading(false);
      return;
    }

    // Default: send to runtime command API
    try {
      const resp = await fetch(`${apiBase}/api/v1/runtime/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: msg, priority: 5 }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ detail: resp.statusText }));
        setMessages((prev) => [...prev, { role: "assistant", content: `❌ Error: ${typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)}` }]);
        setLoading(false);
        return;
      }
      const data = await resp.json();
      const taskId = data.task_id;
      setMessages((prev) => {
        const msgIdx = prev.length;
        setTimeout(() => pollTask(taskId, msgIdx), 500);
        return [...prev, {
          role: "assistant",
          content: `✅ Command accepted\nAgent: ${data.agent || data.command_type}\nTask ID: ${taskId}`,
          taskData: { task_id: taskId, status: data.status || "queued", agent: data.agent },
        }];
      });
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ Connection error: ${err.message}\n\nMake sure the backend is running on ${apiBase}` }]);
      setLoading(false);
    }
  }, [input, loading, pollTask]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendCommand(); }
  };

  return (
    <div style={styles.container}>
      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((m, i) => <MessageBubble key={i} msg={m} onSuggestion={sendCommand} />)}
        {loading && (
          <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
            <div style={styles.avatar}>⚡</div>
            <div style={{ ...styles.bubble, background: "#111", border: "1px solid #222" }}>
              <span style={styles.typing}>●●●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Capability Groups */}
      <div style={styles.capBar}>
        <button style={styles.capToggle} onClick={() => setShowCaps((v) => !v)}>
          {showCaps ? "▾ Commands" : "▸ Commands"}
        </button>
        {showCaps && (
          <>
            <div style={styles.groupTabs}>
              {CAPABILITY_GROUPS.map((g, i) => (
                <button key={i} style={{ ...styles.groupTab, ...(activeGroup === i ? styles.groupTabActive : {}) }} onClick={() => setActiveGroup(i)}>
                  {g.label}
                </button>
              ))}
            </div>
            <div style={styles.cmdRow}>
              {CAPABILITY_GROUPS[activeGroup].cmds.map((cmd) => (
                <button key={cmd} style={styles.chip} onClick={() => sendCommand(cmd)}>{cmd}</button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Input */}
      <div style={styles.inputRow}>
        <textarea
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type any command… (Enter to send)"
          rows={2}
          disabled={loading}
        />
        <button style={{ ...styles.sendBtn, opacity: loading ? 0.5 : 1 }} onClick={() => sendCommand()} disabled={loading}>➤</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = {
  container: { display: "flex", flexDirection: "column", height: "100%", background: "#000", color: "#fff", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  messages: { flex: 1, overflowY: "auto", padding: "1rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" },
  messageRow: { display: "flex", alignItems: "flex-end", gap: "0.5rem", marginBottom: "0.5rem" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#1a1a1a", border: "1px solid #FFD700", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 },
  bubble: { padding: "0.75rem 1rem", maxWidth: "75%" },
  bubbleText: { margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem" },
  typing: { color: "#FFD700", letterSpacing: "0.15em" },
  capBar: { borderTop: "1px solid #111", padding: "0.5rem 1rem", background: "#0a0a0a", display: "flex", flexDirection: "column", gap: "0.5rem" },
  capToggle: { background: "transparent", border: "none", color: "#555", cursor: "pointer", fontSize: "0.8rem", textAlign: "left", padding: "0" },
  groupTabs: { display: "flex", gap: "0.3rem", flexWrap: "wrap" },
  groupTab: { background: "transparent", border: "1px solid #222", color: "#555", padding: "0.2rem 0.6rem", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" },
  groupTabActive: { background: "#1a1a1a", color: "#FFD700", borderColor: "#FFD700" },
  cmdRow: { display: "flex", gap: "0.4rem", flexWrap: "wrap" },
  chip: { background: "transparent", border: "1px solid #333", borderRadius: "20px", color: "#888", padding: "0.3rem 0.75rem", fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit" },
  inputRow: { display: "flex", gap: "0.75rem", padding: "1rem 1.5rem", borderTop: "1px solid #1a1a1a", background: "#0a0a0a", alignItems: "flex-end" },
  input: { flex: 1, background: "#111", border: "1px solid #333", borderRadius: "12px", color: "#fff", padding: "0.75rem 1rem", fontSize: "0.9rem", fontFamily: "inherit", resize: "none", outline: "none", lineHeight: 1.5 },
  sendBtn: { background: "#FFD700", border: "none", borderRadius: "12px", color: "#000", width: "48px", height: "48px", fontSize: "1.2rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  taskPanel: { marginTop: "0.75rem", background: "#0d0d0d", border: "1px solid #222", borderRadius: "8px", padding: "0.75rem", fontSize: "0.8rem" },
  taskHeader: { display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.4rem" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  taskLabel: { color: "#888", flex: 1 },
  statusText: { fontWeight: 700, fontSize: "0.7rem" },
  taskMeta: { color: "#666", marginBottom: "0.4rem" },
  taskResult: { background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: "4px", padding: "0.5rem", color: "#4ade80", fontSize: "0.75rem", maxHeight: "200px", overflowY: "auto", margin: 0, whiteSpace: "pre-wrap" },
};
