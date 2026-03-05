'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  averageScore: number;
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a static export, we'll fetch from the JSON files directly
    Promise.all([
      fetch('/data/scored_leads.json').catch(() => ({ json: () => [] })),
      fetch('/data/scoring_report.json').catch(() => ({ json: () => null }))
    ])
      .then(async ([leadsRes, reportRes]) => {
        const leads = await leadsRes.json();
        const report = await reportRes.json();

        if (Array.isArray(leads) && leads.length > 0) {
          const totalLeads = leads.length;
          const hotLeads = leads.filter(l => (l.lead_score || l.score || 0) >= 75).length;
          const warmLeads = leads.filter(l => {
            const score = l.lead_score || l.score || 0;
            return score >= 50 && score < 75;
          }).length;
          const coldLeads = leads.filter(l => (l.lead_score || l.score || 0) < 50).length;
          const averageScore = Math.round(
            leads.reduce((sum, l) => sum + (l.lead_score || l.score || 0), 0) / totalLeads
          );

          setStats({ totalLeads, hotLeads, warmLeads, coldLeads, averageScore });
        } else if (report) {
          setStats({
            totalLeads: report.total_leads || 0,
            hotLeads: report.tiers?.HOT || 0,
            warmLeads: report.tiers?.WARM || 0,
            coldLeads: report.tiers?.COLD || 0,
            averageScore: report.average_score || 0,
          });
        } else {
          setStats({
            totalLeads: 0,
            hotLeads: 0,
            warmLeads: 0,
            coldLeads: 0,
            averageScore: 0,
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setStats({
          totalLeads: 0,
          hotLeads: 0,
          warmLeads: 0,
          coldLeads: 0,
          averageScore: 0,
        });
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm animate-pulse">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      label: 'Total Leads',
      value: stats.totalLeads.toLocaleString(),
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      textColor: 'text-blue-900 dark:text-blue-100',
      accentColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'HOT Leads',
      value: stats.hotLeads.toLocaleString(),
      bgColor: 'bg-red-50 dark:bg-red-950',
      textColor: 'text-red-900 dark:text-red-100',
      accentColor: 'text-red-600 dark:text-red-400',
    },
    {
      label: 'WARM Leads',
      value: stats.warmLeads.toLocaleString(),
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      textColor: 'text-amber-900 dark:text-amber-100',
      accentColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Average Score',
      value: stats.averageScore.toString(),
      bgColor: 'bg-emerald-50 dark:bg-emerald-950',
      textColor: 'text-emerald-900 dark:text-emerald-100',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className={`${card.bgColor} rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800`}>
          <p className={`text-sm font-medium ${card.textColor} opacity-80 mb-1`}>
            {card.label}
          </p>
          <p className={`text-3xl font-bold ${card.accentColor}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
