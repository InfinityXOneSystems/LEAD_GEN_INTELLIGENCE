"use client";

import { useState } from "react";

type SortKey = "leads" | "opportunityScore" | "avgLeadScore";

interface StateData {
  state: string;
  abbr: string;
  leads: number;
  opportunityScore: number;
  avgLeadScore: number;
  topCategory: string;
}

const STATE_DATA: StateData[] = [
  {
    state: "Texas",
    abbr: "TX",
    leads: 847,
    opportunityScore: 96,
    avgLeadScore: 74,
    topCategory: "Epoxy Flooring",
  },
  {
    state: "California",
    abbr: "CA",
    leads: 763,
    opportunityScore: 92,
    avgLeadScore: 71,
    topCategory: "Hardwood",
  },
  {
    state: "Florida",
    abbr: "FL",
    leads: 698,
    opportunityScore: 89,
    avgLeadScore: 69,
    topCategory: "Tile & Stone",
  },
  {
    state: "New York",
    abbr: "NY",
    leads: 534,
    opportunityScore: 84,
    avgLeadScore: 67,
    topCategory: "Hardwood",
  },
  {
    state: "Illinois",
    abbr: "IL",
    leads: 412,
    opportunityScore: 79,
    avgLeadScore: 65,
    topCategory: "Commercial",
  },
  {
    state: "Ohio",
    abbr: "OH",
    leads: 389,
    opportunityScore: 76,
    avgLeadScore: 63,
    topCategory: "Epoxy Flooring",
  },
  {
    state: "Georgia",
    abbr: "GA",
    leads: 371,
    opportunityScore: 75,
    avgLeadScore: 62,
    topCategory: "Carpet",
  },
  {
    state: "Arizona",
    abbr: "AZ",
    leads: 348,
    opportunityScore: 73,
    avgLeadScore: 61,
    topCategory: "Tile & Stone",
  },
  {
    state: "Pennsylvania",
    abbr: "PA",
    leads: 327,
    opportunityScore: 71,
    avgLeadScore: 60,
    topCategory: "Hardwood",
  },
  {
    state: "Michigan",
    abbr: "MI",
    leads: 298,
    opportunityScore: 68,
    avgLeadScore: 58,
    topCategory: "Commercial",
  },
  {
    state: "Colorado",
    abbr: "CO",
    leads: 276,
    opportunityScore: 65,
    avgLeadScore: 57,
    topCategory: "Epoxy Flooring",
  },
  {
    state: "North Carolina",
    abbr: "NC",
    leads: 254,
    opportunityScore: 62,
    avgLeadScore: 55,
    topCategory: "Hardwood",
  },
  {
    state: "Washington",
    abbr: "WA",
    leads: 231,
    opportunityScore: 59,
    avgLeadScore: 53,
    topCategory: "Commercial",
  },
  {
    state: "Tennessee",
    abbr: "TN",
    leads: 198,
    opportunityScore: 54,
    avgLeadScore: 51,
    topCategory: "Carpet",
  },
  {
    state: "Nevada",
    abbr: "NV",
    leads: 172,
    opportunityScore: 48,
    avgLeadScore: 48,
    topCategory: "Tile & Stone",
  },
];

function heatClass(value: number, max: number): string {
  const pct = value / max;
  if (pct >= 0.75) return "bg-yellow-400 text-black font-bold";
  if (pct >= 0.45) return "bg-yellow-400/50 text-yellow-200";
  return "bg-yellow-400/20 text-yellow-400/70";
}

function ScoreBadge({ score, max }: { score: number; max: number }) {
  const pct = score / max;
  return (
    <span
      className={[
        "inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-semibold",
        heatClass(score, max),
      ].join(" ")}
    >
      {score}
    </span>
  );
}

