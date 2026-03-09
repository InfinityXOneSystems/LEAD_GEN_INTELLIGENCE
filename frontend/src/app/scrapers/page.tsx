"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Play, XCircle, RefreshCw, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { scrapersApi, type ScrapeJob } from "@/lib/api";

function StatusBadge({ status }: { status: ScrapeJob["status"] }) {
  const map: Record<ScrapeJob["status"], string> = {
    pending: "badge-yellow",
    running: "badge-blue",
    completed: "badge-green",
    failed: "badge-red",
    cancelled: "badge-gray",
  };
  return <span className={`badge ${map[status]}`}>{status}</span>;
}

export default function ScrapersPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    query: "",
    city: "",
    state: "",
    industry: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["scrape-jobs"],
    queryFn: () => scrapersApi.listJobs({ page_size: 50 }).then((r) => r.data),
    refetchInterval: 5000,
  });

  const { data: statusData } = useQuery({
    queryKey: ["scraper-status"],
    queryFn: () => scrapersApi.status().then((r) => r.data),
    refetchInterval: 5000,
  });

  const createMutation = useMutation({
    mutationFn: scrapersApi.createJob,
    onSuccess: () => {
      toast.success("Scrape job created");
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
      setForm({ query: "", city: "", state: "", industry: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: scrapersApi.cancelJob,
    onSuccess: () => {
      toast.success("Job cancelled");
      qc.invalidateQueries({ queryKey: ["scrape-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scraper Control</h1>
        <p className="text-gray-500 text-sm mt-1">Manage lead scraping jobs</p>
      </div>

      {/* Status Cards */}
      {statusData && (
        <div className="grid grid-cols-4 gap-4">
          {["pending", "running", "completed", "failed"].map((s) => (
            <div key={s} className="card text-center">
              <p className="text-2xl font-bold text-gray-900">
                {(statusData as Record<string, number>)[s] ?? 0}
              </p>
              <p className="text-sm text-gray-500 capitalize">{s}</p>
            </div>
          ))}
        </div>
      )}

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
          onClick={() => createMutation.mutate(form)}
          disabled={createMutation.isPending || (!form.query && !form.industry)}
          className="btn-primary"
        >
          <Play className="w-4 h-4" />
          {createMutation.isPending ? "Creating..." : "Start Scrape"}
        </button>
      </div>

      {/* Job History */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Job History</h2>
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["scrape-jobs"] })}
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
                  "Query",
                  "Location",
                  "Industry",
                  "Status",
                  "Found",
                  "Processed",
                  "Created",
                  "",
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
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Loading...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No jobs yet
                  </td>
                </tr>
              ) : (
                data?.items.map((job: ScrapeJob) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">
                      {job.query ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {[job.city, job.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.industry ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {job.total_found}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{job.processed}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(job.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {["pending", "running"].includes(job.status) && (
                        <button
                          onClick={() => cancelMutation.mutate(job.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
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
