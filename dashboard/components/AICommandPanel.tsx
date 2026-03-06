"use client";

import { useState, useEffect } from "react";
import { IconSearch, IconShield, IconLayers, IconBarChart, IconMail, IconClock, IconMonitor, IconList, IconPlay, IconActivity } from "@/components/Icons";

interface Agent {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: "Active" | "Idle" | "Standby";
  tasks: number;
  uptime: string;
  description: string;
}

const INITIAL_AGENTS: Agent[] = [
  {
    id: "scraper",
    name: "Scraper Agent",
    icon: <IconSearch className="w-5 h-5" />,
    status: "Active",
    tasks: 1247,
    uptime: "14h 32m",
    description: "Discovers leads via web scraping",
  },
  {
    id: "validator",
    name: "Validation Engine",
    icon: <IconShield className="w-5 h-5" />,
    status: "Active",
    tasks: 1183,
    uptime: "14h 32m",
    description: "Validates & deduplicates leads",
  },
  {
    id: "enricher",
    name: "Enrichment Agent",
    icon: <IconLayers className="w-5 h-5" />,
    status: "Idle",
    tasks: 892,
    uptime: "12h 15m",
    description: "Enriches leads with additional data",
  },
  {
    id: "scorer",
    name: "Scoring Engine",
    icon: <IconBarChart className="w-5 h-5" />,
    status: "Active",
    tasks: 1183,
    uptime: "14h 32m",
    description: "Scores and tiers all leads",
  },
  {
    id: "outreach",
    name: "Outreach Bot",
    icon: <IconMail className="w-5 h-5" />,
    status: "Standby",
    tasks: 234,
    uptime: "8h 45m",
    description: "Automates email outreach campaigns",
  },
];

const PIPELINE_STAGES = [
  { id: "scrape", label: "Scrape", icon: <IconSearch className="w-3.5 h-3.5" />, status: "done" },
  { id: "validate", label: "Validate", icon: <IconShield className="w-3.5 h-3.5" />, status: "done" },
  { id: "enrich", label: "Enrich", icon: <IconLayers className="w-3.5 h-3.5" />, status: "running" },
  { id: "score", label: "Score", icon: <IconBarChart className="w-3.5 h-3.5" />, status: "queued" },
  { id: "outreach", label: "Outreach", icon: <IconMail className="w-3.5 h-3.5" />, status: "queued" },
];

const SCHEDULE = [
  { stage: "Full Pipeline", next: "in 1h 48m", cron: "*/4 * * * *" },
  { stage: "Scraper Only", next: "in 48m", cron: "0 */2 * * *" },
  { stage: "National Discovery", next: "tomorrow 2:00 AM", cron: "0 2 * * *" },
  { stage: "Outreach Queue", next: "in 2h 15m", cron: "0 */3 * * *" },
];

const ACTIVITY_LOG = [
  { time: "14:58", agent: "Validation Engine", action: "Processed 23 new leads from Columbus OH batch" },
  { time: "14:45", agent: "Scraper Agent", action: "Completed Google Maps scrape — 47 results" },
  { time: "14:30", agent: "Scoring Engine", action: "Rescored 847 leads — 134 tier upgrades" },
  { time: "14:15", agent: "Outreach Bot", action: "Sent 12 follow-up emails" },
  { time: "14:00", agent: "Enrichment Agent", action: "Found 8 email addresses via website parsing" },
  { time: "13:45", agent: "Scraper Agent", action: "Started Bing Maps scrape for Cleveland OH" },
];

function statusClass(s: string) {
  if (s === "Active" || s === "done") return "status-active";
  if (s === "running") return "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30";
  if (s === "Standby") return "text-blue-400 bg-blue-400/10 border border-blue-400/30";
  return "status-idle";
}