export default function TerritoryMapPanel() {
  const [sortKey, setSortKey] = useState<SortKey>("leads");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [hovered, setHovered] = useState<string | null>(null);

  const maxLeads = Math.max(...STATE_DATA.map((s) => s.leads));
  const maxOpp = Math.max(...STATE_DATA.map((s) => s.opportunityScore));
  const maxAvg = Math.max(...STATE_DATA.map((s) => s.avgLeadScore));

  const sorted = [...STATE_DATA].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === "desc" ? -diff : diff;
  });

  const totalLeads = STATE_DATA.reduce((s, st) => s + st.leads, 0);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => (
    <span className="ml-1 text-gray-600">
      {sortKey === col ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
    </span>
  );

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Territory Map</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Top 15 states · Lead density &amp; opportunity scores
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-0.5 bg-yellow-400/20 rounded text-yellow-400/70">
            Low
          </span>
          <span className="px-2 py-0.5 bg-yellow-400/50 rounded text-yellow-200">
            Med
          </span>
          <span className="px-2 py-0.5 bg-yellow-400 rounded text-black font-bold">
            High
          </span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Leads",
            value: totalLeads.toLocaleString(),
            sub: "Across 15 states",
          },
          {
            label: "Top Territory",
            value: sorted[0]?.state ?? "—",
            sub: `${sorted[0]?.leads ?? 0} leads`,
          },
          {
            label: "Avg Opp Score",
            value: Math.round(
              STATE_DATA.reduce((s, st) => s + st.opportunityScore, 0) /
                STATE_DATA.length,
            ).toString(),
            sub: "Out of 100",
          },
          {
            label: "Top Category",
            value: "Epoxy Flooring",
            sub: "Most common",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-base font-bold text-yellow-400 truncate">
              {m.value}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors select-none"
                  onClick={() => handleSort("leads")}
                >
                  Leads <SortIcon col="leads" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors select-none"
                  onClick={() => handleSort("opportunityScore")}
                >
                  Opp Score <SortIcon col="opportunityScore" />
                </th>
                <th
                  className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-yellow-400 transition-colors select-none hidden sm:table-cell"
                  onClick={() => handleSort("avgLeadScore")}
                >
                  Avg Lead Score <SortIcon col="avgLeadScore" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Top Category
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Share
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, idx) => (
                <tr
                  key={row.abbr}
                  onMouseEnter={() => setHovered(row.abbr)}
                  onMouseLeave={() => setHovered(null)}
                  className={[
                    "border-b border-[#1a1a1a] transition-colors",
                    hovered === row.abbr
                      ? "bg-yellow-400/5"
                      : idx % 2 === 0
                        ? ""
                        : "bg-white/[0.01]",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-5 bg-[#2a2a2a] rounded text-[10px] font-bold text-yellow-400 flex items-center justify-center">
                        {row.abbr}
                      </span>
                      <span className="text-white text-sm">{row.state}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ScoreBadge score={row.leads} max={maxLeads} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-yellow-400/70 rounded-full"
                          style={{
                            width: `${(row.opportunityScore / maxOpp) * 100}%`,
                          }}
                        />
                      </div>
                      <ScoreBadge score={row.opportunityScore} max={maxOpp} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <ScoreBadge score={row.avgLeadScore} max={maxAvg} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">
                    {row.topCategory}
                  </td>
                  <td className="px-4 py-3 text-right hidden lg:table-cell">
                    <span className="text-xs text-gray-600">
                      {((row.leads / totalLeads) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[#2a2a2a] flex items-center justify-between">
          <span className="text-xs text-gray-600">
            {STATE_DATA.length} states shown · Click column headers to sort
          </span>
          <span className="text-xs text-yellow-400/50">
            {totalLeads.toLocaleString()} total leads
          </span>
        </div>
      </div>

      {/* Heat legend */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Opportunity Heat Distribution
        </h3>
        <div className="flex gap-3 flex-wrap">
          {[
            {
              label: "High (75%+)",
              cls: "bg-yellow-400",
              count: STATE_DATA.filter(
                (s) => s.opportunityScore / maxOpp >= 0.75,
              ).length,
            },
            {
              label: "Medium (45–74%)",
              cls: "bg-yellow-400/50",
              count: STATE_DATA.filter((s) => {
                const p = s.opportunityScore / maxOpp;
                return p >= 0.45 && p < 0.75;
              }).length,
            },
            {
              label: "Low (<45%)",
              cls: "bg-yellow-400/20",
              count: STATE_DATA.filter(
                (s) => s.opportunityScore / maxOpp < 0.45,
              ).length,
            },
          ].map((tier) => (
            <div key={tier.label} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-sm ${tier.cls}`} />
              <span className="text-xs text-gray-400">
                {tier.label}{" "}
                <span className="text-gray-600">({tier.count} states)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
