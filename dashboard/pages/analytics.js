// dashboard/pages/analytics.js
// ==============================
// XPS Intelligence – Analytics Dashboard

import React, { useState, useEffect } from "react";
import Link from "next/link";

const API_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
    : "http://localhost:8000";

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState(null);
  const [tasks, setTasks] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/v1/system/metrics`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${API_URL}/api/v1/system/tasks`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${API_URL}/health`)
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([m, t, h]) => {
      setMetrics(m);
      setTasks(t);
      setHealth(h);
      setLoading(false);
    });
  }, []);

  const refresh = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/v1/system/metrics`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${API_URL}/api/v1/system/tasks`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${API_URL}/health`)
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([m, t, h]) => {
      setMetrics(m);
      setTasks(t);
      setHealth(h);
      setLoading(false);
    });
  };

  const taskList = tasks?.tasks ? Object.values(tasks.tasks) : [];
  const completed = taskList.filter((t) => t.status === "completed").length;
  const failed = taskList.filter((t) => t.status === "failed").length;
  const queued = taskList.filter((t) => t.status === "queued").length;

  return (
    <div style={S.page}>
      <div style={S.header}>
        <span style={S.logo}>⚡ XPS Intelligence</span>
        <div style={S.headerLinks}>
          <Link href="/" style={S.navLink}>
            Home
          </Link>
          <Link href="/chat" style={S.navLink}>
            Chat
          </Link>
          <Link href="/leads" style={S.navLink}>
            Leads
          </Link>
          <Link href="/workspace" style={S.navLink}>
            Workspace
          </Link>
          <Link href="/settings" style={S.navLink}>
            Settings
          </Link>
        </div>
      </div>

      <div style={S.content}>
        <div style={S.titleRow}>
          <h1 style={S.title}>📊 Analytics Dashboard</h1>
          <button style={S.refreshBtn} onClick={refresh}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div style={S.loading}>Loading metrics…</div>
        ) : (
          <>
            {/* Health Status */}
            <div style={S.section}>
              <h2 style={S.sectionTitle}>🏥 System Health</h2>
              <div style={S.statGrid}>
                <StatCard
                  label="Status"
                  value={health?.status || "—"}
                  color={health?.status === "healthy" ? "#4ade80" : "#f87171"}
                />
                <StatCard
                  label="Service"
                  value={health?.service || "—"}
                  color="#7dd3fc"
                />
                <StatCard
                  label="Version"
                  value={health?.version || "—"}
                  color="#c4b5fd"
                />
                <StatCard
                  label="Workers"
                  value={metrics?.workers?.alive ?? "—"}
                  color="#fbbf24"
                />
              </div>
            </div>

            {/* Task Stats */}
            <div style={S.section}>
              <h2 style={S.sectionTitle}>⚙️ Task Execution</h2>
              <div style={S.statGrid}>
                <StatCard
                  label="Total Tasks"
                  value={tasks?.total ?? 0}
                  color="#FFD700"
                />
                <StatCard label="Completed" value={completed} color="#4ade80" />
                <StatCard label="Queued" value={queued} color="#7dd3fc" />
                <StatCard label="Failed" value={failed} color="#f87171" />
              </div>
            </div>

            {/* Queue Metrics */}
            {metrics?.queue && (
              <div style={S.section}>
                <h2 style={S.sectionTitle}>📬 Queue Status</h2>
                <div style={S.statGrid}>
                  <StatCard
                    label="Queue Total"
                    value={metrics.queue.total ?? 0}
                    color="#a78bfa"
                  />
                  {Object.entries(metrics.queue.queues || {}).map(
                    ([q, cnt]) => (
                      <StatCard
                        key={q}
                        label={`Queue: ${q}`}
                        value={cnt}
                        color="#fb923c"
                      />
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Recent Tasks Table */}
            {taskList.length > 0 && (
              <div style={S.section}>
                <h2 style={S.sectionTitle}>📋 Recent Tasks</h2>
                <div style={S.tableWrapper}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        {["Task ID", "Agent", "Type", "Status", "Created"].map(
                          (h) => (
                            <th key={h} style={S.th}>
                              {h}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {taskList
                        .slice(-10)
                        .reverse()
                        .map((t) => (
                          <tr key={t.task_id} style={S.tr}>
                            <td style={S.td}>
                              <code>{t.task_id?.slice(0, 8)}</code>
                            </td>
                            <td style={S.td}>{t.agent || "—"}</td>
                            <td style={S.td}>{t.command_type || "—"}</td>
                            <td
                              style={{
                                ...S.td,
                                color:
                                  t.status === "completed"
                                    ? "#4ade80"
                                    : t.status === "failed"
                                      ? "#f87171"
                                      : "#fbbf24",
                              }}
                            >
                              {t.status}
                            </td>
                            <td style={S.td}>
                              {t.created_at
                                ? new Date(t.created_at).toLocaleTimeString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={S.card}>
      <div style={{ ...S.cardValue, color }}>{value}</div>
      <div style={S.cardLabel}>{label}</div>
    </div>
  );
}

const S = {
  page: {
    background: "#000",
    minHeight: "100vh",
    color: "#fff",
    fontFamily: "'Segoe UI',system-ui,sans-serif",
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
  logo: { color: "#FFD700", fontWeight: 700, fontSize: "1.1rem" },
  headerLinks: { display: "flex", gap: "1.25rem" },
  navLink: { color: "#888", textDecoration: "none", fontSize: "0.875rem" },
  content: { padding: "1.5rem 2rem", maxWidth: "1200px", margin: "0 auto" },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: { color: "#FFD700", fontSize: "1.75rem", fontWeight: 800, margin: 0 },
  refreshBtn: {
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#aaa",
    padding: "0.5rem 1rem",
    borderRadius: "6px",
    cursor: "pointer",
  },
  loading: { color: "#666", fontSize: "1.1rem", padding: "2rem" },
  section: { marginBottom: "2rem" },
  sectionTitle: {
    color: "#888",
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "1rem",
    letterSpacing: "0.05em",
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))",
    gap: "1rem",
  },
  card: {
    background: "#0a0a0a",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    padding: "1.25rem",
    textAlign: "center",
  },
  cardValue: { fontSize: "2rem", fontWeight: 800 },
  cardLabel: {
    color: "#555",
    fontSize: "0.8rem",
    marginTop: "0.25rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" },
  th: {
    background: "#0a0a0a",
    color: "#666",
    padding: "0.6rem 1rem",
    textAlign: "left",
    borderBottom: "1px solid #1a1a1a",
    fontSize: "0.75rem",
    textTransform: "uppercase",
  },
  td: { padding: "0.6rem 1rem", borderBottom: "1px solid #111", color: "#ccc" },
  tr: { "&:hover": { background: "#0a0a0a" } },
};
