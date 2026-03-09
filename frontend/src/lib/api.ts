import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  },
);

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Contractor {
  id: string;
  company_name: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  city?: string;
  state?: string;
  industry?: string;
  keywords?: string[];
  services?: string[];
  rating?: number;
  reviews?: number;
  source?: string;
  lead_score: number;
  last_scraped?: string;
  last_contacted?: string;
  created_at: string;
  updated_at: string;
}

export interface ScrapeJob {
  id: string;
  query?: string;
  city?: string;
  state?: string;
  industry?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  total_found: number;
  processed: number;
  started_at?: string;
  completed_at?: string;
  error_msg?: string;
  created_at: string;
}

export interface Agent {
  name: string;
  status: "idle" | "running" | "error";
  description: string;
  logs: string[];
}

export interface LeadStats {
  total_leads: number;
  average_score: number;
  high_value_leads: number;
  by_industry: { industry: string; count: number }[];
  by_state: { state: string; count: number }[];
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const leadsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Contractor>>("/leads", { params }),
  get: (id: string) => apiClient.get<Contractor>(`/leads/${id}`),
  create: (data: Partial<Contractor>) =>
    apiClient.post<Contractor>("/leads", data),
  update: (id: string, data: Partial<Contractor>) =>
    apiClient.put<Contractor>(`/leads/${id}`, data),
  delete: (id: string) => apiClient.delete(`/leads/${id}`),
  stats: () => apiClient.get<LeadStats>("/leads/stats/summary"),
  exportCsv: (params?: Record<string, unknown>) =>
    apiClient.get("/leads/export/csv", { params, responseType: "blob" }),
};

export const scrapersApi = {
  createJob: (data: {
    query?: string;
    city?: string;
    state?: string;
    industry?: string;
  }) => apiClient.post<ScrapeJob>("/scrapers/jobs", data),
  listJobs: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<ScrapeJob>>("/scrapers/jobs", { params }),
  getJob: (id: string) => apiClient.get<ScrapeJob>(`/scrapers/jobs/${id}`),
  cancelJob: (id: string) =>
    apiClient.post<ScrapeJob>(`/scrapers/jobs/${id}/cancel`),
  status: () => apiClient.get("/scrapers/status"),
};

export const agentsApi = {
  list: () => apiClient.get<{ agents: Agent[] }>("/agents"),
  start: (name: string) => apiClient.post(`/agents/${name}/start`),
  stop: (name: string) => apiClient.post(`/agents/${name}/stop`),
  logs: (name: string) =>
    apiClient.get<{ name: string; logs: string[] }>(`/agents/${name}/logs`),
};

export const commandsApi = {
  execute: (command: string) =>
    apiClient.post<{
      action: string;
      parameters: Record<string, unknown>;
      job_id?: string;
      message: string;
    }>("/commands/execute", { command }),
};
