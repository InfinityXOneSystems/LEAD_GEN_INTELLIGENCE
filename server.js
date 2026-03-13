"use strict";

require("dotenv").config();

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();

// Allow all origins — required for Vercel/GitHub Pages frontend access
app.use(cors());
app.use(express.json());

// ── Lead data helpers ────────────────────────────────────────────────────────

const ROOT = path.join(__dirname);
const LEADS_DIR = path.join(ROOT, "leads");

/** Determine tier label from numeric score. */
function tierFromScore(score) {
  if (score >= 75) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}

/**
 * Normalise a raw scraper/Supabase lead into the API response shape.
 * Accepts both canonical (company_name, lead_score) and legacy (company, score) keys.
 */
function normalizeLeadForApi(lead, index) {
  const company = lead.company_name || lead.company || "";
  const score = parseInt(lead.lead_score || lead.score || 0, 10);
  const city = lead.city || "";
  const state = lead.state || "";
  const location = [city, state].filter(Boolean).join(", ") || lead.address || "";
  const industry = lead.industry || lead.category || lead.keyword || "";
  const tier = (lead.tier || "").toLowerCase();
  const status = tier || tierFromScore(score);

  return {
    id: lead.id || lead._id || String(index + 1),
    company,
    email: lead.email || null,
    phone: lead.phone || null,
    score,
    location,
    industry,
    status,
    // extra fields useful for dashboards
    website: lead.website || null,
    rating: lead.rating != null ? parseFloat(lead.rating) : null,
    reviews: lead.reviews != null ? parseInt(lead.reviews, 10) : null,
    source: lead.source || null,
    scrapedAt: lead.scrapedAt || lead.date_scraped || null,
  };
}

/** Read and parse a JSON file; return [] on any error. */
function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : (parsed.leads || parsed.data || []);
  } catch (_) {
    return [];
  }
}

/** Load leads from local JSON files produced by the shadow scraper pipeline. */
function loadLeadsFromFile() {
  const scored = path.join(LEADS_DIR, "scored_leads.json");
  const raw = path.join(LEADS_DIR, "leads.json");
  if (fs.existsSync(scored)) return readJsonSafe(scored);
  if (fs.existsSync(raw)) return readJsonSafe(raw);
  return [];
}

// Lazy Supabase client (only when configured)
let _supabaseStore = null;
function getSupabaseStore() {
  if (_supabaseStore) return _supabaseStore;
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  if (url && key) {
    try {
      _supabaseStore = require("./db/supabaseLeadStore");
    } catch (err) {
      console.warn("[server] Could not load supabaseLeadStore:", err.message);
    }
  }
  return _supabaseStore;
}

/**
 * Fetch leads from Supabase when configured, otherwise load from scraped JSON
 * files produced by the shadow scraper pipeline.
 */
async function fetchLeads({ limit = 500, industry, minScore, tier } = {}) {
  const store = getSupabaseStore();
  let leads = [];

  if (store) {
    try {
      leads = await store.getAllLeads(limit);
    } catch (err) {
      console.warn("[server] Supabase unavailable, falling back to file:", err.message);
      leads = loadLeadsFromFile();
    }
  } else {
    leads = loadLeadsFromFile();
  }

  // Normalize to API shape
  let normalized = leads.map((lead, index) => normalizeLeadForApi(lead, index));

  // Apply filters
  if (industry) {
    const q = industry.toLowerCase();
    normalized = normalized.filter(
      (l) => l.industry && l.industry.toLowerCase().includes(q),
    );
  }
  if (minScore != null) {
    const min = parseInt(minScore, 10);
    if (!isNaN(min)) normalized = normalized.filter((l) => l.score >= min);
  }
  if (tier) {
    const t = tier.toLowerCase();
    normalized = normalized.filter((l) => l.status === t);
  }

  return normalized.slice(0, limit);
}

// Initialise Groq client lazily (only when GROQ_API_KEY is present)
let _groqClient = null;
function getGroqClient() {
  if (!_groqClient) {
    const Groq = require("groq-sdk");
    _groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groqClient;
}

// ── Health check ────────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    backend: "XPS Intelligence",
  });
});

// ── Chat endpoint (Groq LLM) ────────────────────────────────────────────────

app.post("/api/chat/send", async (req, res) => {
  const { message, agentRole, sessionId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "message is required" });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return res.status(503).json({ error: "GROQ_API_KEY not configured" });
  }

  try {
    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are XPS Intelligence Agent. Role: ${agentRole || "General"}. Provide actionable insights for contractor lead generation.`,
        },
        { role: "user", content: message },
      ],
      max_tokens: 1024,
    });

    const replyContent =
      completion.choices[0]?.message?.content || "No response";
    const replyId = crypto.randomUUID();
    const msgId = crypto.randomUUID();

    return res.json({
      id: msgId,
      reply: {
        id: replyId,
        role: "assistant",
        content: replyContent,
        agentRole: agentRole || "GeneralAgent",
        timestamp: new Date().toISOString(),
        status: "sent",
      },
      agentRole: agentRole || "GeneralAgent",
      sessionId: sessionId || crypto.randomUUID(),
    });
  } catch (err) {
    console.error("[Chat] Error:", err.message);
    return res
      .status(500)
      .json({ error: "Chat request failed" });
  }
});

// ── Leads endpoint ──────────────────────────────────────────────────────────

app.get("/api/leads", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 500;
    const { industry, minScore, tier } = req.query;
    const leads = await fetchLeads({ limit, industry, minScore, tier });
    return res.json(leads);
  } catch (err) {
    console.error("[Leads] Error:", err.message);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
});

// ── Agents endpoint ─────────────────────────────────────────────────────────

app.get("/api/agents", (_req, res) => {
  const agents = [
    {
      role: "PlannerAgent",
      status: "idle",
      tasksCompleted: 42,
      successRate: 0.95,
      lastActivity: new Date(Date.now() - 60000).toISOString(),
    },
    {
      role: "ScraperAgent",
      status: "running",
      tasksCompleted: 156,
      successRate: 0.92,
      lastActivity: new Date().toISOString(),
    },
    {
      role: "EnrichmentAgent",
      status: "idle",
      tasksCompleted: 89,
      successRate: 0.98,
      lastActivity: new Date(Date.now() - 120000).toISOString(),
    },
    {
      role: "ValidatorAgent",
      status: "idle",
      tasksCompleted: 203,
      successRate: 0.94,
      lastActivity: new Date(Date.now() - 30000).toISOString(),
    },
  ];

  return res.json(agents);
});

// ── 404 catch-all ────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Start server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`[XPS Intelligence] Server running on port ${PORT}`);
});

module.exports = app;
