"use client";

import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, Bot, Activity, BarChart2 } from "lucide-react";
import { leadsApi, agentApi, scrapersApi, systemApi } from "@/lib/api";
import CommandBar from "@/components/CommandBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: metrics } = useQuery({
    queryKey: ["lead-metrics"],
    queryFn: () => leadsApi.metrics().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: sysStats } = useQuery({
    queryKey: ["sys-stats"],
    queryFn: () => systemApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: plans } = useQuery({
    queryKey: ["agent-plans"],
    queryFn: () => agentApi.listPlans().then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: scraperLogs } = useQuery({
    queryKey: ["scraper-logs-summary"],
    queryFn: () => scrapersApi.getLogs(20).then((r) => r.data),
    refetchInterval: 10000,
  });

  const runningJobs =
    scraperLogs?.filter((j) => j.status === "running").length ?? 0;
  const recentPlans = plans?.slice(0, 5) ?? [];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">XPS Intelligence overview</p>
      </div>

      <CommandBar />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={metrics?.totalLeads?.toLocaleString() ?? "—"}
          icon={Users}
          color="bg-blue-500"
          sub={`Avg score: ${metrics?.avgScore ?? 0}`}
        />
        <StatCard
          title="A+ Opportunities"
          value={metrics?.aPlusOpportunities?.toLocaleString() ?? "—"}
          icon={TrendingUp}
          color="bg-green-500"
          sub="Highest-rated leads"
        />
        <StatCard
          title="Emails Sent"
          value={metrics?.emailsSent?.toLocaleString() ?? "—"}
          icon={Bot}
          color="bg-purple-500"
          sub={`${metrics?.responseRate ?? 0}% response rate`}
        />
        <StatCard
          title="Scraper Jobs"
          value={scraperLogs?.length ?? "—"}
          icon={Activity}
          color="bg-orange-500"
          sub={`${runningJobs} running`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Top Cities by Lead Count
          </h2>
          {sysStats?.topCities && sysStats.topCities.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sysStats.topCities.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Data Coverage
          </h2>
          {sysStats ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={[
                  { label: "Website", count: sysStats.withWebsite },
                  { label: "Phone", count: sysStats.withPhone },
                  { label: "Email", count: sysStats.withEmail },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
              No data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Agent Plans */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Recent Agent Plans
        </h2>
        <div className="space-y-2">
          {recentPlans.length > 0 ? (
            recentPlans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {plan.userCommand}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(plan.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`badge ml-3 shrink-0 ${
                    plan.status === "completed"
                      ? "badge-green"
                      : plan.status === "failed"
                        ? "badge-red"
                        : plan.status === "running"
                          ? "badge-blue"
                          : "badge-gray"
                  }`}
                >
                  {plan.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">
              No agent plans yet. Use the command bar above to run one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
