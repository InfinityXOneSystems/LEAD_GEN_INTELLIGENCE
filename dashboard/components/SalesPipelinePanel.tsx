"use client";

import { useState } from "react";

interface PipelineStage {
  id: string;
  label: string;
  leads: number;
  value: number;
  color: string;
  bgColor: string;
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "prospect",
    label: "Prospect",
    leads: 312,
    value: 1_248_000,
    color: "text-yellow-400",
    bgColor: "bg-yellow-400/10 border-yellow-400/30",
  },
  {
    id: "qualified",
    label: "Qualified",
    leads: 187,
    value: 934_500,
    color: "text-yellow-300",
    bgColor: "bg-yellow-300/10 border-yellow-300/30",
  },
  {
    id: "proposal",
    label: "Proposal",
    leads: 94,
    value: 658_000,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10 border-amber-400/30",
  },
  {
    id: "negotiation",
    label: "Negotiation",
    leads: 41,
    value: 369_000,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10 border-orange-400/30",
  },
  {
    id: "closed-won",
    label: "Closed Won",
    leads: 28,
    value: 280_000,
    color: "text-green-400",
    bgColor: "bg-green-400/10 border-green-400/30",
  },
  {
    id: "closed-lost",
    label: "Closed Lost",
    leads: 13,
    value: 89_000,
    color: "text-red-400",
    bgColor: "bg-red-400/10 border-red-400/30",
  },
];

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function conversionRate(from: number, to: number) {
  return from === 0 ? "—" : `${Math.round((to / from) * 100)}%`;
}

export default function SalesPipelinePanel() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const totalPipeline = PIPELINE_STAGES.slice(0, 4).reduce(
    (s, st) => s + st.value,
    0
  );
  const closedWon = PIPELINE_STAGES.find((s) => s.id === "closed-won")!;
  const winRate = conversionRate(
    PIPELINE_STAGES[0].leads,
    closedWon.leads
  );
  const weightedForecast = Math.round(
    PIPELINE_STAGES[2].value * 0.4 +
      PIPELINE_STAGES[3].value * 0.7 +
      closedWon.value
  );

  return (
    <div className="fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Sales Pipeline</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Kanban-style pipeline tracker · 6 stages
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live data
        </div>
      </div>

      {/* Revenue Forecast Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Pipeline", value: fmt(totalPipeline), sub: "Active stages" },
          { label: "Weighted Forecast", value: fmt(weightedForecast), sub: "Probability adj." },
          { label: "Closed Won (MTD)", value: fmt(closedWon.value), sub: `${closedWon.leads} deals` },
          { label: "Win Rate", value: winRate, sub: "Prospect → Won" },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4"
          >
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold text-yellow-400">{m.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {PIPELINE_STAGES.map((stage, idx) => {
          const nextStage = PIPELINE_STAGES[idx + 1];
          const isSelected = selectedStage === stage.id;
          const maxLeads = PIPELINE_STAGES[0].leads;
          const barPct = Math.max(4, Math.round((stage.leads / maxLeads) * 100));

          return (
            <div
              key={stage.id}
              onClick={() =>
                setSelectedStage(isSelected ? null : stage.id)
              }
              className={[
                "bg-[#111111] border rounded-xl p-3 cursor-pointer transition-all",
                isSelected
                  ? `${stage.bgColor} ring-1 ring-yellow-400/40`
                  : "border-[#2a2a2a] hover:border-[#3a3a3a]",
              ].join(" ")}
            >
              {/* Stage label */}
              <p className={`text-xs font-semibold mb-2 ${stage.color}`}>
                {stage.label}
              </p>

              {/* Lead count */}
              <p className="text-2xl font-black text-white">{stage.leads}</p>
              <p className="text-[10px] text-gray-600 mb-2">leads</p>

              {/* Bar */}
              <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full bg-yellow-400/60 transition-all duration-500"
                  style={{ width: `${barPct}%` }}
                />
              </div>

              {/* Value */}
              <p className={`text-sm font-bold ${stage.color}`}>
                {fmt(stage.value)}
              </p>

              {/* Conversion arrow to next */}
              {nextStage && !["closed-won", "closed-lost"].includes(stage.id) && (
                <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                  <p className="text-[10px] text-gray-600">
                    → {conversionRate(stage.leads, nextStage.leads)} convert
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-[#111111] border border-[#2a2a2a] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Conversion Funnel
        </h3>
        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const pct = Math.round(
              (stage.leads / PIPELINE_STAGES[0].leads) * 100
            );
            return (
              <div key={stage.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">
                  {stage.label}
                </span>
                <div className="flex-1 h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      stage.id === "closed-won"
                        ? "bg-green-400"
                        : stage.id === "closed-lost"
                        ? "bg-red-400/60"
                        : "bg-yellow-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-8 text-right">
                  {pct}%
                </span>
                <span className="text-xs text-gray-600 w-16 text-right hidden sm:block">
                  {fmt(stage.value)}
                </span>
                {idx < PIPELINE_STAGES.length - 1 &&
                  PIPELINE_STAGES[idx + 1] && (
                    <span className="text-[10px] text-gray-700 w-16 text-right hidden md:block">
                      ↓{" "}
                      {conversionRate(
                        stage.leads,
                        PIPELINE_STAGES[idx + 1].leads
                      )}
                    </span>
                  )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast Summary */}
      <div className="bg-[#111111] border border-yellow-400/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-yellow-400 mb-3">
          Revenue Forecast Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">Best Case</p>
            <p className="text-white font-bold text-lg">
              {fmt(
                PIPELINE_STAGES.slice(0, 5).reduce(
                  (s, st) => s + st.value,
                  0
                )
              )}
            </p>
            <p className="text-[10px] text-gray-600">All active stages close</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Weighted Forecast</p>
            <p className="text-yellow-400 font-bold text-lg">
              {fmt(weightedForecast)}
            </p>
            <p className="text-[10px] text-gray-600">Probability-adjusted</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">Committed (Won)</p>
            <p className="text-green-400 font-bold text-lg">
              {fmt(closedWon.value)}
            </p>
            <p className="text-[10px] text-gray-600">Closed this period</p>
          </div>
        </div>
      </div>
    </div>
  );
}
