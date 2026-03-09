import axios from "axios";

// All requests are sent as relative /api/* URLs so that Next.js server-side
// rewrites can proxy them to the Express gateway (NEXT_PUBLIC_API_URL).
// This keeps browser requests same-origin and avoids CORS issues.
export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.error ||
      error.message ||
      "An error occurred";
    return Promise.reject(new Error(message));
  },
);

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Canonical lead record — matches contracts/lead_schema.json */
export interface Lead {
  id?: string | number;
  /** Primary company name field */
  company: string;
  /** Alias used by some scrapers / legacy fields */
  company_name?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  industry?: string;
  category?: string;
  keyword?: string;
  rating?: number;
  reviews?: number;
  /** Canonical scoring field */
  lead_score?: number;
  /** Legacy alias for lead_score */
  score?: number;
  tier?: "HOT" | "WARM" | "COLD";
  status?: "new" | "contacted" | "qualified" | "closed" | "rejected";
  source?: string;
  date_scraped?: string;
  created_at?: string;
  updated_at?: string;
  assignedRep?: string;
  assignedInitials?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  revenue?: number;
}

/** Response shape from GET /api/leads */
export interface LeadListResponse {
  leads: Lead[];
  total: number;
  offset: number;
  limit: number;
}

/** Response shape from GET /api/leads/metrics */
export interface DashboardMetrics {
  totalLeads: number;
  aPlusOpportunities: number;
  emailsSent: number;
  responseRate: number;
  revenuePipeline: number;
  avgScore: number;
}

/** Response shape from GET /api/stats */
export interface SystemStats {
  totalLeads: number;
  avgScore: number;
  topCities: { city: string; count: number }[];
  withWebsite: number;
  withPhone: number;
  withEmail: number;
}

export interface ScraperConfig {
  city?: string;
  category?: string;
  query?: string;
  state?: string;
  industry?: string;
  maxResults?: number;
  sources?: {
    googleMaps?: boolean;
    yelp?: boolean;
    directories?: boolean;
  };
}

/** Response shape from GET /api/scraper/logs and GET /api/scraper/status/:id */
export interface ScraperLog {
  id: string;
  timestamp: string;
  status: "running" | "completed" | "failed";
  message?: string;
  config?: ScraperConfig;
}

export interface AgentTask {
  id: string;
  type: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  result?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

/** Response shape from GET /api/agent/plans */
export interface AgentPlan {
  id: string;
  userCommand: string;
  tasks: AgentTask[];
  createdAt: string;
  status: "pending" | "running" | "completed" | "failed" | "partial";
  agentError?: string;
}

export interface OutreachEntry {
  leadId: string;
  email: string;
  companyName?: string;
  template?: string;
  campaignId?: string | null;
  queuedAt: string;
  status: string;
}

/** Response shape from GET /api/outreach/stats */
export interface OutreachStats {
  total_sent: number;
  last_30_days: number;
  by_channel: { channel: string; count: number }[];
}

export interface OutreachCampaign {
  id: string;
  name: string;
  industry?: string;
  min_score: number;
  template: string;
  target_count: number;
  sent_count: number;
  status: string;
  created_at: string;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

export const leadsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<LeadListResponse>("/leads", { params }),
  get: (id: string) => apiClient.get<Lead>(`/leads/${id}`),
  create: (data: Partial<Lead>) => apiClient.post<Lead>("/leads", data),
  update: (id: string, data: Partial<Lead>) =>
    apiClient.put<Lead>(`/leads/${id}`, data),
  delete: (id: string) => apiClient.delete(`/leads/${id}`),
  /** Dashboard KPI metrics */
  metrics: () => apiClient.get<DashboardMetrics>("/leads/metrics"),
  assign: (
    id: string,
    rep: { repId: string; repName: string; repInitials: string },
  ) => apiClient.post<Lead>(`/leads/${id}/assign`, rep),
  setStatus: (id: string, status: Lead["status"]) =>
    apiClient.put<Lead>(`/leads/${id}/status`, { status }),
  addNote: (id: string, note: string) =>
    apiClient.post(`/leads/${id}/notes`, { note }),
};

export const scrapersApi = {
  /** Start a new scraper job. Returns { jobId }. */
  run: (config: ScraperConfig) =>
    apiClient.post<{ jobId: string }>("/scraper/run", config),
  /** Get status of a specific job by ID. */
  getStatus: (jobId: string) =>
    apiClient.get<ScraperLog>(`/scraper/status/${jobId}`),
  /** List recent scraper job logs. */
  getLogs: (limit = 50) =>
    apiClient.get<ScraperLog[]>("/scraper/logs", { params: { limit } }),
  /** Ingest results from a GitHub Actions worker. */
  ingestResults: (data: {
    job_id: string;
    city?: string;
    category?: string;
    count?: number;
    results: Partial<Lead>[];
  }) => apiClient.post("/scraper/results", data),
};

export const agentApi = {
  listPlans: () => apiClient.get<AgentPlan[]>("/agent/plans"),
  getPlan: (id: string) => apiClient.get<AgentPlan>(`/agent/plans/${id}`),
  /** Execute a natural-language command and return the resulting plan. */
  execute: (command: string) =>
    apiClient.post<AgentPlan>("/agent/plans", { command }),
};

export const outreachApi = {
  /** Queue an outreach email for a lead. */
  send: (data: { leadId: string; template?: string; campaignId?: string }) =>
    apiClient.post<{ queued: boolean; entry: OutreachEntry }>(
      "/outreach/send",
      data,
    ),
  stats: () => apiClient.get<OutreachStats>("/outreach/stats"),
  listCampaigns: (params?: Record<string, unknown>) =>
    apiClient.get<{ campaigns: OutreachCampaign[]; total: number }>(
      "/outreach/campaigns",
      { params },
    ),
  createCampaign: (data: {
    name: string;
    industry?: string;
    min_score?: number;
    template?: string;
  }) => apiClient.post<OutreachCampaign>("/outreach/campaigns", data),
};

export const systemApi = {
  stats: () => apiClient.get<SystemStats>("/stats"),
  pipelineStatus: () => apiClient.get("/pipeline/status"),
  health: () => apiClient.get("/monitoring/health"),
  tools: () => apiClient.get("/tools"),
  scoringReport: () => apiClient.get("/scoring/report"),
  heatmap: () => apiClient.get("/heatmap"),
};

// ─── Backward-compat shims ─────────────────────────────────────────────────────
// These keep any code outside this file that still imports the old names working.

/** @deprecated Use agentApi.execute() */
export const commandsApi = {
  execute: (command: string) => agentApi.execute(command),
};
