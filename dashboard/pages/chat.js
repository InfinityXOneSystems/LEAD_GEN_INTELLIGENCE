// dashboard/pages/chat.js
// ========================
// XPS Intelligence – Chat Interface
// Natural-language control plane wired to the backend runtime API.

import React from "react";
import Link from "next/link";
import RuntimeCommandChat from "../components/RuntimeCommandChat";

const SUGGESTIONS = [
  "scrape epoxy contractors in Orlando FL",
  "run seo analysis on xps-intelligence.vercel.app",
  "export leads",
  "run outreach campaign",
  "status",
  "help",
];

export default function ChatPage() {
  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⚡ XPS Intelligence</span>
        <div style={styles.headerLinks}>
          <Link href="/" style={styles.navLink}>
            Home
          </Link>
          <Link href="/leads" style={styles.navLink}>
            Leads
          </Link>
          <Link href="/settings" style={styles.navLink}>
            Settings
          </Link>
        </div>
      </div>

      {/* Chat panel – fills remaining height */}
      <div style={styles.chatWrapper}>
        <RuntimeCommandChat suggestions={SUGGESTIONS} />
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
  chatWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    height: "calc(100vh - 57px)",
  },
};
