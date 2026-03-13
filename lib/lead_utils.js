"use strict";

/**
 * lib/lead_utils.js
 * ─────────────────
 * Shared utility helpers for lead data IO and scoring.
 * Centralises logic that was previously duplicated across server.js,
 * api/gateway.js, api/server.js, and scripts/migrate_leads_to_supabase.js.
 */

const fs = require("fs");
const path = require("path");

// ── Tier thresholds ───────────────────────────────────────────────────────────

const TIER_HOT_MIN = 75;
const TIER_WARM_MIN = 50;

/**
 * Derives a lowercase tier label from a numeric lead score.
 *
 * Thresholds: HOT >= 75, WARM >= 50, COLD < 50.
 *
 * @param {number} score
 * @returns {"hot"|"warm"|"cold"}
 */
function tierFromScore(score) {
  if (score >= TIER_HOT_MIN) return "hot";
  if (score >= TIER_WARM_MIN) return "warm";
  return "cold";
}

// ── JSON helpers ─────────────────────────────────────────────────────────────

/**
 * Safely reads and parses a JSON file.
 * Returns an empty array on any error (file not found, malformed JSON, etc.).
 * Handles both plain arrays and objects that contain a `.leads` or `.data`
 * property, which is the shape emitted by several pipeline scripts.
 *
 * @param {string} filePath - Absolute path to the JSON file.
 * @returns {Object[]}
 */
function readJsonSafe(filePath) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : parsed.leads || parsed.data || [];
  } catch (_) {
    return [];
  }
}

// ── Lead file loader ─────────────────────────────────────────────────────────

/**
 * Loads leads from the local JSON files produced by the scraper pipeline.
 * Prefers `scored_leads.json` over `leads.json` when both exist.
 *
 * @param {string} leadsDir - Absolute path to the leads directory.
 * @returns {Object[]}
 */
function loadLeadsFromFile(leadsDir) {
  const scored = path.join(leadsDir, "scored_leads.json");
  const raw = path.join(leadsDir, "leads.json");
  if (fs.existsSync(scored)) return readJsonSafe(scored);
  if (fs.existsSync(raw)) return readJsonSafe(raw);
  return [];
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = { tierFromScore, readJsonSafe, loadLeadsFromFile };
