"use client";

import { useState } from "react";

interface Rep {
  name: string;
  avatar: string;
  leads: number;
  qualified: number;
  deals: number;
  won: number;
  revenue: number;
  activity: number;
}

const REPS: Rep[] = [
  {
    name: "Jordan Miles",
    avatar: "JM",
    leads: 187,
    qualified: 94,
    deals: 31,
    won: 14,
    revenue: 126_000,
    activity: 92,
  },
  {
    name: "Casey Rivera",
    avatar: "CR",
    leads: 164,
    qualified: 81,
    deals: 27,
    won: 9,
    revenue: 98_500,
    activity: 78,
  },
  {
    name: "Morgan Lee",
    avatar: "ML",
    leads: 139,
    qualified: 67,
    deals: 22,
    won: 5,
    revenue: 55_500,
    activity: 65,
  },
];

const TOP_OPPORTUNITIES = [
  { company: "Premier Epoxy TX", value: 42_000, stage: "Negotiation", score: 91 },
  { company: "FloorPro Solutions", value: 38_500, stage: "Proposal", score: 84 },
  { company: "Elite Hardwood Co.", value: 31_000, stage: "Negotiation", score: 80 },
  { company: "StoneCraft Systems", value: 27_500, stage: "Qualified", score: 76 },
  { company: "MetroFloor Inc.", value: 24_000, stage: "Proposal", score: 72 },
];

const WEEKLY_ACTIVITY = [
  { day: "Mon", calls: 42, emails: 87, meetings: 12 },
  { day: "Tue", calls: 58, emails: 94, meetings: 18 },
  { day: "Wed", calls: 51, emails: 76, meetings: 15 },
  { day: "Thu", calls: 63, emails: 102, meetings: 21 },
  { day: "Fri", calls: 47, emails: 88, meetings: 14 },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function stageBadge(stage: string) {
  const map: Record<string, string> = {
    Negotiation: "bg-orange-400/20 text-orange-300 border-orange-400/30",
    Proposal: "bg-yellow-400/20 text-yellow-300 border-yellow-400/30",
    Qualified: "bg-blue-400/20 text-blue-300 border-blue-400/30",
  };
  return map[stage] ?? "bg-gray-400/20 text-gray-300 border-gray-400/30";
}

export default function SalesLeaderPanel() {
  const [activeRep, setActiveRep] = useState<string | null>(null);

  const totalLeads = REPS.reduce((s, r) => s + r.leads, 0);
  const totalQualified = REPS.reduce((s, r) => s + r.qualified, 0);
  const totalDeals = REPS.reduce((s, r) => s + r.deals, 0);
  const totalWon = REPS.reduce((s, r) => s + r.won, 0);
  const totalRevenue = REPS.reduce((s, r) => s + r.revenue, 0);

  const totalCalls = WEEKLY_ACTIVITY.reduce((s, d) => s + d.calls, 0);
  const totalEmails = WEEKLY_ACTIVITY.reduce((s, d) => s + d.emails, 0);
  const totalMeetings = WEEKLY_ACTIVITY.reduce((s, d) => s + d.meetings, 0);
  const maxCalls = Math.max(...WEEKLY_ACTIVITY.map((d) => d.calls));

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Sales Leader Dashboard</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Team KPIs, rep performance &amp; top opportunities
          </p>
        </div>
        <div className="text-xs text-gray-600 hidden sm:block">
          Week of Jan 13, 2025
        </div>
      </div>

      {/* Team KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Leads", value: totalLeads.toString(), color: "text-white" },
          { label: "Qualified", value: totalQualified.toString(), color: "text-yellow-400" },
          { label: "Active Deals", value: totalDeals.toString(), color: "text-amber-400" },
          { label: "Won (MTD)", value: totalWon.toString(), color: "text-green-400" },
          { label: "Revenue (MTD)", value: fmt(totalRevenue), color: "text-yellow-400" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Rep Performance Table */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Rep Performance</h3>
          <span className="text-xs text-gray-600">{REPS.length} reps this period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a1a]">
                {["Rep", "Leads", "Qualified", "Active Deals", "Won", "Revenue", "Activity"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REPS.map((rep, idx) => {
                const isActive = activeRep === rep.name;
                return (
                  <tr
                    key={rep.name}
                    onClick={() => setActiveRep(isActive ? null : rep.name)}
                    className={[
                      "border-b border-[#1a1a1a] cursor-pointer transition-colors",
                      isActive
                        ? "bg-yellow-400/5"
                        : idx % 2 === 0
                        ? "hover:bg-white/[0.02]"
                        : "bg-white/[0.01] hover:bg-white/[0.02]",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/30 text-yellow-400 text-[10px] font-bold flex items-center justify-center">
                          {rep.avatar}
                        </span>
                        <span className="text-white text-sm font-medium">
                          {rep.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{rep.leads}</td>
                    <td className="px-4 py-3 text-yellow-400">{rep.qualified}</td>
                    <td className="px-4 py-3 text-amber-400">{rep.deals}</td>
                    <td className="px-4 py-3 text-green-400 font-semibold">{rep.won}</td>
                    <td className="px-4 py-3 text-white font-semibold">{fmt(rep.revenue)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${rep.activity}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400">{rep.activity}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-yellow-400/5">
                <td className="px-4 py-2 text-xs font-semibold text-yellow-400">
                  Team Total
                </td>
                <td className="px-4 py-2 text-xs text-gray-300">{totalLeads}</td>
                <td className="px-4 py-2 text-xs text-yellow-400">{totalQualified}</td>
                <td className="px-4 py-2 text-xs text-amber-400">{totalDeals}</td>
                <td className="px-4 py-2 text-xs text-green-400 font-semibold">{totalWon}</td>
                <td className="px-4 py-2 text-xs text-white font-semibold">{fmt(totalRevenue)}</td>
                <td className="px-4 py-2" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Weekly Activity + Top Opportunities (side by side on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weekly Activity */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">
            Weekly Activity Summary
          </h3>
          <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
            <span>
              <span className="text-white font-semibold">{totalCalls}</span> calls
            </span>
            <span>
              <span className="text-white font-semibold">{totalEmails}</span> emails
            </span>
            <span>
              <span className="text-white font-semibold">{totalMeetings}</span> meetings
            </span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end gap-2 h-24">
            {WEEKLY_ACTIVITY.map((day) => {
              const pct = Math.max(4, Math.round((day.calls / maxCalls) * 100));
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-yellow-400 rounded-t transition-all duration-500"
                    style={{ height: `${pct}%` }}
                  />
                  <span className="text-[10px] text-gray-500">{day.day}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-600 mt-2">Bar = calls · Mon–Fri</p>
        </div>

        {/* Top Opportunities */}
        <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Top Opportunities
          </h3>
          <div className="space-y-2">
            {TOP_OPPORTUNITIES.map((opp, idx) => (
              <div
                key={opp.company}
                className="flex items-center gap-3 py-1.5 border-b border-[#1a1a1a] last:border-0"
              >
                <span className="text-xs text-gray-600 w-4">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white font-medium truncate">
                    {opp.company}
                  </p>
                  <span
                    className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded border ${stageBadge(opp.stage)}`}
                  >
                    {opp.stage}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-yellow-400">
                    {fmt(opp.value)}
                  </p>
                  <p className="text-[10px] text-gray-600">score {opp.score}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
