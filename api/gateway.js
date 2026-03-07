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

const PORT = process.env.PORT || 3200;

const app = express();
app.use(express.json());

// CORS – allow all origins for development
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
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

// ── routes ───────────────────────────────────────────────────────────────────

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
