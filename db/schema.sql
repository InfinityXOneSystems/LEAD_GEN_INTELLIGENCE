-- Lead Intelligence Platform — complete database schema
-- Run this once against the target PostgreSQL database to initialize tables.
-- Safe to run repeatedly (all statements use IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- NOTE: For ongoing schema evolution use the Knex migration files in
-- db/migrations/ via `npm run db:migrate`.  This file remains for
-- backward-compatible bootstrapping via db/db.js → initSchema().

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
  address         TEXT,
  city            TEXT        NOT NULL DEFAULT '',
  state           TEXT        NOT NULL DEFAULT '',
  country         TEXT        NOT NULL DEFAULT 'US',
  industry        TEXT,
  category        TEXT,
  keyword         TEXT,
  linkedin        TEXT,
  rating          NUMERIC(3,1),
  reviews         INTEGER,
  lead_score      INTEGER     DEFAULT 0,
  tier            TEXT,
  status          TEXT        DEFAULT 'new',
  source          TEXT,
  metadata        JSONB,
  date_scraped    TIMESTAMPTZ DEFAULT NOW(),
  last_contacted  TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_name, city, state)
);

CREATE INDEX IF NOT EXISTS idx_leads_lead_score   ON leads (lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_date_scraped ON leads (date_scraped DESC);
CREATE INDEX IF NOT EXISTS idx_leads_state        ON leads (state);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_tier         ON leads (tier);

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

CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores (lead_id);

-- ── Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  username            TEXT        NOT NULL UNIQUE,
  email               TEXT        NOT NULL UNIQUE,
  password_hash       TEXT        NOT NULL,
  role                TEXT        NOT NULL DEFAULT 'user',
  api_key_hash        TEXT        UNIQUE,
  api_key_prefix      TEXT,
  api_key_expires_at  TIMESTAMPTZ,
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_users_role CHECK (role IN ('admin','user','viewer'))
);

CREATE INDEX IF NOT EXISTS idx_users_email          ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_api_key_prefix ON users (api_key_prefix);

-- ── Settings ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id          SERIAL PRIMARY KEY,
  key         TEXT        NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  value       TEXT,
  value_type  TEXT        NOT NULL DEFAULT 'string',
  category    TEXT        DEFAULT 'general',
  description TEXT,
  is_secret   BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (key, user_id),
  CONSTRAINT chk_settings_value_type CHECK (value_type IN ('string','number','boolean','json'))
);

CREATE INDEX IF NOT EXISTS idx_settings_key      ON settings (key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings (category);

-- ── Agent tasks ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_tasks (
  id            SERIAL PRIMARY KEY,
  agent_type    TEXT        NOT NULL,
  command       TEXT        NOT NULL,
  payload       JSONB,
  status        TEXT        NOT NULL DEFAULT 'pending',
  priority      INTEGER     NOT NULL DEFAULT 5,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  queue_name    TEXT        DEFAULT 'default',
  retry_count   INTEGER     NOT NULL DEFAULT 0,
  max_retries   INTEGER     NOT NULL DEFAULT 3,
  error         TEXT,
  scheduled_at  TIMESTAMPTZ,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_agent_tasks_status CHECK (status IN ('pending','running','completed','failed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_status     ON agent_tasks (status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_type ON agent_tasks (agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority   ON agent_tasks (priority, created_at);

-- ── Agent runs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id            SERIAL PRIMARY KEY,
  task_id       INTEGER REFERENCES agent_tasks(id) ON DELETE SET NULL,
  agent_type    TEXT        NOT NULL,
  command       TEXT        NOT NULL,
  input         JSONB,
  output        JSONB,
  status        TEXT        NOT NULL DEFAULT 'completed',
  error         TEXT,
  duration_ms   INTEGER,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_task_id    ON agent_runs (task_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_agent_type ON agent_runs (agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_runs_completed  ON agent_runs (completed_at DESC);

-- ── Scrape tasks ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_tasks (
  id              SERIAL PRIMARY KEY,
  source          TEXT        NOT NULL,
  keyword         TEXT        NOT NULL,
  city            TEXT,
  state           TEXT,
  country         TEXT        DEFAULT 'US',
  status          TEXT        NOT NULL DEFAULT 'pending',
  priority        INTEGER     NOT NULL DEFAULT 5,
  agent_task_id   INTEGER REFERENCES agent_tasks(id) ON DELETE SET NULL,
  result_count    INTEGER     DEFAULT 0,
  new_leads       INTEGER     DEFAULT 0,
  updated_leads   INTEGER     DEFAULT 0,
  error           TEXT,
  options         JSONB,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_scrape_tasks_status CHECK (status IN ('pending','running','completed','failed','cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_scrape_tasks_status  ON scrape_tasks (status);
CREATE INDEX IF NOT EXISTS idx_scrape_tasks_source  ON scrape_tasks (source);
CREATE INDEX IF NOT EXISTS idx_scrape_tasks_created ON scrape_tasks (created_at DESC);

-- ── Scrape results ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_results (
  id                 SERIAL PRIMARY KEY,
  task_id            INTEGER     NOT NULL REFERENCES scrape_tasks(id) ON DELETE CASCADE,
  raw_data           JSONB       NOT NULL,
  processed          BOOLEAN     NOT NULL DEFAULT FALSE,
  lead_id            INTEGER REFERENCES leads(id) ON DELETE SET NULL,
  validation_status  TEXT,
  validation_errors  TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_results_task_id   ON scrape_results (task_id);
CREATE INDEX IF NOT EXISTS idx_scrape_results_processed ON scrape_results (processed);
CREATE INDEX IF NOT EXISTS idx_scrape_results_lead_id   ON scrape_results (lead_id);

-- ── Audit logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT        NOT NULL,
  entity_type  TEXT,
  entity_id    TEXT,
  old_value    JSONB,
  new_value    JSONB,
  ip_address   TEXT,
  user_agent   TEXT,
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON audit_logs (action);

-- ── Vector embeddings (Qdrant) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vector_embeddings (
  id               SERIAL PRIMARY KEY,
  entity_type      TEXT        NOT NULL,
  entity_id        INTEGER     NOT NULL,
  collection_name  TEXT        NOT NULL,
  qdrant_id        UUID        NOT NULL,
  embedding_dim    INTEGER,
  model_name       TEXT,
  metadata         JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, collection_name)
);

CREATE INDEX IF NOT EXISTS idx_vector_embeddings_entity     ON vector_embeddings (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_qdrant_id  ON vector_embeddings (qdrant_id);
CREATE INDEX IF NOT EXISTS idx_vector_embeddings_collection ON vector_embeddings (collection_name);

-- ── Seed schema versions ──────────────────────────────────────────────────
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema: leads, scrape_history, outreach_log, lead_scores')
ON CONFLICT (version) DO NOTHING;

INSERT INTO schema_version (version, description)
VALUES (2, 'Extended schema: users, settings, agent_tasks, agent_runs, scrape_tasks, scrape_results, audit_logs, vector_embeddings')
ON CONFLICT (version) DO NOTHING;
