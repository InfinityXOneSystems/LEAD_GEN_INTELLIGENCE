"use strict";

require("dotenv").config();

const express = require("express");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const ROOT = path.join(__dirname, "..");
const LEADS_DIR = path.join(ROOT, "leads");
const DATA_DIR = path.join(ROOT, "data");

// Default to 3000 so the frontend can reach /api without extra configuration.
// Override with PORT env var (e.g. PORT=3200 for legacy deployments).
const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());

// CORS – allow configured origins; defaults to permissive for local dev
const CORS_ORIGINS = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((s) => s.trim())
  : null;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (CORS_ORIGINS) {
    if (CORS_ORIGINS.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ── helpers ──────────────────────────────────────────────────────────────────

function ok(res, data) {
  return res.json({ success: true, data });
}

function fail(res, error, status = 500) {
  return res.status(status).json({ success: false, error: String(error) });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadLeads() {
  const scored = path.join(LEADS_DIR, "scored_leads.json");
  const raw = path.join(LEADS_DIR, "leads.json");
  if (fs.existsSync(scored)) return readJson(scored);
  if (fs.existsSync(raw)) return readJson(raw);
  return [];
}

function saveLeads(leads) {
  fs.mkdirSync(LEADS_DIR, { recursive: true });
  const raw = path.join(LEADS_DIR, "leads.json");
  fs.writeFileSync(raw, JSON.stringify(leads, null, 2));
}

function generateId() {
  return (
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
}

// ── routes ───────────────────────────────────────────────────────────────────

// GET /api/leads/metrics  (must be before /api/leads/:id)
app.get("/api/leads/metrics", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const total = list.length;
    const aPlusOpportunities = list.filter(
      (l) => (l.rating || l.tier) === "A+",
    ).length;
    const emailsSent = (() => {
      try {
        const q = path.join(DATA_DIR, "outreach", "outreach_queue.json");
        return fs.existsSync(q) ? readJson(q).length : 0;
      } catch (_) {
        return 0;
      }
    })();
    const scores = list
      .map((l) => l.lead_score || l.score || l.opportunityScore || 0)
      .filter(Boolean);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const revenuePipeline = list.reduce(
      (s, l) => s + (l.revenue || 0),
      0,
    );
    return res.json({
      totalLeads: total,
      aPlusOpportunities,
      emailsSent,
      responseRate: total ? Math.round((emailsSent / total) * 100) : 0,
      revenuePipeline,
      avgScore,
    });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/leads
app.get("/api/leads", (req, res) => {
  try {
    const leads = loadLeads();
    const { city, state, minScore, limit = 100, offset = 0 } = req.query;
    let result = Array.isArray(leads) ? leads : [];
    if (city)
      result = result.filter(
        (l) => l.city && l.city.toLowerCase().includes(city.toLowerCase()),
      );
    if (state)
      result = result.filter(
        (l) => l.state && l.state.toLowerCase() === state.toLowerCase(),
      );
    if (minScore)
      result = result.filter((l) => (l.score || 0) >= Number(minScore));
    const total = result.length;
    result = result.slice(Number(offset), Number(offset) + Number(limit));
    return ok(res, {
      leads: result,
      total,
      offset: Number(offset),
      limit: Number(limit),
    });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/leads/:id
app.get("/api/leads/:id", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const lead = list.find(
      (l) => String(l.id) === req.params.id || l.place_id === req.params.id,
    );
    if (!lead) return fail(res, "Lead not found", 404);
    return ok(res, lead);
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/leads
app.post("/api/leads", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const newLead = {
      id: generateId(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.push(newLead);
    saveLeads(list);
    return res.status(201).json(newLead);
  } catch (err) {
    return fail(res, err.message);
  }
});

// PUT /api/leads/:id
app.put("/api/leads/:id", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const idx = list.findIndex(
      (l) =>
        String(l.id) === req.params.id || l.place_id === req.params.id,
    );
    if (idx === -1) return fail(res, "Lead not found", 404);
    list[idx] = {
      ...list[idx],
      ...req.body,
      id: list[idx].id,
      updatedAt: new Date().toISOString(),
    };
    saveLeads(list);
    return res.json(list[idx]);
  } catch (err) {
    return fail(res, err.message);
  }
});

// DELETE /api/leads/:id
app.delete("/api/leads/:id", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const filtered = list.filter(
      (l) =>
        String(l.id) !== req.params.id && l.place_id !== req.params.id,
    );
    if (filtered.length === list.length)
      return fail(res, "Lead not found", 404);
    saveLeads(filtered);
    return res.status(204).send();
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/leads/:id/assign
app.post("/api/leads/:id/assign", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const idx = list.findIndex(
      (l) =>
        String(l.id) === req.params.id || l.place_id === req.params.id,
    );
    if (idx === -1) return fail(res, "Lead not found", 404);
    const { repId, repName, repInitials } = req.body;
    list[idx] = {
      ...list[idx],
      assignedRep: repName || repId,
      assignedInitials: repInitials || "",
      updatedAt: new Date().toISOString(),
    };
    saveLeads(list);
    return res.json(list[idx]);
  } catch (err) {
    return fail(res, err.message);
  }
});

// PUT /api/leads/:id/status
app.put("/api/leads/:id/status", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const idx = list.findIndex(
      (l) =>
        String(l.id) === req.params.id || l.place_id === req.params.id,
    );
    if (idx === -1) return fail(res, "Lead not found", 404);
    list[idx] = {
      ...list[idx],
      status: req.body.status,
      updatedAt: new Date().toISOString(),
    };
    saveLeads(list);
    return res.json(list[idx]);
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/leads/:id/notes
app.post("/api/leads/:id/notes", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const idx = list.findIndex(
      (l) =>
        String(l.id) === req.params.id || l.place_id === req.params.id,
    );
    if (idx === -1) return fail(res, "Lead not found", 404);
    const existing = list[idx].notes || "";
    const ts = new Date().toISOString().slice(0, 10);
    list[idx] = {
      ...list[idx],
      notes: existing
        ? `${existing}\n[${ts}] ${req.body.note}`
        : `[${ts}] ${req.body.note}`,
      updatedAt: new Date().toISOString(),
    };
    saveLeads(list);
    return res.json(list[idx]);
  } catch (err) {
    return fail(res, err.message);
  }
});

// ── Scraper routes ────────────────────────────────────────────────────────────

const scraperJobs = new Map();

// POST /api/scraper/run
app.post("/api/scraper/run", (req, res) => {
  try {
    const jobId = generateId();
    const entry = {
      id: jobId,
      timestamp: new Date().toISOString(),
      status: "running",
      message: "Scraper job queued",
      config: req.body,
    };
    scraperJobs.set(jobId, entry);
    const logsDir = path.join(DATA_DIR, "scraper");
    fs.mkdirSync(logsDir, { recursive: true });
    const logsFile = path.join(logsDir, "scraper_jobs.json");
    let jobs = [];
    if (fs.existsSync(logsFile)) {
      try {
        jobs = readJson(logsFile);
      } catch (_) {}
    }
    jobs.push(entry);
    fs.writeFileSync(logsFile, JSON.stringify(jobs, null, 2));
    return res.json({ jobId });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/scraper/status/:jobId
app.get("/api/scraper/status/:jobId", (req, res) => {
  try {
    const job = scraperJobs.get(req.params.jobId);
    if (job) return res.json(job);
    const logsFile = path.join(DATA_DIR, "scraper", "scraper_jobs.json");
    if (fs.existsSync(logsFile)) {
      const jobs = readJson(logsFile);
      const found = jobs.find((j) => j.id === req.params.jobId);
      if (found) return res.json(found);
    }
    return fail(res, "Job not found", 404);
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/scraper/logs
app.get("/api/scraper/logs", (req, res) => {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const logsFile = path.join(DATA_DIR, "scraper", "scraper_jobs.json");
    let jobs = [];
    if (fs.existsSync(logsFile)) {
      try {
        jobs = readJson(logsFile);
      } catch (_) {}
    }
    return res.json(jobs.slice(-limit).reverse());
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/scraper/results  – ingest results from GitHub Actions worker
app.post("/api/scraper/results", (req, res) => {
  try {
    const { job_id, results = [] } = req.body;
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    let added = 0;
    results.forEach((r) => {
      const exists = list.find(
        (l) =>
          l.phone === r.phone ||
          (l.company === r.company && l.city === r.city),
      );
      if (!exists) {
        list.push({
          id: generateId(),
          company: r.company || r.name,
          phone: r.phone,
          email: r.email,
          website: r.website,
          city: r.city || (r.location || "").split(",")[0],
          state: r.state || (r.location || "").split(",")[1],
          category: r.industry || r.category,
          lead_score: r.lead_score,
          opportunityScore: r.lead_score,
          status: "new",
          rating: r.lead_score >= 75 ? "A+" : r.lead_score >= 50 ? "A" : "B",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        added++;
      }
    });
    saveLeads(list);
    if (job_id && scraperJobs.has(job_id)) {
      scraperJobs.get(job_id).status = "completed";
      scraperJobs.get(job_id).message = `Ingested ${added} new leads`;
    }
    return res.json({ success: true, added, total: list.length });
  } catch (err) {
    return fail(res, err.message);
  }
});

// ── Agent/Plan routes ─────────────────────────────────────────────────────────

// GET /api/agent/plans
app.get("/api/agent/plans", (req, res) => {
  try {
    const plansFile = path.join(DATA_DIR, "agent", "plans.json");
    let plans = [];
    if (fs.existsSync(plansFile)) {
      try {
        plans = readJson(plansFile);
      } catch (_) {}
    }
    return res.json(plans);
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/agent/plans  – create and optionally execute a plan
app.post("/api/agent/plans", async (req, res) => {
  try {
    const { command } = req.body;
    if (!command) return fail(res, "command required", 400);
    const plan = {
      id: generateId(),
      userCommand: command,
      tasks: [],
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    const plansDir = path.join(DATA_DIR, "agent");
    fs.mkdirSync(plansDir, { recursive: true });
    const plansFile = path.join(plansDir, "plans.json");
    let plans = [];
    if (fs.existsSync(plansFile)) {
      try {
        plans = readJson(plansFile);
      } catch (_) {}
    }
    plans.push(plan);
    fs.writeFileSync(plansFile, JSON.stringify(plans, null, 2));
    // Forward to FastAPI agent core if available
    const agentUrl =
      process.env.AGENT_CORE_URL || "http://localhost:8000";
    try {
      const resp = await axios.post(
        `${agentUrl}/chat`,
        { message: command },
        { timeout: 30000 },
      );
      plan.tasks = [
        {
          id: generateId(),
          type: "agent_run",
          description: command,
          status: "completed",
          result: JSON.stringify(resp.data),
          completedAt: new Date().toISOString(),
        },
      ];
      plan.status = "completed";
    } catch (_agentErr) {
      plan.status = "partial";
    }
    return res.json(plan);
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/agent/plans/:id
app.get("/api/agent/plans/:id", (req, res) => {
  try {
    const plansFile = path.join(DATA_DIR, "agent", "plans.json");
    let plans = [];
    if (fs.existsSync(plansFile)) {
      try {
        plans = readJson(plansFile);
      } catch (_) {}
    }
    const plan = plans.find((p) => p.id === req.params.id);
    if (!plan) return fail(res, "Plan not found", 404);
    return res.json(plan);
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/tools
app.get("/api/tools", (req, res) => {
  return res.json([
    {
      id: "google-maps",
      name: "Google Maps Scraper",
      description: "Scrape contractor leads from Google Maps",
      category: "crawler",
      enabled: true,
      configurable: true,
    },
    {
      id: "yelp",
      name: "Yelp Scraper",
      description: "Scrape contractor leads from Yelp",
      category: "crawler",
      enabled: true,
      configurable: true,
    },
    {
      id: "github-actions",
      name: "GitHub Actions",
      description: "Trigger autonomous pipeline workflows",
      category: "github",
      enabled: true,
      configurable: true,
    },
    {
      id: "email-outreach",
      name: "Email Outreach",
      description: "Send personalised outreach emails via Nodemailer",
      category: "communication",
      enabled: true,
      configurable: true,
    },
    {
      id: "lead-scoring",
      name: "Lead Scoring Engine",
      description: "Score and tier leads by quality signals",
      category: "data",
      enabled: true,
      configurable: false,
    },
  ]);
});

// GET /api/stats
app.get("/api/stats", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const scores = list.map((l) => l.score || 0).filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const cityCount = {};
    list.forEach((l) => {
      if (l.city) cityCount[l.city] = (cityCount[l.city] || 0) + 1;
    });
    const topCities = Object.entries(cityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([city, count]) => ({ city, count }));

    return ok(res, {
      totalLeads: list.length,
      avgScore,
      topCities,
      withWebsite: list.filter((l) => l.website).length,
      withPhone: list.filter((l) => l.phone).length,
      withEmail: list.filter((l) => l.email).length,
    });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/pipeline/status
app.get("/api/pipeline/status", (req, res) => {
  try {
    const checks = [];

    const leadsFile = path.join(LEADS_DIR, "leads.json");
    const scoredFile = path.join(LEADS_DIR, "scored_leads.json");
    checks.push({ component: "raw_leads", ok: fs.existsSync(leadsFile) });
    checks.push({ component: "scored_leads", ok: fs.existsSync(scoredFile) });

    const progressFile = path.join(DATA_DIR, "scraper_progress.json");
    let lastRun = null;
    if (fs.existsSync(progressFile)) {
      try {
        const p = readJson(progressFile);
        lastRun = p.lastRun || p.timestamp || null;
      } catch (_) {}
    }

    const healthy = checks.every((c) => c.ok);
    return ok(res, {
      status: healthy ? "healthy" : "degraded",
      checks,
      lastRun,
    });
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/pipeline/run
app.post("/api/pipeline/run", async (req, res) => {
  const token = process.env.GITHUB_TOKEN || req.headers["x-github-token"];
  if (!token) return fail(res, "GITHUB_TOKEN required", 401);

  const owner = process.env.GITHUB_OWNER || "InfinityXOneSystems";
  const repo = process.env.GITHUB_REPO || "XPS_INTELLIGENCE_SYSTEM";
  const workflow = req.body.workflow || "score_leads.yml";

  try {
    const resp = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`,
      { ref: req.body.ref || "main", inputs: req.body.inputs || {} },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    return ok(res, { triggered: true, workflow, status: resp.status });
  } catch (err) {
    return fail(res, err.response ? err.response.data.message : err.message);
  }
});

// GET /api/scoring/report
app.get("/api/scoring/report", (req, res) => {
  try {
    const reportFile = path.join(LEADS_DIR, "scoring_report.json");
    if (!fs.existsSync(reportFile))
      return fail(res, "Scoring report not found", 404);
    return ok(res, readJson(reportFile));
  } catch (err) {
    return fail(res, err.message);
  }
});

// POST /api/outreach/send
app.post("/api/outreach/send", async (req, res) => {
  const { leadId, template, campaignId } = req.body;
  if (!leadId) return fail(res, "leadId required", 400);
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];
    const lead = list.find(
      (l) => String(l.id) === String(leadId) || l.place_id === String(leadId),
    );
    if (!lead) return fail(res, "Lead not found", 404);
    if (!lead.email) return fail(res, "Lead has no email address", 400);

    const logDir = path.join(DATA_DIR, "outreach");
    fs.mkdirSync(logDir, { recursive: true });
    const entry = {
      leadId,
      email: lead.email,
      companyName: lead.name || lead.company_name,
      template: template || "default",
      campaignId: campaignId || null,
      queuedAt: new Date().toISOString(),
      status: "queued",
    };

    const logFile = path.join(logDir, "outreach_queue.json");
    let queue = [];
    if (fs.existsSync(logFile)) {
      try {
        queue = readJson(logFile);
      } catch (_) {}
    }
    queue.push(entry);
    fs.writeFileSync(logFile, JSON.stringify(queue, null, 2));

    return ok(res, { queued: true, entry });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/monitoring/health
app.get("/api/monitoring/health", (req, res) => {
  try {
    const reportFile = path.join(DATA_DIR, "monitor", "health_reports.json");
    let latest = null;
    if (fs.existsSync(reportFile)) {
      try {
        const reports = readJson(reportFile);
        const arr = Array.isArray(reports) ? reports : [];
        latest = arr[arr.length - 1] || null;
      } catch (_) {}
    }
    return ok(res, {
      gateway: "running",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      lastHealthReport: latest,
    });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api/heatmap
app.get("/api/heatmap", (req, res) => {
  try {
    const leads = loadLeads();
    const list = Array.isArray(leads) ? leads : [];

    const cityMap = {};
    list.forEach((l) => {
      const key = `${l.city || "Unknown"}, ${l.state || ""}`.trim();
      if (!cityMap[key])
        cityMap[key] = {
          city: l.city,
          state: l.state,
          count: 0,
          totalScore: 0,
          leads: [],
        };
      cityMap[key].count += 1;
      cityMap[key].totalScore += l.score || 0;
      if (cityMap[key].leads.length < 5)
        cityMap[key].leads.push({
          id: l.id || l.place_id,
          name: l.name || l.company_name,
        });
    });

    const heatmap = Object.values(cityMap)
      .map((c) => ({
        ...c,
        avgScore: c.count ? Math.round(c.totalScore / c.count) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return ok(res, {
      heatmap,
      totalCities: heatmap.length,
      totalLeads: list.length,
    });
  } catch (err) {
    return fail(res, err.message);
  }
});

// GET /api  – root health check (used by frontend to verify connectivity)
app.get("/api", (req, res) => {
  return res.json({
    success: true,
    service: "XPS Intelligence API Gateway",
    version: "2.0.0",
    status: "running",
    port: PORT,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/status  – alias for health check (some UIs expect this path)
app.get("/api/status", (req, res) => {
  const leads = loadLeads();
  const list = Array.isArray(leads) ? leads : [];
  return res.json({
    success: true,
    gateway: "running",
    uptime: process.uptime(),
    leads_available: list.length,
    timestamp: new Date().toISOString(),
  });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
});

function start() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`[API Gateway] Running on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

module.exports = { app, start };

if (require.main === module) {
  start().catch((err) => {
    console.error("[API Gateway] Failed to start:", err.message);
    process.exit(1);
  });
}
