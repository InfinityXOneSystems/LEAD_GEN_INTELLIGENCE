"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, Square, FileText, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { agentsApi, type Agent } from "@/lib/api";

export default function AgentsPage() {
  const qc = useQueryClient();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["agents"],
    queryFn: () => agentsApi.list().then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: logsData } = useQuery({
    queryKey: ["agent-logs", selectedAgent],
    queryFn: () => agentsApi.logs(selectedAgent!).then((r) => r.data),
    enabled: !!selectedAgent,
    refetchInterval: 3000,
  });

  const startMutation = useMutation({
    mutationFn: agentsApi.start,
    onSuccess: (_d, name) => {
      toast.success(`Agent ${name} started`);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stopMutation = useMutation({
    mutationFn: agentsApi.stop,
    onSuccess: (_d, name) => {
      toast.success(`Agent ${name} stopped`);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Status</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor and control autonomous agents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Cards */}
        <div className="space-y-3">
          {data?.agents.map((agent: Agent) => (
            <div key={agent.name} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {agent.name.replace(/_/g, " ").toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {agent.description}
                  </p>
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
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => startMutation.mutate(agent.name)}
                  disabled={
                    agent.status === "running" || startMutation.isPending
                  }
                  className="btn-primary text-xs py-1.5"
                >
                  <Play className="w-3 h-3" />
                  Start
                </button>
                <button
                  onClick={() => stopMutation.mutate(agent.name)}
                  disabled={
                    agent.status !== "running" || stopMutation.isPending
                  }
                  className="btn-secondary text-xs py-1.5"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </button>
                <button
                  onClick={() => setSelectedAgent(agent.name)}
                  className="btn-secondary text-xs py-1.5"
                >
                  <FileText className="w-3 h-3" />
                  Logs
                </button>
              </div>
            </div>
          ))}
          {!data?.agents.length && (
            <p className="text-gray-400 text-sm">Loading agents...</p>
          )}
        </div>

        {/* Log Viewer */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              {selectedAgent
                ? `Logs: ${selectedAgent.replace(/_/g, " ")}`
                : "Select an agent to view logs"}
            </h2>
            {selectedAgent && (
              <button
                onClick={() =>
                  qc.invalidateQueries({
                    queryKey: ["agent-logs", selectedAgent],
                  })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs text-green-400 space-y-1">
            {logsData?.logs.length ? (
              [...logsData.logs].reverse().map((log, i) => (
                <div key={i} className="leading-relaxed">
                  {log}
                </div>
              ))
            ) : (
              <span className="text-gray-500">
                {selectedAgent
                  ? "No logs yet"
                  : 'Click "Logs" on an agent to view its activity'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
