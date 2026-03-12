"use strict";

require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const cors = require("cors");

const app = express();

// Allow all origins — required for Vercel/GitHub Pages frontend access
app.use(cors());
app.use(express.json());

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
      .json({ error: "Chat request failed", details: err.message });
  }
});

// ── Leads endpoint ──────────────────────────────────────────────────────────

app.get("/api/leads", (_req, res) => {
  const leads = [
    {
      id: "1",
      company: "ABC Roofing Inc",
      email: "contact@abcroofing.com",
      phone: "555-0123",
      score: 92,
      location: "Austin, TX",
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
      status: "warm",
    },
    {
      id: "3",
      company: "Premier Concrete Co",
      email: "hello@premierconcrete.com",
      phone: "555-0789",
      score: 74,
      location: "Dallas, TX",
      industry: "Concrete",
      status: "warm",
    },
    {
      id: "4",
      company: "Sunrise HVAC Solutions",
      email: "service@sunrisehvac.com",
      phone: "555-1011",
      score: 61,
      location: "Phoenix, AZ",
      industry: "HVAC",
      status: "cold",
    },
    {
      id: "5",
      company: "Blue Ridge Painting",
      email: "jobs@blueridgepainting.com",
      phone: "555-1213",
      score: 55,
      location: "Atlanta, GA",
      industry: "Painting",
      status: "cold",
    },
  ];

  return res.json(leads);
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
