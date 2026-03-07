"use client";

import { useState } from "react";

type Period = "monthly" | "quarterly" | "annual";

interface PipelineBar {
  stage: string;
  value: number;
  color: string;
}

const PIPELINE_BARS: PipelineBar[] = [
  { stage: "Prospect", value: 1_248_000, color: "bg-yellow-400/40" },
  { stage: "Qualified", value: 934_500, color: "bg-yellow-400/60" },
  { stage: "Proposal", value: 658_000, color: "bg-yellow-400/80" },
  { stage: "Negotiation", value: 369_000, color: "bg-yellow-400" },
  { stage: "Closed Won", value: 280_000, color: "bg-green-400" },
];

const PERIOD_DATA: Record<
  Period,
  { revenue: number; forecast: number; growth: number; deals: number }
> = {
  monthly: { revenue: 280_000, forecast: 418_000, growth: 23.4, deals: 28 },
  quarterly: { revenue: 791_000, forecast: 1_180_000, growth: 18.7, deals: 84 },
  annual: { revenue: 2_940_000, forecast: 4_310_000, growth: 31.2, deals: 312 },
};

const MONTHLY_TREND = [
  { month: "Jul", value: 198_000 },
  { month: "Aug", value: 224_000 },
  { month: "Sep", value: 247_000 },
  { month: "Oct", value: 261_000 },
  { month: "Nov", value: 272_000 },
  { month: "Dec", value: 280_000 },
  { month: "Jan", value: 298_000, forecast: true },
  { month: "Feb", value: 318_000, forecast: true },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

export default function RevenuePanel() {
  const [period, setPeriod] = useState<Period>("monthly");
  const data = PERIOD_DATA[period];
  const maxBar = Math.max(...PIPELINE_BARS.map((b) => b.value));
  const maxTrend = Math.max(...MONTHLY_TREND.map((t) => t.value));

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">Revenue Forecast</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Deal tracker &amp; pipeline revenue analytics
          </p>
        </div>
        {/* Period toggle */}
        <div className="flex items-center bg-[#111111] border border-[#2a2a2a] rounded-lg p-0.5 gap-0.5 w-fit">
          {(["monthly", "quarterly", "annual"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={[
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize",
                period === p
                  ? "bg-yellow-400 text-black"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              {p === "monthly" ? "Monthly" : p === "quarterly" ? "Quarterly" : "Annual"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Closed Won",
            value: fmt(data.revenue),
            sub: `${data.deals} deals`,
            color: "text-green-400",
          },
          {
            label: "Forecast",
            value: fmt(data.forecast),
            sub: "Weighted pipeline",
            color: "text-yellow-400",
          },
          {
            label: "Pipeline Value",
            value: fmt(PIPELINE_BARS.reduce((s, b) => s + b.value, 0)),
            sub: "All active stages",
            color: "text-white",
          },
          {
            label: "YoY Growth",
            value: `+${data.growth}%`,
            sub: "vs prior period",
            color: "text-yellow-400",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue trend chart (CSS bars) */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Monthly Trend</h3>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-yellow-400" /> Actual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-yellow-400/30 border border-yellow-400/50 border-dashed" />{" "}
              Forecast
            </span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-32">
          {MONTHLY_TREND.map((t) => {
            const pct = Math.max(4, Math.round((t.value / maxTrend) * 100));
            return (
              <div
                key={t.month}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-[9px] text-gray-600 hidden sm:block">
                  {fmt(t.value)}
                </span>
                <div
                  className={[
                    "w-full rounded-t transition-all duration-500",
                    t.forecast
                      ? "bg-yellow-400/30 border border-yellow-400/50 border-dashed border-b-0"
                      : "bg-yellow-400",
                  ].join(" ")}
                  style={{ height: `${pct}%` }}
                />
                <span className="text-[10px] text-gray-500">{t.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline value by stage */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Pipeline Value by Stage
        </h3>
        <div className="space-y-3">
          {PIPELINE_BARS.map((bar) => {
            const pct = Math.max(2, Math.round((bar.value / maxBar) * 100));
            return (
              <div key={bar.stage} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-24 flex-shrink-0">
                  {bar.stage}
                </span>
                <div className="flex-1 h-5 bg-[#2a2a2a] rounded overflow-hidden">
                  <div
                    className={`h-full ${bar.color} rounded transition-all duration-700 flex items-center pl-2`}
                    style={{ width: `${pct}%` }}
                  >
                    <span className="text-[10px] text-black font-bold hidden sm:block">
                      {fmt(bar.value)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-16 text-right">
                  {fmt(bar.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Velocity */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          Deal Velocity Stats
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Avg Deal Size", value: fmt(Math.round(data.revenue / data.deals)) },
            { label: "Avg Sales Cycle", value: "18 days" },
            { label: "Deals / Month", value: data.deals.toString() },
            { label: "Conversion Rate", value: "9.0%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-lg font-bold text-yellow-400">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
