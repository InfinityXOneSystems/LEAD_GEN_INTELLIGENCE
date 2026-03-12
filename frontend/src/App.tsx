import { useState, useEffect } from "react";
import CommandChat from "./components/CommandChat";
import TaskStatusPanel from "./components/TaskStatusPanel";
import AgentActivityFeed from "./components/AgentActivityFeed";
import { apiClient } from "./lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BackendStatus {
  status: string;
  service?: string;
  uptime?: number;
}

// ── Status Bar ────────────────────────────────────────────────────────────────

function StatusBar({ backendUrl }: { backendUrl: string }) {
  const [status, setStatus] = useState<"checking" | "healthy" | "degraded">("checking");
  const [details, setDetails] = useState<BackendStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await apiClient.get<BackendStatus>("/api/health");
        if (!mounted) return;
        setStatus("healthy");
        setDetails(res.data);
      } catch {
        if (!mounted) return;
        setStatus("degraded");
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const dotColour =
    status === "healthy"
      ? "#00ff88"
      : status === "degraded"
        ? "#ff4444"
        : "#ffaa00";

  const label =
    status === "healthy"
      ? "Backend: HEALTHY"
      : status === "degraded"
        ? "Backend: DEGRADED"
        : "Backend: Checking…";

  return (
    <div style={styles.statusBar}>
      <span style={{ ...styles.dot, background: dotColour }} />
      <span style={styles.statusLabel}>{label}</span>
      {details?.uptime !== undefined && (
        <span style={styles.statusMeta}>
          Uptime: {Math.round(details.uptime)}s
        </span>
      )}
      <span style={styles.statusMeta}>{backendUrl}</span>
    </div>
  );
}

// ── Module Nav ────────────────────────────────────────────────────────────────

