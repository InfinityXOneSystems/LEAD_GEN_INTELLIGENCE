-- Lead Intelligence Platform — database schema
-- Run this once against the target PostgreSQL database to initialize tables.
-- Safe to run repeatedly (all statements use IF NOT EXISTS).

-- ── Schema version tracking ───────────────────────────────────────────────
-- Each migration inserts a row here; the highest version is the current one.
CREATE TABLE IF NOT EXISTS schema_version (
  version     INTEGER     PRIMARY KEY,
  applied_at  TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- ── Core leads table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id              SERIAL PRIMARY KEY,
  company_name    TEXT        NOT NULL,
  contact_name    TEXT,
  phone           TEXT,
  email           TEXT,
  website         TEXT,
  city            TEXT        NOT NULL DEFAULT '',
  state           TEXT        NOT NULL DEFAULT '',
  industry        TEXT,
  rating          NUMERIC(3,1),
  reviews         INTEGER,
  lead_score      INTEGER     DEFAULT 0,
  source          TEXT,
  date_scraped    TIMESTAMPTZ DEFAULT NOW(),
  last_contacted  TIMESTAMPTZ,
  UNIQUE (company_name, city, state)
);

CREATE INDEX IF NOT EXISTS idx_leads_lead_score   ON leads (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_date_scraped ON leads (date_scraped DESC);
CREATE INDEX IF NOT EXISTS idx_leads_state        ON leads (state);

-- ── Scrape history ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_history (
  id          SERIAL PRIMARY KEY,
  run_at      TIMESTAMPTZ DEFAULT NOW(),
  source      TEXT,
  keyword     TEXT,
  city        TEXT,
  state       TEXT,
  leads_found INTEGER     DEFAULT 0,
  status      TEXT        DEFAULT 'ok'
);

-- ── Outreach log ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outreach_log (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  sent_at     TIMESTAMPTZ DEFAULT NOW(),
  channel     TEXT        DEFAULT 'email',
  template_id TEXT,
  status      TEXT        DEFAULT 'sent',
  notes       TEXT
);

-- ── Lead score history ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_scores (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER REFERENCES leads(id) ON DELETE CASCADE,
  scored_at   TIMESTAMPTZ DEFAULT NOW(),
  score       INTEGER,
  tier        TEXT,
  breakdown   JSONB
);

-- ── Seed schema version 1 if not already recorded ────────────────────────
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema: leads, scrape_history, outreach_log, lead_scores')
ON CONFLICT (version) DO NOTHING;
