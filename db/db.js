'use strict';

const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DATABASE_HOST     || 'localhost',
  port:     parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME     || 'lead_intelligence',
  user:     process.env.DATABASE_USER     || 'lead_admin',
  password: process.env.DATABASE_PASSWORD || '',
  ssl:      process.env.DATABASE_SSL === 'true'
            ? {
              // Verify TLS certificates by default; allow explicit opt-out for development.
              rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true,
            }
            : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
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
  const fs   = require('fs');
  const path = require('path');
  const sql  = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Database schema initialized.');
}

module.exports = { query, initSchema, pool };
