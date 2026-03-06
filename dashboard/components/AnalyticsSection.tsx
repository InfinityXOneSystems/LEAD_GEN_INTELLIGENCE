"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import FilterBar from "@/components/FilterBar";

interface Lead {
  lead_score?: number;
  score?: number;
  tier?: string;
  industry_detected?: string;
  industry?: string;
  city?: string;
  state?: string;
}

interface AnalyticsSectionProps {
  filters?: { tier?: string; search?: string; state?: string; city?: string };
  onFilterChange?: (f: { tier?: string; search?: string; state?: string; city?: string }) => void;
}

const GOLD = "#EAB308";
const GOLD2 = "#F59E0B";
const RED = "#EF4444";
const ORANGE = "#F97316";
const BLUE = "#60A5FA";
const GREEN = "#22C55E";

const TIER_COLORS: Record<string, string> = { HOT: RED, WARM: ORANGE, COLD: BLUE };

const TREND_DATA = [
  { date: "Mon", avg: 52, hot: 12, warm: 18 },
  { date: "Tue", avg: 58, hot: 15, warm: 22 },
  { date: "Wed", avg: 61, hot: 19, warm: 25 },
  { date: "Thu", avg: 55, hot: 14, warm: 20 },
  { date: "Fri", avg: 68, hot: 24, warm: 28 },
  { date: "Sat", avg: 72, hot: 28, warm: 31 },
  { date: "Sun", avg: 65, hot: 21, warm: 26 },
];

const CustomTooltipStyle = {
  backgroundColor: "#111111",
  border: "1px solid rgba(234,179,8,0.15)",
  borderRadius: "10px",
  color: "#ffffff",
  fontSize: "12px",
  padding: "8px 12px",
};

export default function AnalyticsSection({ filters, onFilterChange }: AnalyticsSectionProps) {
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/scored_leads.json")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllLeads(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Apply filters to leads for analytics
  const leads = allLeads.filter((l) => {
    if (filters?.tier && filters.tier !== "ALL") {
      const s = l.lead_score || l.score || 0;
      const tier = l.tier || (s >= 75 ? "HOT" : s >= 50 ? "WARM" : "COLD");
      if (tier !== filters.tier) return false;
    }
    if (filters?.state) {
      if ((l.state || "").toLowerCase() !== filters.state.toLowerCase()) return false;
    }
    if (filters?.city) {
      if (!(l.city || "").toLowerCase().includes(filters.city.toLowerCase())) return false;
    }
    return true;
  });

  const scoreBuckets = [
    { range: "0-25", count: 0, label: "0–25" },
    { range: "25-50", count: 0, label: "25–50" },
    { range: "50-75", count: 0, label: "50–75" },
    { range: "75-100", count: 0, label: "75–100" },
  ];
  leads.forEach((l) => {
    const s = l.lead_score || l.score || 0;
    if (s < 25) scoreBuckets[0].count++;
    else if (s < 50) scoreBuckets[1].count++;
    else if (s < 75) scoreBuckets[2].count++;
    else scoreBuckets[3].count++;
  });

  const tierCounts: Record<string, number> = { HOT: 0, WARM: 0, COLD: 0 };
  leads.forEach((l) => {
    const s = l.lead_score || l.score || 0;
    const tier = l.tier || (s >= 75 ? "HOT" : s >= 50 ? "WARM" : "COLD");
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });
  const tierData = Object.entries(tierCounts).map(([name, value]) => ({ name, value }));

  const industryCounts: Record<string, number> = {};
  leads.forEach((l) => {
    const ind = l.industry_detected || l.industry || "Unknown";
    const key = ind.length > 25 ? ind.slice(0, 25) + "…" : ind;
    industryCounts[key] = (industryCounts[key] || 0) + 1;
  });
  const industryData = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <span className="text-sm text-gray-500">{leads.length} leads analyzed</span>
      </div>

      {/* Filters */}
      {onFilterChange && (
        <FilterBar onFilterChange={onFilterChange} />
      )}

      {/* Row 1: Score Distribution + Tier Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card gold-glow-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Lead Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreBuckets} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(234,179,8,0.05)" }} formatter={(v) => [Number(v), "Leads"]} />
              <Bar dataKey="count" fill={GOLD} radius={[4, 4, 0, 0]}>
                {scoreBuckets.map((_, i) => (
                  <Cell key={i} fill={i === 3 ? GOLD : i === 2 ? GOLD2 : i === 1 ? ORANGE : "#6B7280"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card gold-glow-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Lead Tier Breakdown</h3>
          {tierData.every((d) => d.value === 0) ? (
            <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={tierData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {tierData.map((entry, i) => (
                    <Cell key={i} fill={TIER_COLORS[entry.name] || "#6B7280"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CustomTooltipStyle} formatter={(v, name) => [Number(v), String(name)]} />
                <Legend formatter={(value) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row 2: Industry Bar + Score Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card gold-glow-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Industries</h3>
          {industryData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={industryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CustomTooltipStyle} cursor={{ fill: "rgba(234,179,8,0.05)" }} formatter={(v) => [Number(v), "Leads"]} />
                <Bar dataKey="count" fill={GREEN} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card gold-glow-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Lead Scores Over Time (7d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={CustomTooltipStyle} />
              <Legend formatter={(v) => <span style={{ color: "#9CA3AF", fontSize: 11 }}>{v}</span>} />
              <Line type="monotone" dataKey="avg" stroke={GOLD} strokeWidth={2} dot={false} name="Avg Score" />
              <Line type="monotone" dataKey="hot" stroke={RED} strokeWidth={2} dot={false} name="HOT Leads" />
              <Line type="monotone" dataKey="warm" stroke={ORANGE} strokeWidth={2} dot={false} name="WARM Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Analyzed", value: leads.length, color: "text-yellow-400" },
          { label: "HOT Leads", value: tierCounts.HOT || 0, color: "text-red-400" },
          { label: "WARM Leads", value: tierCounts.WARM || 0, color: "text-orange-400" },
          { label: "COLD Leads", value: tierCounts.COLD || 0, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="glass-card gold-glow-card rounded-2xl p-4 text-center">
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

