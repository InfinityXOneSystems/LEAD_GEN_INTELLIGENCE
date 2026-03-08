// dashboard/pages/settings.js
// ============================
// XPS Intelligence – Settings Control Panel

import React, { useState, useEffect } from "react";

const API_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "http://localhost:8000";

const SETTING_SECTIONS = [
  {
    title: "🤖 LLM Configuration",
    fields: [
      { key: "ollama_base_url", label: "Ollama Base URL", type: "text", placeholder: "http://localhost:11434" },
      { key: "ollama_model", label: "Default Model", type: "text", placeholder: "llama3.2" },
      { key: "ollama_code_model", label: "Code Model", type: "text", placeholder: "codellama" },
    ],
  },
  {
    title: "🔑 API Keys",
    fields: [
      { key: "github_token", label: "GitHub Token", type: "password", placeholder: "ghp_..." },
      { key: "google_api_key", label: "Google API Key", type: "password", placeholder: "AIza..." },
      { key: "openai_api_key", label: "OpenAI API Key", type: "password", placeholder: "sk-..." },
    ],
  },
  {
    title: "🗄️ Infrastructure",
    fields: [
      { key: "redis_url", label: "Redis URL", type: "text", placeholder: "redis://localhost:6379/0" },
      { key: "qdrant_url", label: "Qdrant URL", type: "text", placeholder: "http://localhost:6333" },
      { key: "database_url", label: "Database URL", type: "text", placeholder: "postgresql://localhost/xps" },
    ],
  },
  {
    title: "🕷️ Scraping Configuration",
    fields: [
      { key: "scraping_rate_limit", label: "Rate Limit (req/min)", type: "number", placeholder: "10" },
      { key: "proxy_enabled", label: "Proxy Enabled", type: "checkbox" },
      { key: "proxy_url", label: "Proxy URL", type: "text", placeholder: "http://proxy:8080" },
    ],
  },
  {
    title: "⚙️ Workers",
    fields: [
      { key: "max_workers", label: "Max Workers", type: "number", placeholder: "5" },
      { key: "github_repo", label: "GitHub Repository", type: "text", placeholder: "org/repo" },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    loadSettings();
    loadStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/agent/settings`);
      const data = await res.json();
      if (data.success) setSettings(data.settings || {});
    } catch {
      // backend might not be running
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/agent/status`);
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus(null);
    }
  };

  const saveSettings = async () => {
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`${API_URL}/agent/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError(data.detail || "Failed to save settings");
      }
    } catch (err) {
      setError(`Connection error: ${err.message}`);
    }
  };

  const updateField = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ color: "#FFD700", fontSize: "1.5rem" }}>Loading settings…</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⚡ XPS Intelligence</span>
        <div style={styles.headerLinks}>
          <a href="/" style={styles.navLink}>Home</a>
          <a href="/chat" style={styles.navLink}>Chat</a>
          <a href="/leads" style={styles.navLink}>Leads</a>
        </div>
      </div>

      <div style={styles.content}>
        <h1 style={styles.pageTitle}>⚙️ System Settings</h1>

        {/* System Status */}
        {status && (
          <div style={styles.statusBar}>
            {Object.entries(status).map(([k, v]) => (
              <span key={k} style={styles.statusChip}>
                {k === "system_ready" ? "🟢 Online" :
                  v === true ? `✅ ${k}` :
                  v === false ? `❌ ${k}` :
                  `${k}: ${v}`}
              </span>
            ))}
          </div>
        )}

        {/* Setting sections */}
        {SETTING_SECTIONS.map((section) => (
          <div key={section.title} style={styles.section}>
            <h2 style={styles.sectionTitle}>{section.title}</h2>
            <div style={styles.fieldGrid}>
              {section.fields.map(({ key, label, type, placeholder }) => (
                <div key={key} style={styles.fieldRow}>
                  <label style={styles.label}>{label}</label>
                  {type === "checkbox" ? (
                    <input
                      type="checkbox"
                      checked={Boolean(settings[key])}
                      onChange={(e) => updateField(key, e.target.checked)}
                      style={styles.checkbox}
                    />
                  ) : (
                    <input
                      type={type}
                      value={settings[key] ?? ""}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder={placeholder}
                      style={styles.input}
                      autoComplete="off"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Save button */}
        <div style={styles.actions}>
          {error && <div style={styles.errorMsg}>{error}</div>}
          {saved && <div style={styles.successMsg}>✅ Settings saved successfully</div>}
          <button style={styles.saveBtn} onClick={saveSettings}>
            💾 Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: "#000",
    minHeight: "100vh",
    color: "#fff",
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
  logo: { color: "#FFD700", fontWeight: 700, fontSize: "1.1rem" },
  headerLinks: { display: "flex", gap: "1.25rem" },
  navLink: { color: "#888", textDecoration: "none", fontSize: "0.875rem" },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  pageTitle: {
    color: "#FFD700",
    fontSize: "1.75rem",
    fontWeight: 700,
    marginBottom: "1.5rem",
  },
  statusBar: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1.5rem",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  statusChip: {
    fontSize: "0.8rem",
    color: "#aaa",
  },
  section: {
    background: "#0d0d0d",
    border: "1px solid #1a1a1a",
    borderRadius: "10px",
    padding: "1.25rem",
    marginBottom: "1rem",
  },
  sectionTitle: {
    color: "#FFD700",
    fontSize: "1rem",
    fontWeight: 600,
    marginBottom: "1rem",
    marginTop: 0,
  },
  fieldGrid: {
    display: "grid",
    gap: "0.75rem",
  },
  fieldRow: {
    display: "grid",
    gridTemplateColumns: "200px 1fr",
    alignItems: "center",
    gap: "0.75rem",
  },
  label: {
    color: "#ccc",
    fontSize: "0.875rem",
  },
  input: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    fontFamily: "monospace",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    accentColor: "#FFD700",
  },
  actions: {
    marginTop: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    alignItems: "flex-start",
  },
  saveBtn: {
    background: "#FFD700",
    border: "none",
    borderRadius: "8px",
    color: "#000",
    fontWeight: 600,
    fontSize: "0.95rem",
    padding: "0.7rem 1.5rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  errorMsg: {
    background: "#1a0000",
    border: "1px solid #f00",
    borderRadius: "6px",
    color: "#f88",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
  },
  successMsg: {
    background: "#001a00",
    border: "1px solid #0f0",
    borderRadius: "6px",
    color: "#8f8",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
  },
};
