"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import { leadsApi, type Lead } from "@/lib/api";

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80 ? "badge-green" : score >= 50 ? "badge-yellow" : "badge-red";
  return <span className={`badge ${cls}`}>{score.toFixed(0)}</span>;
}

const PAGE_SIZE = 50;

export default function LeadsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    industry: "",
    city: "",
    state: "",
    minScore: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads", page, filters],
    queryFn: () =>
      leadsApi
        .list({
          offset: (page - 1) * PAGE_SIZE,
          limit: PAGE_SIZE,
          ...(filters.city ? { city: filters.city } : {}),
          ...(filters.state ? { state: filters.state } : {}),
          ...(filters.minScore ? { minScore: filters.minScore } : {}),
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      toast.success("Lead deleted");
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Database</h1>
          <p className="text-gray-500 text-sm mt-1">
            {total.toLocaleString()} total leads
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href="/api/leads?limit=10000"
            download="leads.json"
            className="btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Export JSON
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-4 gap-4">
          {(["industry", "city", "state", "minScore"] as const).map((key) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {key === "minScore" ? "Min Score" : key}
              </label>
              <input
                type={key === "minScore" ? "number" : "text"}
                value={filters[key]}
                onChange={(e) => {
                  setFilters((f) => ({ ...f, [key]: e.target.value }));
                  setPage(1);
                }}
                placeholder={key === "minScore" ? "0" : `Filter by ${key}...`}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Company",
                  "Contact",
                  "City",
                  "State",
                  "Industry",
                  "Score",
                  "Email",
                  "Phone",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No leads found. Start a scrape job to collect leads.
                  </td>
                </tr>
              ) : (
                leads.map((lead: Lead, idx: number) => {
                  const displayName = lead.company || lead.company_name || "—";
                  const score = lead.lead_score ?? lead.score ?? 0;
                  const leadId = String(lead.id ?? idx);
                  return (
                    <tr
                      key={leadId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 max-w-[180px] truncate">
                        {displayName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lead.contact_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lead.city ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lead.state ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">
                        {lead.industry ?? lead.category ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBadge score={score} />
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {lead.email}
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {lead.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(leadId)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Page {page} of {totalPages} ({total.toLocaleString()} leads)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary py-1.5 px-2"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary py-1.5 px-2"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
