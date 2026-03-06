"use client";

import { useState, useEffect } from "react";
import {
  IconTarget,
  IconFire,
  IconBolt,
  IconSnowflake,
  IconBarChart,
} from "@/components/Icons";

interface Stats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
}

const SPARK_BARS = [3, 6, 4, 8, 5, 9, 7, 10, 8, 12];

function SparkBars({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {SPARK_BARS.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm opacity-60 ${color}`}
          style={{ height: `${(h / 12) * 100}%` }}
        />
      ))}
    </div>
  );
}

const EMPTY_STATS: Stats = {
  totalLeads: 0,
  hotLeads: 0,
  warmLeads: 0,
  coldLeads: 0,
  averageScore: 0,
};

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/data/scored_leads.json").catch(() => ({ json: () => [] })),
      fetch("/data/scoring_report.json").catch(() => ({ json: () => null })),
    ])
      .then(async ([leadsRes, reportRes]) => {
        const leads = await leadsRes.json();
        const report = await reportRes.json();

        if (Array.isArray(leads) && leads.length > 0) {
          const totalLeads = leads.length;
          const hotLeads = leads.filter(
            (l) => (l.lead_score || l.score || 0) >= 75,
          ).length;
          const warmLeads = leads.filter((l) => {
            const score = l.lead_score || l.score || 0;
            return score >= 50 && score < 75;
          }).length;
          const coldLeads = leads.filter(
            (l) => (l.lead_score || l.score || 0) < 50,
          ).length;
          const averageScore = Math.round(
            leads.reduce((sum, l) => sum + (l.lead_score || l.score || 0), 0) /
              totalLeads,
          );
          setStats({
            totalLeads,
            hotLeads,
            warmLeads,
            coldLeads,
            averageScore,
          });
        } else if (report) {
          setStats({
            totalLeads: report.total_leads || 0,
            hotLeads: report.tiers?.HOT || 0,
            warmLeads: report.tiers?.WARM || 0,
            coldLeads: report.tiers?.COLD || 0,
            averageScore: report.average_score || 0,
          });
        } else {
          setStats(EMPTY_STATS);
        }
        setLoading(false);
      })
      .catch(() => {
        setStats(EMPTY_STATS);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="glass-card gold-glow-card rounded-2xl p-4 animate-pulse"
          >
            <div className="h-3 bg-yellow-400/10 rounded w-1/2 mb-3" />
            <div className="h-8 bg-yellow-400/10 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      label: "Total Leads",
      value: stats.totalLeads.toLocaleString(),
      icon: <IconTarget className="w-4 h-4" />,
      valueColor: "text-yellow-400",
      sparkColor: "bg-yellow-400",
      change: "+12%",
      changePos: true,
    },
    {
      label: "HOT Leads",
      value: stats.hotLeads.toLocaleString(),
      icon: <IconFire className="w-4 h-4" />,
      valueColor: "text-red-400",
      sparkColor: "bg-red-400",
      change: "+8%",
      changePos: true,
    },
    {
      label: "WARM Leads",
      value: stats.warmLeads.toLocaleString(),
      icon: <IconBolt className="w-4 h-4" />,
      valueColor: "text-orange-400",
      sparkColor: "bg-orange-400",
      change: "+5%",
      changePos: true,
    },
    {
      label: "COLD Leads",
      value: stats.coldLeads.toLocaleString(),
      icon: <IconSnowflake className="w-4 h-4" />,
      valueColor: "text-blue-400",
      sparkColor: "bg-blue-400",
      change: "-2%",
      changePos: false,
    },
    {
      label: "Avg Score",
      value: stats.averageScore.toString(),
      icon: <IconBarChart className="w-4 h-4" />,
      valueColor: "text-green-400",
      sparkColor: "bg-green-400",
      change: "+3pts",
      changePos: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {cards.map((card, i) => (
        <div
          key={i}
          className="glass-card gold-glow-card rounded-2xl p-4 relative overflow-hidden cursor-default select-none"
        >
          {/* Live dot */}
          <div className="absolute top-3 right-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot block" />
          </div>

          {/* Icon + label */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-gray-500">{card.icon}</span>
            <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider leading-none">
              {card.label}
            </span>
          </div>

          {/* Value */}
          <div
            className={`text-3xl font-black ${card.valueColor} mb-2 leading-none`}
          >
            {card.value}
          </div>

          {/* Change + sparkline */}
          <div className="flex items-end justify-between">
            <span
              className={`text-xs font-semibold ${card.changePos ? "text-green-400" : "text-red-400"}`}
            >
              {card.change}
            </span>
            <SparkBars color={card.sparkColor} />
          </div>
        </div>
      ))}
    </div>
  );
}
