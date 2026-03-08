// dashboard/pages/chat.js
// ========================
// XPS Intelligence – Chat Interface
// Natural-language control plane for the entire system.

import React, { useState, useRef, useEffect, useCallback } from "react";

const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "http://localhost:8000";

const SUGGESTIONS = [
  "scrape epoxy contractors in Orlando FL",
  "export leads",
  "run outreach campaign",
  "push to github",
  "create lead analytics dashboard",
  "status",
  "help",
];

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.75rem",
        alignItems: "flex-end",
        gap: "0.5rem",
      }}
    >
      {!isUser && (
        <div style={styles.avatar}>⚡</div>
      )}
      <div
        style={{
          ...styles.bubble,
          background: isUser ? "#FFD700" : "#111",
          color: isUser ? "#000" : "#fff",
          border: isUser ? "none" : "1px solid #222",
          maxWidth: "75%",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        }}
      >
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem" }}>
          {msg.content}
        </pre>
        {msg.suggestions && msg.suggestions.length > 0 && (
          <div style={styles.suggestions}>
            {msg.suggestions.map((s) => (
              <button
                key={s}
                style={styles.suggestionChip}
                onClick={() => msg.onSuggestion && msg.onSuggestion(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div style={{ ...styles.avatar, background: "#FFD700", color: "#000" }}>U</div>
      )}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Welcome to **XPS Intelligence**!\n\nI'm your autonomous AI assistant. I can:\n\n" +
        "• Scrape contractor leads from Google Maps, Bing, Yelp\n" +
        "• Validate and score leads automatically\n" +
        "• Run outreach campaigns\n" +
        "• Generate code and modify APIs\n" +
        "• Push changes to GitHub\n\n" +
        "Type `help` to see all commands, or just tell me what you need.",
      suggestions: ["scrape epoxy contractors in Tampa FL", "status", "export leads"],
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text) => {
      const msg = text || input.trim();
      if (!msg || loading) return;

      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: msg }]);
      setLoading(true);

      try {
        // Try streaming first
        const streamUrl = `${API_URL}/agent/stream?message=${encodeURIComponent(msg)}`;
        const evtSource = new EventSource(streamUrl);
        let streamedText = "";
        let streamMsgIdx = null;
        setStreaming(true);

        evtSource.onmessage = (e) => {
          if (e.data === "[DONE]") {
            evtSource.close();
            setStreaming(false);
            setLoading(false);
            return;
          }
          try {
            const chunk = JSON.parse(e.data);
            if (chunk.error) {
              evtSource.close();
              setStreaming(false);
              setLoading(false);
              fallbackSend(msg);
              return;
            }
            streamedText += chunk.chunk || "";
            setMessages((prev) => {
              const next = [...prev];
              if (streamMsgIdx === null) {
                streamMsgIdx = next.length;
                next.push({ role: "assistant", content: streamedText });
              } else {
                next[streamMsgIdx] = { role: "assistant", content: streamedText };
              }
              return next;
            });
          } catch {
            // ignore parse errors
          }
        };

        evtSource.onerror = () => {
          evtSource.close();
          setStreaming(false);
          if (!streamedText) {
            fallbackSend(msg);
          } else {
            setLoading(false);
          }
        };
      } catch {
        fallbackSend(msg);
      }
    },
    [input, loading]
  );

  const fallbackSend = async (msg) => {
    try {
      const res = await fetch(`${API_URL}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || JSON.stringify(data, null, 2),
          suggestions: data.suggestions || [],
          onSuggestion: sendMessage,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `❌ Connection error: ${err.message}\n\nMake sure the backend is running on ${API_URL}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⚡ XPS Intelligence</span>
        <div style={styles.headerLinks}>
          <a href="/" style={styles.navLink}>Home</a>
          <a href="/leads" style={styles.navLink}>Leads</a>
          <a href="/analytics" style={styles.navLink}>Analytics</a>
          <a href="/settings" style={styles.navLink}>Settings</a>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messages}>
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            msg={{
              ...m,
              onSuggestion: sendMessage,
            }}
          />
        ))}
        {loading && !streaming && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "0.75rem" }}>
            <div style={styles.avatar}>⚡</div>
            <div style={{ ...styles.bubble, background: "#111", border: "1px solid #222" }}>
              <span style={styles.typing}>●●●</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick suggestions */}
      <div style={styles.quickSuggestions}>
        {SUGGESTIONS.map((s) => (
          <button key={s} style={styles.suggestionChip} onClick={() => sendMessage(s)}>
            {s}
          </button>
        ))}
      </div>

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
          onClick={() => sendMessage()}
          disabled={loading}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#000",
    minHeight: "100vh",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "#0a0a0a",
    borderBottom: "1px solid #1a1a1a",
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  logo: {
    color: "#FFD700",
    fontWeight: 700,
    fontSize: "1.1rem",
  },
  headerLinks: {
    display: "flex",
    gap: "1.25rem",
  },
  navLink: {
    color: "#888",
    textDecoration: "none",
    fontSize: "0.875rem",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
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
  },
  suggestions: {
    marginTop: "0.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
  },
  typing: {
    color: "#FFD700",
    letterSpacing: "0.15em",
    animation: "pulse 1s infinite",
  },
  quickSuggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem",
    padding: "0.5rem 1.5rem",
    borderTop: "1px solid #111",
  },
  suggestionChip: {
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
};
