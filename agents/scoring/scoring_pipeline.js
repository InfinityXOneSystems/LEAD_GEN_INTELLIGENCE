"use strict";

/**
 * Lead Scoring Pipeline - Phase 4
 *
 * Reads raw leads from data/leads/leads.json, scores each lead using the
 * scoring engine, and writes two output files:
 *
 *   data/leads/scored_leads.json   – all leads sorted by score descending
 *   data/leads/scoring_report.json – summary statistics and top leads
 */

const fs = require("fs");
const path = require("path");
const {
  scoreLeads,
  segmentByIndustry,
  segmentByTier,
  generateReport,
} = require("./lead_scoring");

const ROOT = path.resolve(__dirname, "..", "..");
const LEADS_PATH = path.join(ROOT, "data", "leads", "leads.json");
const SCORED_PATH = path.join(ROOT, "data", "leads", "scored_leads.json");
const REPORT_PATH = path.join(ROOT, "data", "leads", "scoring_report.json");

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadLeads() {
  if (!fs.existsSync(LEADS_PATH)) {
    console.warn(
      `[scoring_pipeline] No leads file found at ${LEADS_PATH}. Using empty array.`,
    );
    return [];
  }
  try {
    const raw = fs.readFileSync(LEADS_PATH, "utf8");
    const leads = JSON.parse(raw);
    if (!Array.isArray(leads)) {
      console.warn(
        "[scoring_pipeline] leads.json does not contain an array. Using empty array.",
      );
      return [];
    }
    return leads;
  } catch (err) {
    console.error(
      "[scoring_pipeline] Failed to parse leads.json:",
      err.message,
    );
    return [];
  }
}

function runPipeline() {
  console.log("[scoring_pipeline] Starting lead scoring pipeline...");

  const leads = loadLeads();
  console.log(`[scoring_pipeline] Loaded ${leads.length} lead(s).`);

  const scored = scoreLeads(leads);

  const tiers = segmentByTier(scored);
  const industries = segmentByIndustry(scored);
  const report = generateReport(scored);

  ensureDir(SCORED_PATH);
  fs.writeFileSync(SCORED_PATH, JSON.stringify(scored, null, 2));
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`[scoring_pipeline] Scored ${scored.length} lead(s).`);
  console.log(
    `[scoring_pipeline] Tiers -> HOT: ${tiers.HOT.length}  WARM: ${tiers.WARM.length}  COLD: ${tiers.COLD.length}`,
  );
  console.log(
    `[scoring_pipeline] Industries -> ${Object.entries(industries)
      .map(([k, v]) => `${k}: ${v.length}`)
      .join(", ")}`,
  );
  console.log(`[scoring_pipeline] Wrote scored leads to ${SCORED_PATH}`);
  console.log(`[scoring_pipeline] Wrote scoring report to ${REPORT_PATH}`);

  return { scored, report };
}

// Run directly when called as a script
if (require.main === module) {
  runPipeline();
}

module.exports = { runPipeline, loadLeads };
