// dashboard/pages/index.js
import React from "react";
import Link from "next/link";

const LINKS = [
  {
    href: "/chat",
    label: "💬 Chat Interface",
    desc: "Control the system with natural language",
  },
  { href: "/leads", label: "📋 Leads", desc: "View and manage scraped leads" },
  {
    href: "/analytics",
    label: "📊 Analytics",
    desc: "Lead analytics and charts",
  },
  {
    href: "/settings",
    label: "⚙️ Settings",
    desc: "Configure LLM, APIs, scraping",
  },
];

export default function Home() {
  return (
    <div style={styles.page}>
      <h1 style={styles.title}>⚡ XPS Intelligence Platform</h1>
      <p style={styles.subtitle}>
        Autonomous Lead Generation &amp; AI Control System
      </p>

      <div style={styles.grid}>
        {LINKS.map(({ href, label, desc }) => (
          <Link key={href} href={href} style={styles.card}>
            <div style={styles.cardLabel}>{label}</div>
            <div style={styles.cardDesc}>{desc}</div>
          </Link>
        ))}
      </div>

      <div style={styles.footer}>
        <a
          href="https://github.com/InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.ghLink}
        >
          GitHub Repository
        </a>
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
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "3rem 1rem",
  },
  title: {
    color: "#FFD700",
    fontSize: "2.5rem",
    fontWeight: 800,
    letterSpacing: "-0.02em",
    marginBottom: "0.5rem",
    textAlign: "center",
  },
  subtitle: {
    color: "#888",
    fontSize: "1.1rem",
    marginBottom: "3rem",
    textAlign: "center",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "1.25rem",
    width: "100%",
    maxWidth: "900px",
  },
  card: {
    display: "block",
    background: "#0d0d0d",
    border: "1px solid #FFD700",
    borderRadius: "12px",
    padding: "1.5rem",
    textDecoration: "none",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    cursor: "pointer",
  },
  cardLabel: {
    color: "#FFD700",
    fontSize: "1.1rem",
    fontWeight: 600,
    marginBottom: "0.4rem",
  },
  cardDesc: {
    color: "#aaa",
    fontSize: "0.875rem",
  },
  footer: {
    marginTop: "4rem",
  },
  ghLink: {
    color: "#555",
    textDecoration: "none",
    fontSize: "0.85rem",
  },
};
