"use strict";

const { Pool } = require("pg");

// Prefer DATABASE_URL (Railway / Heroku-style full connection string)
// then fall back to individual PG* / DATABASE_* variables.
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? {
              rejectUnauthorized:
                process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
                  ? false
                  : true,
            }
          : false,
    }
  : {
      host:
        process.env.PGHOST ||
        process.env.DATABASE_HOST ||
        "localhost",
      port: parseInt(
        process.env.PGPORT || process.env.DATABASE_PORT || "5432",
        10,
      ),
      database:
        process.env.PGDATABASE ||
        process.env.DATABASE_NAME ||
        "lead_intelligence",
      user:
        process.env.PGUSER ||
        process.env.DATABASE_USER ||
        "lead_admin",
      password:
        process.env.PGPASSWORD ||
        process.env.DATABASE_PASSWORD ||
        "",
      ssl:
        process.env.DATABASE_SSL === "true"
          ? {
              rejectUnauthorized:
                process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "false"
                  ? false
                  : true,
            }
          : false,
    };

const pool = new Pool(poolConfig);
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
