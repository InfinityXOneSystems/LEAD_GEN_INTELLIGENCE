"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, RefreshCw, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { agentApi, type AgentPlan } from "@/lib/api";

export default function AgentsPage() {
  const qc = useQueryClient();
  const [command, setCommand] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["agent-plans"],
    queryFn: () => agentApi.listPlans().then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: selectedPlan } = useQuery({
    queryKey: ["agent-plan", selectedId],
    queryFn: () => agentApi.getPlan(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
    refetchInterval: 3000,
  });

  const executeMutation = useMutation({
    mutationFn: agentApi.execute,
    onSuccess: (r) => {
      toast.success(`Plan created: ${r.data.id}`);
      qc.invalidateQueries({ queryKey: ["agent-plans"] });
      setSelectedId(r.data.id);
      setCommand("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const displayPlan = selectedPlan ?? plans?.find((p) => p.id === selectedId);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent Plans</h1>
        <p className="text-gray-500 text-sm mt-1">
          Execute natural-language commands and track agent plans
        </p>
      </div>

      {/* Execute Command */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Play className="w-4 h-4" />
          Run a Command
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && command.trim()) {
                executeMutation.mutate(command.trim());
              }
            }}
            placeholder="scrape epoxy contractors in Texas..."
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() =>
              command.trim() && executeMutation.mutate(command.trim())
            }
            disabled={executeMutation.isPending || !command.trim()}
            className="btn-primary"
          >
            <ChevronRight className="w-4 h-4" />
            {executeMutation.isPending ? "Running..." : "Execute"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Plan History
            </h2>
            <button
              onClick={() =>
                qc.invalidateQueries({ queryKey: ["agent-plans"] })
              }
              className="text-gray-400 hover:text-gray-600"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          {isLoading ? (
            <p className="text-gray-400 text-sm">Loading plans...</p>
          ) : !plans?.length ? (
            <p className="text-gray-400 text-sm">
              No plans yet. Run a command above.
            </p>
          ) : (
            plans.map((plan: AgentPlan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedId(plan.id)}
                className={`w-full text-left card p-4 transition-colors ${
                  selectedId === plan.id
                    ? "ring-2 ring-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate flex-1">
                    {plan.userCommand}
                  </p>
                  <span
                    className={`badge shrink-0 ${
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
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(plan.createdAt).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Plan Detail */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {displayPlan
              ? `Plan: ${displayPlan.id}`
              : "Select a plan to inspect"}
          </h2>
          {displayPlan ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <span className="font-medium">Command:</span>{" "}
                {displayPlan.userCommand}
              </div>
              {displayPlan.agentError && (
                <div className="bg-red-50 rounded-lg p-3 text-sm text-red-700">
                  <span className="font-medium">Agent error:</span>{" "}
                  {displayPlan.agentError}
                </div>
              )}
              <div className="bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto font-mono text-xs text-green-400 space-y-2">
                {displayPlan.tasks.length > 0 ? (
                  displayPlan.tasks.map((task, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-blue-400">
                        [{task.type}] {task.description}
                      </div>
                      {task.result && (
                        <div className="text-green-300 pl-4 whitespace-pre-wrap break-all">
                          {task.result.slice(0, 500)}
                          {task.result.length > 500 ? "…" : ""}
                        </div>
                      )}
                      {task.error && (
                        <div className="text-red-400 pl-4">{task.error}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500">No tasks recorded yet</span>
                )}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400 text-sm">
              Click a plan to see its tasks and results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
