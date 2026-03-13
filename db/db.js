"use strict";

const { Pool } = require("pg");

// ── Connection resolution — matches the same priority as knexfile.js ─────────
// 1. DATABASE_URL (full connection string set by Railway)
// 2. PG* standard vars (set directly by Railway PostgreSQL service)
// 3. DATABASE_HOST / DATABASE_NAME / etc. (legacy local-dev names)
// 4. localhost fallback (local dev only)

function buildPoolConfig() {
  const connStr =
    process.env.DATABASE_URL ||
    process.env.DATABASE_PUBLIC_URL ||
    process.env.POSTGRES_URL ||
    null;

  if (connStr) {
    const needsSsl =
      connStr.includes("railway.app") || connStr.includes("neon.tech");
    return {
      connectionString: connStr,
      ssl: needsSsl ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.PGHOST || process.env.DATABASE_HOST || "localhost",
    port: parseInt(
      process.env.PGPORT || process.env.DATABASE_PORT || "5432",
      10,
    ),
    database:
      process.env.PGDATABASE ||
      process.env.POSTGRES_DB ||
      process.env.DATABASE_NAME ||
      "lead_intelligence",
    user:
      process.env.PGUSER ||
      process.env.POSTGRES_USER ||
      process.env.DATABASE_USER ||
      "lead_admin",
    password:
      process.env.PGPASSWORD ||
      process.env.POSTGRES_PASSWORD ||
      process.env.DATABASE_PASSWORD ||
      "",
    ssl:
      process.env.DATABASE_SSL === "true"
        ? {
            rejectUnauthorized:
              process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
          }
        : false,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err.message);
});

/**
 * Run a SQL query against the connection pool.
 * @param {string} text  - parameterized SQL
 * @param {Array}  params - bound values
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Apply db/schema.sql to the connected database, creating tables if they
 * don't already exist.  Safe to call on every startup.
 */
async function initSchema() {
  const fs = require("fs");
  const path = require("path");
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Database schema initialized.");
}

module.exports = { query, initSchema, pool };
