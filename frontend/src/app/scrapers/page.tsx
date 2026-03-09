"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, RefreshCw, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { scrapersApi, type ScraperLog } from "@/lib/api";

function StatusBadge({ status }: { status: ScraperLog["status"] }) {
  const map: Record<ScraperLog["status"], string> = {
    running: "badge-blue",
    completed: "badge-green",
    failed: "badge-red",
  };
  return (
    <span className={`badge ${map[status] ?? "badge-gray"}`}>{status}</span>
  );
}

export default function ScrapersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    query: "",
    city: "",
    state: "",
    industry: "",
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["scraper-logs"],
    queryFn: () => scrapersApi.getLogs(50).then((r) => r.data),
    refetchInterval: 5000,
  });

  const runMutation = useMutation({
    mutationFn: scrapersApi.run,
    onSuccess: (r) => {
      toast.success(`Scrape job started (ID: ${r.data.jobId})`);
      qc.invalidateQueries({ queryKey: ["scraper-logs"] });
      setForm({ query: "", city: "", state: "", industry: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = logs?.filter((j) => j.status === "running").length ?? 0;
  const completed = logs?.filter((j) => j.status === "completed").length ?? 0;
  const failed = logs?.filter((j) => j.status === "failed").length ?? 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scraper Control</h1>
        <p className="text-gray-500 text-sm mt-1">Manage lead scraping jobs</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{pending}</p>
          <p className="text-sm text-gray-500">Running</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{completed}</p>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{failed}</p>
          <p className="text-sm text-gray-500">Failed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">
            {logs?.length ?? 0}
          </p>
          <p className="text-sm text-gray-500">Total Jobs</p>
        </div>
      </div>

      {/* New Job Form */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Scrape Job
        </h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          {(["query", "city", "state", "industry"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                {field}
              </label>
              <input
                type="text"
                value={form[field]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [field]: e.target.value }))
                }
                placeholder={
                  field === "query"
                    ? "epoxy contractors"
                    : field === "state"
                      ? "TX"
                      : field
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
        <button
          onClick={() =>
            runMutation.mutate({
              query: form.query || undefined,
              city: form.city || undefined,
              state: form.state || undefined,
              industry: form.industry || undefined,
            })
          }
          disabled={
            runMutation.isPending ||
            (!form.query && !form.industry && !form.city)
          }
          className="btn-primary"
        >
          <Play className="w-4 h-4" />
          {runMutation.isPending ? "Starting..." : "Start Scrape"}
        </button>
      </div>

      {/* Job Log */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Job History</h2>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["scraper-logs"] })}
            className="btn-secondary py-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "ID",
                  "Query / Category",
                  "Location",
                  "Status",
                  "Message",
                  "Timestamp",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : !logs?.length ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No jobs yet
                  </td>
                </tr>
              ) : (
                logs.map((job: ScraperLog) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[90px] truncate">
                      {job.id}
                    </td>
                    <td className="px-4 py-3 text-gray-900 max-w-[180px] truncate">
                      {job.config?.query ?? job.config?.category ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[job.config?.city, job.config?.state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">
                      {job.message ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(job.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
