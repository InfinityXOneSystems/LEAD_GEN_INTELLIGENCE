"use client";

import { useState, useEffect } from "react";

interface Lead {
  company?: string;
  company_name?: string;
  city?: string;
  state?: string;
  industry_detected?: string;
  industry?: string;
  lead_score?: number;
  score?: number;
  tier?: string;
  phone?: string;
  email?: string;
  rating?: number;
  reviews?: number;
}

interface LeadsTableProps {
  filters?: { tier?: string; search?: string };
}

function getTier(lead: Lead): string {
  if (lead.tier) return lead.tier;
  const s = lead.lead_score || lead.score || 0;
  return s >= 75 ? "HOT" : s >= 50 ? "WARM" : "COLD";
}

function TierBadge({ tier }: { tier: string }) {
  const cls =
    tier === "HOT"
      ? "status-hot"
      : tier === "WARM"
      ? "status-warm"
      : "status-cold";
  const icon = tier === "HOT" ? "🔥" : tier === "WARM" ? "⚡" : "❄️";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {icon} {tier}
    </span>
  );
}

function exportCSV(leads: Lead[]) {
  const headers = ["Company", "City", "State", "Industry", "Score", "Tier", "Phone", "Email", "Rating", "Reviews"];
  const rows = leads.map((l) => [
    l.company || l.company_name || "",
    l.city || "",
    l.state || "",
    l.industry_detected || l.industry || "",
    (l.lead_score || l.score || 0).toString(),
    getTier(l),
    l.phone || "",
    l.email || "",
    l.rating?.toFixed(1) || "",
    l.reviews?.toString() || "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function LeadsTable({ filters = {} }: LeadsTableProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [displayLeads, setDisplayLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const leadsPerPage = 50;

  useEffect(() => {
    fetch("/data/scored_leads.json")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllLeads(data);
        setLoading(false);
      })
      .catch(() => {
        setAllLeads([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...allLeads];
    if (filters.tier && filters.tier !== "ALL") {
      filtered = filtered.filter((l) => getTier(l) === filters.tier);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter((l) => {
        const company = (l.company || l.company_name || "").toLowerCase();
        const city = (l.city || "").toLowerCase();
        const industry = (l.industry_detected || l.industry || "").toLowerCase();
        return company.includes(q) || city.includes(q) || industry.includes(q);
      });
    }
    setDisplayLeads(filtered);
    setPage(1);
  }, [filters, allLeads]);

  const totalPages = Math.ceil(displayLeads.length / leadsPerPage);
  const startIdx = (page - 1) * leadsPerPage;
  const paginatedLeads = displayLeads.slice(startIdx, startIdx + leadsPerPage);

  if (loading) {
    return (
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto" />
        <p className="mt-4 text-gray-500 text-sm">Loading leads...</p>
      </div>
    );
  }

  if (displayLeads.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-12 text-center">
        <p className="text-gray-500 text-sm">
          {allLeads.length === 0
            ? "No leads data available. Run the scoring pipeline to generate leads."
            : "No leads match your current filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
        <span className="text-sm text-gray-400">
          Showing <span className="text-white font-medium">{displayLeads.length}</span> leads
        </span>
        <button
          onClick={() => exportCSV(displayLeads)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 transition-all"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#111111] border-b border-[#2a2a2a]">
            <tr>
              {["Company", "Location", "Industry", "Score", "Tier", "Contact"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {paginatedLeads.map((lead, idx) => (
              <tr
                key={idx}
                className="hover:bg-[#0f0f0f] transition-colors group"
              >
                <td className="px-5 py-3">
                  <div className="text-sm font-medium text-white group-hover:text-yellow-400/90 transition-colors">
                    {lead.company || lead.company_name || "Unknown"}
                  </div>
                  {lead.rating != null && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      ⭐ {lead.rating.toFixed(1)}
                      {lead.reviews != null && ` (${lead.reviews})`}
                    </div>
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-gray-300 whitespace-nowrap">
                  {lead.city || "—"}{lead.state ? `, ${lead.state}` : ""}
                </td>
                <td className="px-5 py-3 text-sm text-gray-300">
                  {lead.industry_detected || lead.industry || "—"}
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-yellow-400">
                    {lead.lead_score || lead.score || 0}
                  </span>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">
                  <TierBadge tier={getTier(lead)} />
                </td>
                <td className="px-5 py-3 text-xs text-gray-400 space-y-0.5">
                  {lead.phone && <div className="flex items-center gap-1"><span>📞</span>{lead.phone}</div>}
                  {lead.email && <div className="flex items-center gap-1"><span>✉️</span>{lead.email}</div>}
                  {!lead.phone && !lead.email && <span className="text-gray-600">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-[#111111] px-5 py-3 border-t border-[#2a2a2a] flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">
            Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-400 hover:text-white hover:border-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