const MODULES = [
  { id: "chat", label: "💬 Chat Agent", desc: "Autonomous runtime commands" },
  { id: "leads", label: "📋 Leads", desc: "Scraped leads dashboard" },
  { id: "activity", label: "🤖 Agent Activity", desc: "Live agent feed" },
  { id: "status", label: "📊 Task Status", desc: "Monitor running tasks" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

// ── Leads Panel ───────────────────────────────────────────────────────────────

interface Lead {
  id?: string;
  name?: string;
  company_name?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
  website?: string;
  lead_score?: number;
  tier?: string;
}

function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        const res = await apiClient.get<{ data: Lead[] } | Lead[]>("/api/leads");
        if (!mounted) return;
        const list = Array.isArray(res.data)
          ? res.data
          : (res.data as { data: Lead[] }).data ?? [];
        setLeads(list.slice(0, 50));
      } catch (err: unknown) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load leads");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <p style={{ color: "#888", padding: "2rem" }}>Loading leads…</p>;
  }
  if (error) {
    return (
      <div style={{ color: "#ff4444", padding: "1rem", background: "#1a0000", borderRadius: 8 }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {["Company", "City", "Phone", "Email", "Score", "Tier"].map((h) => (
              <th key={h} style={styles.th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ ...styles.td, textAlign: "center", color: "#888" }}>
                No leads found. Run a scraper to populate leads.
              </td>
            </tr>
          ) : (
            leads.map((l, i) => (
              <tr key={l.id ?? i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                <td style={styles.td}>{l.name || l.company_name || "—"}</td>
                <td style={styles.td}>{l.city && l.state ? `${l.city}, ${l.state}` : l.city || "—"}</td>
                <td style={styles.td}>{l.phone || "—"}</td>
                <td style={styles.td}>
                  {l.email ? (
                    <a href={`mailto:${l.email}`} style={{ color: "#FFD700" }}>
                      {l.email}
                    </a>
                  ) : "—"}
                </td>
                <td style={{ ...styles.td, textAlign: "center" }}>{l.lead_score ?? "—"}</td>
                <td style={{ ...styles.td, textAlign: "center" }}>
                  <span style={{
                    background: l.tier === "HOT" ? "#ff4400" : l.tier === "WARM" ? "#ff8800" : "#333",
                    color: "#fff",
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 11,
                  }}>
                    {l.tier || "—"}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Task Demo Panel ───────────────────────────────────────────────────────────

function TaskStatusDemo() {
  const [taskId, setTaskId] = useState("");
  const [input, setInput] = useState("");

  return (
    <div style={{ padding: "1rem" }}>
      <p style={{ color: "#888", marginBottom: "1rem" }}>
        Enter a task ID to poll its status:
      </p>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Task ID (e.g. gw-abc123)"
          style={styles.input}
        />
        <button
          onClick={() => setTaskId(input.trim())}
          disabled={!input.trim()}
          style={styles.button}
        >
          Poll
        </button>
      </div>
      {taskId && (
        <TaskStatusPanel
          taskId={taskId}
          onComplete={(t) => console.log("Task complete:", t)}
        />
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

const API_URL =
  typeof import.meta !== "undefined"
    ? ((import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? "")
    : "";

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("chat");

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.title}>⚡ XPS Intelligence Platform</h1>
          <p style={styles.subtitle}>
            Autonomous Lead Generation &amp; AI Control System
          </p>
        </div>
        <StatusBar backendUrl={API_URL || "https://xpsintelligencesystem-production.up.railway.app"} />
      </header>

      {/* Nav */}
      <nav style={styles.nav}>
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveModule(m.id)}
            style={{
              ...styles.navBtn,
              ...(activeModule === m.id ? styles.navBtnActive : {}),
            }}
            aria-current={activeModule === m.id ? "page" : undefined}
          >
            {m.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={styles.main}>
        {activeModule === "chat" && (
          <div style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
            <CommandChat />
          </div>
        )}
        {activeModule === "leads" && <LeadsPanel />}
        {activeModule === "activity" && (
          <div style={{ height: "calc(100vh - 220px)", minHeight: 400 }}>
            <AgentActivityFeed refreshIntervalMs={5000} maxEntries={100} />
          </div>
        )}
        {activeModule === "status" && <TaskStatusDemo />}
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: "#000",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  header: {
    background: "#0a0a0a",
    borderBottom: "1px solid #222",
    padding: "1.25rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
  },
  headerInner: {},
  title: {
    color: "#FFD700",
    fontSize: "1.75rem",
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    color: "#666",
    fontSize: "0.875rem",
    margin: "0.25rem 0 0",
  },
  statusBar: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.8rem",
    color: "#aaa",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    display: "inline-block",
    flexShrink: 0,
  },
  statusLabel: {
    fontWeight: 600,
    color: "#ccc",
  },
  statusMeta: {
    color: "#555",
    fontSize: "0.75rem",
  },
  nav: {
    display: "flex",
    gap: "0.25rem",
    padding: "0.75rem 2rem",
    background: "#050505",
    borderBottom: "1px solid #1a1a1a",
    overflowX: "auto",
  },
  navBtn: {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#888",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 500,
    padding: "0.5rem 1rem",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  navBtnActive: {
    background: "#1a1a00",
    borderColor: "#FFD700",
    color: "#FFD700",
  },
  main: {
    padding: "1.5rem 2rem",
    maxWidth: 1400,
    margin: "0 auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.875rem",
  },
  th: {
    background: "#111",
    color: "#FFD700",
    padding: "0.625rem 1rem",
    textAlign: "left",
    fontWeight: 600,
    borderBottom: "1px solid #333",
  },
  td: {
    padding: "0.5rem 1rem",
    borderBottom: "1px solid #111",
    color: "#ccc",
  },
  trEven: { background: "#050505" },
  trOdd: { background: "#000" },
  input: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: 8,
    color: "#fff",
    flex: 1,
    fontSize: "0.875rem",
    outline: "none",
    padding: "0.5rem 0.75rem",
  },
  button: {
    background: "#FFD700",
    border: "none",
    borderRadius: 8,
    color: "#000",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: 600,
    padding: "0.5rem 1rem",
  },
};
