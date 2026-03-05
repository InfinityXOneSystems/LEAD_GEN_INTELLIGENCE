'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const app = express();
app.use(express.json());

const ROOT = path.resolve(__dirname, '..', '..');
const LEADS_FILE = path.join(ROOT, 'data', 'leads', 'leads.json');
const TODO_FILE = path.join(ROOT, 'todo', 'todo.csv');
const TEMPLATES_FILE = path.join(ROOT, 'outreach', 'templates', 'outreach_templates.csv');

// ── helpers ────────────────────────────────────────────────────────────────

function readLeads() {
  if (!fs.existsSync(LEADS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

function scoreLead(lead) {
  let score = 0;
  if (lead.website) score += 10;
  if (lead.email)   score += 15;
  if (lead.phone)   score += 10;
  if (lead.reviews > 10) score += 5;
  if (lead.rating  > 4)  score += 10;
  return score;
}

function readUtf16File(filePath) {
  const buf = fs.readFileSync(filePath);
  // Detect UTF-16 LE BOM (FF FE)
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString('utf16le');
  }
  return buf.toString('utf8');
}

function parseTasks() {
  if (!fs.existsSync(TODO_FILE)) return [];
  const content = readUtf16File(TODO_FILE);
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const header = lines.shift().split(',').map(h => h.trim());
  return lines.map(line => {
    const cols = line.split(',').map(c => c.trim());
    const obj = {};
    header.forEach((h, i) => { obj[h] = cols[i] || ''; });
    return obj;
  });
}

// ── routes ─────────────────────────────────────────────────────────────────

/** GET /status – system health */
app.get('/status', (_req, res) => {
  const leads = readLeads();
  const tasks = parseTasks();
  const pending = tasks.filter(t => t.STATUS === 'pending').length;
  res.json({
    status: 'ok',
    lead_count: leads.length,
    pending_tasks: pending,
    timestamp: new Date().toISOString(),
  });
});

/** GET /leads – return all stored leads (optional ?limit=N) */
app.get('/leads', (req, res) => {
  let leads = readLeads();
  const limit = parseInt(req.query.limit, 10);
  if (!isNaN(limit) && limit > 0) leads = leads.slice(0, limit);
  res.json({ leads, count: leads.length });
});

/** POST /leads – add or update a lead */
app.post('/leads', (req, res) => {
  const lead = req.body;
  if (!lead || !lead.company) {
    return res.status(400).json({ error: 'company field is required' });
  }
  const leads = readLeads();
  const idx = leads.findIndex(l => l.company === lead.company && l.city === lead.city);
  if (idx >= 0) {
    leads[idx] = { ...leads[idx], ...lead };
  } else {
    leads.push(lead);
  }
  writeLeads(leads);
  res.json({ success: true, lead_count: leads.length });
});

/** POST /score – score a lead object */
app.post('/score', (req, res) => {
  const lead = req.body;
  if (!lead || typeof lead !== 'object') {
    return res.status(400).json({ error: 'lead object required in request body' });
  }
  const score = scoreLead(lead);
  res.json({ score, lead });
});

/** GET /tasks – return todo tasks (optional ?status=pending|complete) */
app.get('/tasks', (req, res) => {
  let tasks = parseTasks();
  if (req.query.status) {
    tasks = tasks.filter(t => t.STATUS === req.query.status);
  }
  res.json({ tasks, count: tasks.length });
});

/** POST /scrape – trigger the lead scraper */
app.post('/scrape', (_req, res) => {
  const scraperPath = path.join(ROOT, 'scrapers', 'google_maps_scraper.js');
  execFile('node', [scraperPath], (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message, stderr });
    }
    res.json({ success: true, output: stdout });
  });
});

/** GET /outreach/templates – list outreach templates */
app.get('/outreach/templates', (_req, res) => {
  if (!fs.existsSync(TEMPLATES_FILE)) {
    return res.json({ templates: [] });
  }
  const raw = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  lines.shift(); // skip header
  const templates = lines.map(line => {
    // Parse CSV with optional quoted fields.
    // Format: id,"subject","message" – extract first numeric id then two
    // remaining fields, handling commas inside double-quoted values.
    const fields = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        fields.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    if (fields.length < 3) return null;
    return {
      id: fields[0].trim(),
      subject: fields[1].trim(),
      message: fields[2].trim(),
    };
  }).filter(Boolean);
  res.json({ templates });
});

/** POST /outreach/send – record an outreach action for a lead */
app.post('/outreach/send', (req, res) => {
  const { lead, template_id } = req.body;
  if (!lead || !template_id) {
    return res.status(400).json({ error: 'lead and template_id are required' });
  }
  // Record the outreach in the leads store
  const leads = readLeads();
  const idx = leads.findIndex(l => l.company === lead.company && l.city === lead.city);
  if (idx < 0) {
    return res.status(404).json({ error: 'lead not found – upsert it first via POST /leads' });
  }
  const record = {
    template_id,
    sent_at: new Date().toISOString(),
  };
  leads[idx].outreach = leads[idx].outreach || [];
  leads[idx].outreach.push(record);
  writeLeads(leads);
  res.json({ success: true, outreach: record });
});

// ── serve OpenAPI spec ──────────────────────────────────────────────────────

app.get('/openapi.json', (_req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.json'));
});

// ── start ───────────────────────────────────────────────────────────────────

const PORT = process.env.GPT_ACTIONS_PORT || 3100;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`GPT Actions server running on port ${PORT}`);
  });
}

module.exports = app;
