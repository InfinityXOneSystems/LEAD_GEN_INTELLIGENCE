// dashboard/pages/leads.js
// =========================
// XPS Intelligence – Leads Viewer

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const GATEWAY_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3200"
    : "http://localhost:3200";

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      });
      if (cityFilter) params.set("city", cityFilter);
      if (minScore) params.set("minScore", minScore);
      const res = await fetch(`${GATEWAY_URL}/api/leads?${params}`);
      const data = await res.json();
      const arr = data.data?.leads || data.leads || [];
      setLeads(arr);
      setTotal(data.data?.total || arr.length);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [page, cityFilter, minScore]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = search
    ? leads.filter(
        (l) =>
          (l.company_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (l.city || "").toLowerCase().includes(search.toLowerCase()),
      )
    : leads;

  const exportCsv = () => {
    const cols = [
      "company_name",
      "phone",
      "website",
      "email",
      "city",
      "state",
      "lead_score",
      "rating",
    ];
    const rows = [cols.join(",")];
    for (const l of leads) {
      rows.push(
        cols
          .map((c) => `"${String(l[c] || "").replace(/"/g, '""')}"`)
          .join(","),
      );
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "xps_leads.csv";
    a.click();
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <span style={styles.logo}>⚡ XPS Intelligence</span>
        <div style={styles.headerLinks}>
          <Link href="/" style={styles.navLink}>
            Home
          </Link>
          <Link href="/chat" style={styles.navLink}>
            Chat
          </Link>
          <Link href="/analytics" style={styles.navLink}>
            Analytics
          </Link>
          <Link href="/settings" style={styles.navLink}>
            Settings
          </Link>
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.toolbar}>
          <h1 style={styles.title}>
            📋 Leads{" "}
            <span style={{ color: "#888", fontSize: "1rem" }}>({total})</span>
          </h1>
          <div style={styles.filters}>
            <input
              style={styles.filterInput}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              style={styles.filterInput}
              placeholder="City"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setPage(0);
              }}
            />
            <input
              style={{ ...styles.filterInput, width: "100px" }}
              placeholder="Min score"
              type="number"
              value={minScore}
              onChange={(e) => {
                setMinScore(e.target.value);
                setPage(0);
              }}
            />
            <button style={styles.exportBtn} onClick={exportCsv}>
              ⬇ CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div
            style={{ color: "#FFD700", padding: "2rem", textAlign: "center" }}
          >
            Loading…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {[
                    "Company",
                    "City",
                    "State",
                    "Score",
                    "Phone",
                    "Website",
                    "Rating",
                  ].map((h) => (
                    <th key={h} style={styles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0f0f0f" }}>
                    <td style={styles.td}>{l.company_name || l.name || "—"}</td>
                    <td style={{ ...styles.td, color: "#aaa" }}>
                      {l.city || "—"}
                    </td>
                    <td style={{ ...styles.td, color: "#aaa" }}>
                      {l.state || "—"}
                    </td>
                    <td
                      style={{
                        ...styles.td,
                        color: "#FFD700",
                        fontWeight: 600,
                      }}
                    >
                      {l.lead_score ?? l.score ?? 0}
                    </td>
                    <td style={{ ...styles.td, color: "#4CAF50" }}>
                      {l.phone || "—"}
                    </td>
                    <td style={styles.td}>
                      {l.website ? (
                        <a
                          href={l.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#2196F3" }}
                        >
                          🔗 site
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ ...styles.td, color: "#aaa" }}>
                      {l.rating ? `⭐ ${l.rating}` : "—"}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        ...styles.td,
                        textAlign: "center",
                        color: "#555",
                        padding: "2rem",
                      }}
                    >
                      No leads found. Try scraping some leads via the{" "}
                      <Link href="/chat" style={{ color: "#FFD700" }}>
                        Chat interface
                      </Link>
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={styles.pagination}>
          <button
            style={{ ...styles.pageBtn, opacity: page === 0 ? 0.3 : 1 }}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span style={{ color: "#888", fontSize: "0.875rem" }}>
            Page {page + 1}
          </span>
          <button
            style={{
              ...styles.pageBtn,
              opacity: leads.length < PAGE_SIZE ? 0.3 : 1,
            }}
            onClick={() => setPage((p) => p + 1)}
            disabled={leads.length < PAGE_SIZE}
          >
            Next →
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
  content: { padding: "1.5rem" },
  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1rem",
    flexWrap: "wrap",
    gap: "0.75rem",
  },
  title: { color: "#FFD700", fontSize: "1.5rem", fontWeight: 700 },
  filters: { display: "flex", gap: "0.5rem", flexWrap: "wrap" },
  filterInput: {
    background: "#111",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    padding: "0.4rem 0.75rem",
    fontSize: "0.875rem",
    fontFamily: "inherit",
    outline: "none",
    width: "150px",
  },
  exportBtn: {
    background: "transparent",
    border: "1px solid #FFD700",
    borderRadius: "6px",
    color: "#FFD700",
    padding: "0.4rem 0.75rem",
    fontSize: "0.875rem",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" },
  th: {
    padding: "0.6rem 0.5rem",
    textAlign: "left",
    color: "#FFD700",
    borderBottom: "1px solid #222",
    whiteSpace: "nowrap",
  },
  td: { padding: "0.45rem 0.5rem", verticalAlign: "middle" },
  pagination: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem 0",
    justifyContent: "center",
  },
  pageBtn: {
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "6px",
    color: "#fff",
    padding: "0.4rem 0.75rem",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.875rem",
  },
};