function pipelineStageClass(s: string) {
  if (s === "done") return "bg-green-400/10 border-green-400/40 text-green-400";
  if (s === "running") return "bg-yellow-400/10 border-yellow-400/40 text-yellow-400";
  return "bg-[#1a1a1a] border-[#2a2a2a] text-gray-500";
}

export default function AICommandPanel() {
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [health, setHealth] = useState({ cpu: 23, memory: 41, queue: 14 });
  const [triggeringAgent, setTriggeringAgent] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth({
        cpu: Math.floor(15 + Math.random() * 30),
        memory: Math.floor(35 + Math.random() * 20),
        queue: Math.floor(8 + Math.random() * 20),
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerAgent = (agentId: string) => {
    setTriggeringAgent(agentId);
    setTimeout(() => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, status: "Active" as const, tasks: a.tasks + 1 } : a,
        ),
      );
      setTriggeringAgent(null);
    }, 1500);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">AI Orchestration Center</h2>
          <p className="text-sm text-gray-500 mt-0.5">Autonomous lead intelligence command center</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />
          <span className="text-sm text-green-400">System Online</span>
        </div>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card gold-glow-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-400/70">{agent.icon}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusClass(agent.status)}`}>
                {agent.status}
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-1">{agent.name}</div>
            <div className="text-xs text-gray-500 mb-3">{agent.description}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Tasks</span>
                <span className="text-yellow-400 font-semibold">{agent.tasks.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Uptime</span>
                <span className="text-gray-300">{agent.uptime}</span>
              </div>
            </div>
            <button
              onClick={() => triggerAgent(agent.id)}
              disabled={triggeringAgent === agent.id}
              className="w-full mt-3 py-1.5 text-xs flex items-center justify-center gap-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 transition-all disabled:opacity-40"
            >
              <IconPlay className="w-3 h-3" />
              {triggeringAgent === agent.id ? "Starting…" : "Trigger"}
            </button>
          </div>
        ))}
      </div>

      {/* Pipeline Visualization */}
      <div className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Pipeline Status</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {PIPELINE_STAGES.map((stage, i) => (
            <span key={stage.id} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium ${pipelineStageClass(stage.status)}`}>
                {stage.icon}
                <span>{stage.label}</span>
                {stage.status === "running" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                )}
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <svg className={`w-3 h-3 ${stage.status === "done" ? "text-green-400" : "text-gray-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Row: Schedule + Health + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Schedule */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconClock className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Schedule</h3>
          </div>
          <div className="space-y-3">
            {SCHEDULE.map((s) => (
              <div key={s.stage} className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-white">{s.stage}</div>
                  <div className="text-[10px] font-mono text-gray-600 mt-0.5">{s.cron}</div>
                </div>
                <div className="text-xs text-yellow-400 text-right">{s.next}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconMonitor className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">System Health</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "CPU", value: health.cpu, color: "bg-yellow-400", suffix: "%" },
              { label: "Memory", value: health.memory, color: "bg-blue-400", suffix: "%" },
              { label: "Queue Depth", value: health.queue, color: "bg-green-400", suffix: " jobs", max: 50 },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{m.label}</span>
                  <span className="text-white">{m.value}{m.suffix}</span>
                </div>
                <div className="w-full bg-[#2a2a2a] rounded-full h-1.5">
                  <div
                    className={`${m.color} h-1.5 rounded-full transition-all duration-500`}
                    style={{ width: `${(m.value / (m.max || 100)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[#1a1a1a]">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
              All systems nominal
            </div>
          </div>
        </div>

        {/* Activity Log */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <IconList className="w-4 h-4 text-yellow-400" />
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="space-y-2.5">
            {ACTIVITY_LOG.map((entry, i) => (
              <div key={i} className="border-b border-[#1a1a1a] last:border-0 pb-2 last:pb-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-gray-600">{entry.time}</span>
                  <span className="text-[10px] text-yellow-400 font-medium">{entry.agent}</span>
                </div>
                <div className="text-xs text-gray-400">{entry.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

