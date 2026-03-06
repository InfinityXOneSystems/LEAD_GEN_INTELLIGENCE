"use client";

import { useState, useEffect } from "react";
import { IconPhone, IconMail, IconCheckCircle, IconStar, IconFire, IconBolt, IconSnowflake, IconDownload } from "@/components/Icons";

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
  filters?: {
    tier?: string;
    search?: string;
    state?: string;
    city?: string;
  };
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
  const icon =
    tier === "HOT" ? (
      <IconFire className="w-3 h-3" />
    ) : tier === "WARM" ? (
      <IconBolt className="w-3 h-3" />
    ) : (
      <IconSnowflake className="w-3 h-3" />
    );
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>
      {icon} {tier}
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? "text-yellow-400" : score >= 50 ? "text-orange-400" : "text-blue-400";
  return <span className={`text-lg font-black ${color} leading-none`}>{score}</span>;
}

function exportCSV(leads: Lead[]) {
  const headers = ["Company","City","State","Industry","Score","Tier","Phone","Email","Rating","Reviews"];
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
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${v.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function MobileLeadCard({ lead, idx }: { lead: Lead; idx: number }) {
  const tier = getTier(lead);
  const score = lead.lead_score || lead.score || 0;
  const company = lead.company || lead.company_name || "Unknown";

  return (
    <div className="lead-card-mobile">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white leading-tight truncate">{company}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {[lead.city, lead.state].filter(Boolean).join(", ") || "—"}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBadge score={score} />
          <TierBadge tier={tier} />
        </div>
      </div>

      {/* Industry + rating */}
      <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
        {(lead.industry_detected || lead.industry) && (
          <span className="truncate">{lead.industry_detected || lead.industry}</span>
        )}
        {lead.rating != null && (
          <span className="flex-shrink-0 flex items-center gap-1">
            <IconStar className="w-3 h-3 text-yellow-400" />
            {lead.rating.toFixed(1)}{lead.reviews ? ` (${lead.reviews})` : ""}
          </span>
        )}
      </div>

      {/* Contact info */}
      {(lead.phone || lead.email) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-gray-400">
          {lead.phone && (
            <span className="flex items-center gap-1">
              <IconPhone className="w-3 h-3" /> {lead.phone}
            </span>
          )}
          {lead.email && (
            <span className="flex items-center gap-1">
              <IconMail className="w-3 h-3" /> {lead.email}
            </span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t border-yellow-400/10">
        {lead.phone && (
          <a
            href={`tel:${lead.phone}`}
            className="action-btn-gold flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <IconPhone className="w-3 h-3" /> Call
          </a>
        )}
        {lead.email && (
          <a
            href={`mailto:${lead.email}?subject=Partnership Opportunity&body=Hello, I'd like to discuss a business opportunity with ${company}.`}
            className="action-btn-gold flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <IconMail className="w-3 h-3" /> Email
          </a>
        )}
        <button
          className="action-btn-gold flex items-center gap-1 ml-auto"
          title={`Qualify lead #${idx + 1}`}
        >
          <IconCheckCircle className="w-3 h-3" /> Qualify
        </button>
      </div>
    </div>
  );
}

export default function LeadsTable({ filters = {} }: LeadsTableProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [displayLeads, setDisplayLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const leadsPerPage = 25;

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
    if (filters.state) {
      const st = filters.state.toLowerCase();
      filtered = filtered.filter((l) => (l.state || "").toLowerCase() === st);
    }
    if (filters.city) {
      const ct = filters.city.toLowerCase();
      filtered = filtered.filter((l) => (l.city || "").toLowerCase().includes(ct));
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
      <div className="glass-card rounded-2xl p-12 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400 mx-auto" />
        <p className="mt-4 text-gray-500 text-sm">Loading leads…</p>
      </div>
    );
  }

  if (displayLeads.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <p className="text-gray-500 text-sm">
          {allLeads.length === 0
            ? "No leads data available. Run the scoring pipeline to generate leads."
            : "No leads match your current filters."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header bar */}
      <div className="glass-card rounded-t-2xl px-4 py-3 border-b border-yellow-400/10 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          Showing <span className="text-white font-semibold">{displayLeads.length}</span> leads
        </span>
        <button
          onClick={() => exportCSV(displayLeads)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/25 rounded-xl text-xs text-yellow-400 hover:bg-yellow-400/20 transition-all"
        >
          <IconDownload className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>

      {/* Mobile cards view */}
      <div className="md:hidden">
        {paginatedLeads.map((lead, idx) => (
          <MobileLeadCard key={idx} lead={lead} idx={startIdx + idx} />
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block glass-card rounded-b-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/40 border-b border-yellow-400/10">
              <tr>
                {["Company", "Location", "Industry", "Score", "Tier", "Contact", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold text-yellow-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-yellow-400/5">
              {paginatedLeads.map((lead, idx) => (
                <tr key={idx} className="hover:bg-yellow-400/5 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="text-sm font-medium text-white group-hover:text-yellow-400/90 transition-colors">
                      {lead.company || lead.company_name || "Unknown"}
                    </div>
                    {lead.rating != null && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <IconStar className="w-3 h-3 text-yellow-400" />
                        {lead.rating.toFixed(1)}
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
                    <span className="text-sm font-black text-yellow-400">
                      {lead.lead_score || lead.score || 0}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <TierBadge tier={getTier(lead)} />
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-400 space-y-1">
                    {lead.phone && (
                      <div className="flex items-center gap-1">
                        <IconPhone className="w-3 h-3 flex-shrink-0" /> {lead.phone}
                      </div>
                    )}
                    {lead.email && (
                      <div className="flex items-center gap-1">
                        <IconMail className="w-3 h-3 flex-shrink-0" /> {lead.email}
                      </div>
                    )}
                    {!lead.phone && !lead.email && <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex gap-1.5">
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="action-btn-gold inline-flex items-center gap-1">
                          <IconPhone className="w-3 h-3" /> Call
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}?subject=Partnership Opportunity`}
                          className="action-btn-gold inline-flex items-center gap-1"
                        >
                          <IconMail className="w-3 h-3" /> Email
                        </a>
                      )}
                      <button className="action-btn-gold inline-flex items-center gap-1">
                        <IconCheckCircle className="w-3 h-3" /> Qualify
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-card rounded-2xl mt-2 px-5 py-3 flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page <span className="text-white font-semibold">{page}</span> of{" "}
            <span className="text-white font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
