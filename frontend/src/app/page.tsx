"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Users,
  TrendingUp,
  Bot,
  Mail,
  BarChart2,
  Activity,
} from "lucide-react";
import { leadsApi, agentsApi, scrapersApi } from "@/lib/api";
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
  const { data: stats } = useQuery({
    queryKey: ["lead-stats"],
    queryFn: () => leadsApi.stats().then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: agentsData } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list().then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: scraperStatus } = useQuery({
    queryKey: ["scraper-status"],
    queryFn: () => scrapersApi.status().then((r) => r.data),
    refetchInterval: 10000,
  });

  const runningAgents =
    agentsData?.agents.filter((a) => a.status === "running").length ?? 0;
  const totalAgents = agentsData?.agents.length ?? 5;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Lead intelligence overview</p>
      </div>

      <CommandBar />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={stats?.total_leads?.toLocaleString() ?? "—"}
          icon={Users}
          color="bg-blue-500"
          sub={`Avg score: ${stats?.average_score ?? 0}`}
        />
        <StatCard
          title="High-Value Leads"
          value={stats?.high_value_leads?.toLocaleString() ?? "—"}
          icon={TrendingUp}
          color="bg-green-500"
          sub="Score ≥ 80"
        />
        <StatCard
          title="Active Agents"
          value={`${runningAgents}/${totalAgents}`}
          icon={Bot}
          color="bg-purple-500"
          sub="Running now"
        />
        <StatCard
          title="Pending Jobs"
          value={scraperStatus?.pending ?? "—"}
          icon={Activity}
          color="bg-orange-500"
          sub={`${scraperStatus?.running ?? 0} running`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" />
            Leads by Industry
          </h2>
          {stats?.by_industry && stats.by_industry.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.by_industry.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="industry" tick={{ fontSize: 11 }} />
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
            Leads by State
          </h2>
          {stats?.by_state && stats.by_state.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.by_state.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} />
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

      {/* Agent Status */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          Agent Status
        </h2>
        <div className="space-y-2">
          {agentsData?.agents.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {agent.name.replace(/_/g, " ").toUpperCase()}
                </p>
                <p className="text-xs text-gray-400">{agent.description}</p>
              </div>
              <span
                className={`badge ${
                  agent.status === "running"
                    ? "badge-green"
                    : agent.status === "error"
                      ? "badge-red"
                      : "badge-gray"
                }`}
              >
                {agent.status}
              </span>
            </div>
          ))}
          {!agentsData?.agents.length && (
            <p className="text-sm text-gray-400">Loading agents...</p>
          )}
        </div>
      </div>
    </div>
  );
}
