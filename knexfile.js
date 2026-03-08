"use strict";

require("dotenv").config();

/**
 * Knex configuration — XPS Lead Intelligence Platform
 *
 * Supports three environments: development, test, production.
 * All environments read from environment variables so the same config
 * works locally, in CI, and in production containers.
 *
 * DATABASE_URL overrides individual host/port/user/password/db vars.
 */

const baseConnection = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_SSL === "true"
          ? {
              rejectUnauthorized:
                process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
            }
          : false,
    }
  : {
      host: process.env.DATABASE_HOST || "localhost",
      port: parseInt(process.env.DATABASE_PORT || "5432", 10),
      database: process.env.DATABASE_NAME || "lead_intelligence",
      user: process.env.DATABASE_USER || "lead_admin",
      password: process.env.DATABASE_PASSWORD || "",
      ssl:
        process.env.DATABASE_SSL === "true"
          ? {
              rejectUnauthorized:
                process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
            }
          : false,
    };

/** @type {import('knex').Knex.Config} */
const sharedConfig = {
  client: "pg",
  connection: baseConnection,
  pool: { min: 2, max: 10 },
  migrations: {
    directory: "./db/migrations",
    tableName: "knex_migrations",
    extension: "js",
  },
  seeds: {
    directory: "./db/seeds",
    extension: "js",
  },
};

module.exports = {
  development: {
    ...sharedConfig,
    debug: process.env.KNEX_DEBUG === "true",
  },

  test: {
    ...sharedConfig,
    connection: process.env.DATABASE_URL || {
      ...baseConnection,
      database: process.env.DATABASE_NAME_TEST || "lead_intelligence_test",
    },
  },

  production: {
    ...sharedConfig,
    pool: { min: 2, max: 20 },
  },
};
