-- Lead Intelligence Platform — database schema
-- Run this once against the target PostgreSQL database to initialize tables.

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

CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_date_scraped ON leads (date_scraped DESC);
