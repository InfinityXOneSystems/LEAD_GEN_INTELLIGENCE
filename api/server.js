"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MAX_CHAT_HISTORY_LENGTH = 20;

// In-memory chat history store keyed by sessionId
const chatHistories = new Map();

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

const app = express();

app.use(
  cors({
    origin: [
      "https://xps-intelligence-frontend.vercel.app",
      "https://infinityxonesystems.github.io",
      /\.vercel\.app$/,
      /\.railway\.app$/,
      "http://localhost:3000",
      "http://localhost:5173",
    ],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_LEADS = [
  {
    id: "1",
    company: "ABC Roofing Inc",
    email: "contact@abcroofing.com",
    phone: "555-0123",
    score: 92,
    location: "Dallas, TX",
    industry: "Roofing",
    status: "hot",
  },
  {
    id: "2",
    company: "XYZ Flooring Services",
    email: "info@xyzflooring.com",
    phone: "555-0456",
    score: 87,
    location: "Miami, FL",
    industry: "Flooring",
    status: "hot",
  },
  {
    id: "3",
    company: "Premier Tile & Stone",
    email: "sales@premiertile.com",
    phone: "555-0789",
    score: 74,
    location: "Houston, TX",
    industry: "Flooring",
    status: "warm",
  },
  {
    id: "4",
    company: "Elite Hardwood Floors",
    email: "hello@elitehardwood.com",
    phone: "555-0321",
    score: 68,
    location: "Atlanta, GA",
    industry: "Flooring",
    status: "warm",
  },
  {
    id: "5",
    company: "Sunshine Contractors LLC",
    email: "office@sunshinecontractors.com",
    phone: "555-0654",
    score: 45,
    location: "Phoenix, AZ",
    industry: "General Contractor",
    status: "cold",
  },
];

const MOCK_AGENTS = [
  {
    role: "PlannerAgent",
    status: "idle",
    tasksCompleted: 42,
    successRate: 0.95,
    lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    role: "ScraperAgent",
    status: "running",
    tasksCompleted: 156,
    successRate: 0.92,
    lastActivity: new Date(Date.now() - 30 * 1000).toISOString(),
  },
  {
    role: "EnrichmentAgent",
    status: "idle",
    tasksCompleted: 89,
    successRate: 0.98,
    lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  },
  {
    role: "ValidatorAgent",
    status: "idle",
    tasksCompleted: 203,
    successRate: 0.94,
    lastActivity: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId() {
  // Use cryptographically secure random bytes and encode as base64url, then trim.
  // 9 random bytes → 72 bits of entropy, more than sufficient for a short session ID.
  return crypto.randomBytes(9).toString("base64url").slice(0, 11);
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/health
 * Health check — no auth required; used by Railway healthcheckPath
 */
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    backend: "XPS Intelligence API",
    version: "1.0.0",
    groq: GROQ_API_KEY ? "configured" : "not configured",
  });
});

/**
 * GET /health
 * Top-level alias (some load balancers probe the root path)
 */
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

/**
 * POST /api/chat/send
 * Groq-powered chat endpoint
 * Body: { message, agentRole?, sessionId? }
 */
app.post("/api/chat/send", async (req, res) => {
  const { message, agentRole = "GeneralAgent", sessionId = generateId() } =
    req.body || {};

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "message is required" });
  }

  if (!GROQ_API_KEY) {
    return res.status(503).json({
      error: "GROQ_API_KEY is not configured on the server",
    });
  }

  try {
    // Lazy-require so the module is only loaded when needed and after env setup
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const systemPrompt = `You are an XPS Intelligence AI Agent operating in the role of ${agentRole}. \
You specialise in contractor lead generation for the flooring and construction industries. \
Provide concise, actionable insights.`;

    // Build message history for context
    const history = chatHistories.get(sessionId) || [];
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message.trim() },
    ];

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    const assistantContent =
      completion.choices[0]?.message?.content || "No response generated.";

    // Persist both turns in history (cap at MAX_CHAT_HISTORY_LENGTH to avoid unbounded growth)
    const updatedHistory = [
      ...history,
      { role: "user", content: message.trim(), timestamp: new Date().toISOString() },
      { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() },
    ].slice(-MAX_CHAT_HISTORY_LENGTH);
    chatHistories.set(sessionId, updatedHistory);

    const replyId = generateId();
    return res.status(200).json({
      id: replyId,
      reply: {
        id: generateId(),
        role: "assistant",
        content: assistantContent,
        agentRole,
        timestamp: new Date().toISOString(),
        status: "sent",
      },
      agentRole,
      sessionId,
    });
  } catch (err) {
    console.error("[chat/send] Error:", err.message || err);
    return res.status(500).json({
      error: "Chat request failed",
      details: err.message || "Unknown error",
    });
  }
});

/**
 * GET /api/leads
 * Returns mock contractor leads
 */
app.get("/api/leads", (_req, res) => {
  res.status(200).json({
    leads: MOCK_LEADS,
    total: MOCK_LEADS.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/agents
 * Returns agent status data
 */
app.get("/api/agents", (_req, res) => {
  // Refresh lastActivity timestamps so the response looks live
  const agents = MOCK_AGENTS.map((a) => ({
    ...a,
    lastActivity:
      a.status === "running"
        ? new Date().toISOString()
        : a.lastActivity,
  }));
  res.status(200).json({
    agents,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/chat/history?sessionId=<id>
 * Returns chat history for a session
 */
app.get("/api/chat/history", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId query parameter is required" });
  }
  const history = chatHistories.get(sessionId) || [];
  res.status(200).json({
    sessionId,
    messages: history,
    count: history.length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * DELETE /api/chat/history?sessionId=<id>
 * Clears chat history for a session
 */
app.delete("/api/chat/history", (req, res) => {
  const { sessionId } = req.query;
  if (!sessionId) {
    return res.status(400).json({ error: "sessionId query parameter is required" });
  }
  const existed = chatHistories.has(sessionId);
  chatHistories.delete(sessionId);
  res.status(200).json({
    success: true,
    sessionId,
    cleared: existed,
    timestamp: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// 404 handler
// ---------------------------------------------------------------------------

app.use((_req, res) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  });
});

// ---------------------------------------------------------------------------
// Error handler
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message || "An unexpected error occurred",
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[XPS Intelligence API] Listening on port ${PORT}`);
  console.log(
    `[XPS Intelligence API] Groq: ${GROQ_API_KEY ? "configured" : "NOT configured — set GROQ_API_KEY"}`
  );
});

module.exports = app;
