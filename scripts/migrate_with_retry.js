"use strict";
/**
 * scripts/migrate_with_retry.js
 * ================================
 * Runs Knex migrations with automatic PostgreSQL connection retries.
 *
 * Railway starts the app container and the PostgreSQL container at nearly
 * the same time. The Postgres service may take a few seconds to become
 * healthy. This script polls for connectivity (up to WAIT_SECONDS) before
 * running migrations so the startup never fails with ECONNREFUSED.
 *
 * Usage (called from package.json "db:migrate"):
 *   node scripts/migrate_with_retry.js
 *
 * Environment variables (all optional — resolved via knexfile.js):
 *   PGHOST / DATABASE_URL / DATABASE_URL etc.
 *   DB_WAIT_SECONDS   — max seconds to wait for DB (default 60)
 *   DB_RETRY_INTERVAL — seconds between retries (default 3)
 */

require("dotenv").config();

const { execSync } = require("child_process");
const { Client }   = require("pg");

const WAIT_SECONDS  = parseInt(process.env.DB_WAIT_SECONDS   || "60",  10);
const RETRY_INTERVAL= parseInt(process.env.DB_RETRY_INTERVAL || "3",   10);
const NODE_ENV      = process.env.NODE_ENV || "development";

// ── Build a pg.Client connection config from the same env vars as knexfile ──
function buildPgConfig() {
  const connStr =
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.POSTGRES_URL ||
    null;

  if (connStr) {
    const needsSsl = connStr.includes("railway.app") || connStr.includes("neon.tech");
    return {
      connectionString: connStr,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000,
    };
  }

  return {
    host:     process.env.PGHOST     || process.env.DATABASE_HOST || "localhost",
    port:     parseInt(process.env.PGPORT || process.env.DATABASE_PORT || "5432", 10),
    database: process.env.PGDATABASE || process.env.POSTGRES_DB   || process.env.DATABASE_NAME || "railway",
    user:     process.env.PGUSER     || process.env.POSTGRES_USER || process.env.DATABASE_USER || "postgres",
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || process.env.DATABASE_PASSWORD || "",
    ssl:      false,
    connectionTimeoutMillis: 5000,
  };
}

async function waitForPostgres() {
  const cfg = buildPgConfig();
  const target = cfg.connectionString
    ? cfg.connectionString.replace(/:[^:@]+@/, ":***@")  // mask password
    : `${cfg.host}:${cfg.port}/${cfg.database}`;

  console.log(`[db:migrate] Waiting for PostgreSQL at ${target} (up to ${WAIT_SECONDS}s)…`);

  const deadline = Date.now() + WAIT_SECONDS * 1000;
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    const client = new Client(cfg);
    try {
      await client.connect();
      await client.query("SELECT 1");
      await client.end();
      console.log(`[db:migrate] PostgreSQL ready after ${attempt} attempt(s).`);
      return true;
    } catch (err) {
      const remaining = Math.ceil((deadline - Date.now()) / 1000);
      console.log(
        `[db:migrate] Attempt ${attempt}: not ready (${err.code || err.message}). ` +
        `Retrying in ${RETRY_INTERVAL}s… (${remaining}s remaining)`,
      );
      try { await client.end(); } catch (_) {}
      await new Promise((r) => setTimeout(r, RETRY_INTERVAL * 1000));
    }
  }

  console.error(`[db:migrate] PostgreSQL did not become ready within ${WAIT_SECONDS}s.`);
  return false;
}

async function runMigrations() {
  const ready = await waitForPostgres();

  if (!ready) {
    // Don't crash the container — gateway can start without migrations.
    // Migrations will be retried on next deploy / restart.
    console.warn("[db:migrate] Skipping migrations — database unreachable. Gateway will start anyway.");
    process.exit(0);
  }

  try {
    console.log(`[db:migrate] Running knex migrate:latest (NODE_ENV=${NODE_ENV})…`);
    execSync(`NODE_ENV=${NODE_ENV} npx knex migrate:latest --knexfile knexfile.js`, {
      stdio: "inherit",
      env: process.env,
    });
    console.log("[db:migrate] ✅ Migrations complete.");
    process.exit(0);
  } catch (err) {
    console.error("[db:migrate] ❌ Migration failed:", err.message);
    // Exit 0 so the gateway still starts — log the error for ops review.
    process.exit(0);
  }
}

runMigrations().catch((err) => {
  console.error("[db:migrate] Unexpected error:", err);
  process.exit(0); // always start the gateway
});
