"use strict";

/**
 * Migration 001 — Initial schema
 *
 * Creates the four foundational tables that were previously managed via
 * db/schema.sql:
 *   - leads
 *   - scrape_history
 *   - outreach_log
 *   - lead_scores
 *
 * The raw SQL file (db/schema.sql) remains for backward-compatible
 * bootstrapping via initSchema(); Knex migrations take over for all
 * subsequent changes.
 */

exports.up = async function (knex) {
  // ── leads ──────────────────────────────────────────────────────────────────
  await knex.schema.createTableIfNotExists("leads", (t) => {
    t.increments("id").primary();
    t.text("company_name").notNullable();
    t.text("contact_name");
    t.text("phone");
    t.text("email");
    t.text("website");
    t.text("address");
    t.text("city").notNullable().defaultTo("");
    t.text("state").notNullable().defaultTo("");
    t.text("country").defaultTo("US");
    t.text("industry");
    t.text("category");
    t.text("keyword");
    t.text("linkedin");
    t.decimal("rating", 3, 1);
    t.integer("reviews");
    t.integer("lead_score").defaultTo(0);
    t.text("tier");
    t.text("status").defaultTo("new");
    t.text("source");
    t.jsonb("metadata");
    t.timestamp("date_scraped", { useTz: true }).defaultTo(knex.fn.now());
    t.timestamp("last_contacted", { useTz: true });
    t.timestamp("updated_at", { useTz: true }).defaultTo(knex.fn.now());
    t.unique(["company_name", "city", "state"]);
  });

  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_leads_lead_score   ON leads (lead_score DESC)",
  );
  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_leads_date_scraped ON leads (date_scraped DESC)",
  );
  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_leads_state        ON leads (state)",
  );
  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads (status)",
  );
  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_leads_tier         ON leads (tier)",
  );

  // ── scrape_history ─────────────────────────────────────────────────────────
  await knex.schema.createTableIfNotExists("scrape_history", (t) => {
    t.increments("id").primary();
    t.timestamp("run_at", { useTz: true }).defaultTo(knex.fn.now());
    t.text("source");
    t.text("keyword");
    t.text("city");
    t.text("state");
    t.integer("leads_found").defaultTo(0);
    t.text("status").defaultTo("ok");
  });

  // ── outreach_log ───────────────────────────────────────────────────────────
  await knex.schema.createTableIfNotExists("outreach_log", (t) => {
    t.increments("id").primary();
    t.integer("lead_id").references("id").inTable("leads").onDelete("SET NULL");
    t.timestamp("sent_at", { useTz: true }).defaultTo(knex.fn.now());
    t.text("channel").defaultTo("email");
    t.text("template_id");
    t.text("status").defaultTo("sent");
    t.text("notes");
  });

  // ── lead_scores ────────────────────────────────────────────────────────────
  await knex.schema.createTableIfNotExists("lead_scores", (t) => {
    t.increments("id").primary();
    t.integer("lead_id").references("id").inTable("leads").onDelete("CASCADE");
    t.timestamp("scored_at", { useTz: true }).defaultTo(knex.fn.now());
    t.integer("score");
    t.text("tier");
    t.jsonb("breakdown");
  });

  await knex.schema.raw(
    "CREATE INDEX IF NOT EXISTS idx_lead_scores_lead_id ON lead_scores (lead_id)",
  );
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("lead_scores");
  await knex.schema.dropTableIfExists("outreach_log");
  await knex.schema.dropTableIfExists("scrape_history");
  await knex.schema.dropTableIfExists("leads");
};
