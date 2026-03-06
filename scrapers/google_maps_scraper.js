"use strict";

/**
 * google_maps_scraper.js
 *
 * Nationwide batch scraper for contractor leads.
 *
 * Environment variables (all optional):
 *   SCRAPER_BATCH_SIZE    – number of cities to process per run  (default: 10)
 *   SCRAPER_CONCURRENCY   – parallel search tasks within a batch (default: 3)
 *   SCRAPER_RATE_LIMIT_MS – ms to wait between tasks             (default: 2000)
 *   SCRAPER_STATE         – restrict this run to one state abbr  (e.g. "TX")
 *   SCRAPER_RESET         – set to "1" to reset progress first   (default: off)
 */

const fs = require("fs");
const path = require("path");
const {
  loadKeywords,
  getNextBatch,
  markComplete,
  generateSearchTasks,
  resetProgress,
  getCoverageSummary,
} = require("./scraper_queue");

// ── Configuration ────────────────────────────────────────────────────────────

const BATCH_SIZE = parseInt(process.env.SCRAPER_BATCH_SIZE || "10", 10);
const CONCURRENCY = parseInt(process.env.SCRAPER_CONCURRENCY || "3", 10);
const RATE_LIMIT_MS = parseInt(process.env.SCRAPER_RATE_LIMIT_MS || "2000", 10);
const STATE_FILTER = process.env.SCRAPER_STATE || null;
const RESET_FLAG = process.env.SCRAPER_RESET === "1";

const LEADS_DIR = path.join(__dirname, "../data/leads");
const LEADS_FILE = path.join(LEADS_DIR, "leads.json");

// ── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadExistingLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.warn(
        "[scraper] Warning: could not read existing leads file:",
        err.message,
      );
    }
    return [];
  }
}

function saveLeads(leads) {
  ensureDir(LEADS_DIR);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

/** Remove duplicate leads keyed on (company, city). */
function dedupeLeads(leads) {
  const seen = new Set();
  return leads.filter((lead) => {
    const key =
      (lead.company || "").toLowerCase().trim() +
      "|" +
      (lead.city || "").toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Core scraping function ────────────────────────────────────────────────────
//
// Replace the body of this function with a real Playwright / Crawlee
// implementation that queries Google Maps (or any source) for the given
// keyword + city combination.  The function must resolve to an array of
// lead objects matching the contractor_database.csv schema.

async function scrapeTask(task) {
  // --- stub: returns a representative placeholder lead ---
  // A real implementation would launch a headless browser here.
  return [
    {
      company: `${task.keyword} – ${task.city} (sample)`,
      city: task.city,
      state: task.state,
      country: task.country,
      keyword: task.keyword,
      category: task.category,
      phone: "",
      website: "",
      email: "",
      rating: 0,
      reviews: 0,
      scrapedAt: new Date().toISOString(),
    },
  ];
}

// ── Retry wrapper ─────────────────────────────────────────────────────────────

async function scrapeWithRetry(task, retries, backoffMs) {
  retries = retries !== undefined ? retries : 3;
  backoffMs = backoffMs !== undefined ? backoffMs : RATE_LIMIT_MS;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await scrapeTask(task);
    } catch (err) {
      const isLast = attempt === retries;
      console.error(
        `[scraper] Attempt ${attempt}/${retries} failed for "${task.keyword}" ` +
          `in ${task.city}, ${task.state}: ${err.message}`,
      );
      if (isLast) throw err;
      await delay(backoffMs * attempt);
    }
  }
}

// ── Concurrent task runner ────────────────────────────────────────────────────

async function processTasksConcurrently(tasks, concurrency) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const task = tasks[index++];
      try {
        const leads = await scrapeWithRetry(task);
        results.push(...leads);
        console.log(
          `[scraper] ✓ "${task.keyword}" in ${task.city}, ${task.state}` +
            ` → ${leads.length} lead(s)`,
        );
      } catch (err) {
        console.error(
          `[scraper] ✗ Skipping "${task.keyword}" in ${task.city}: ${err.message}`,
        );
      }
      await delay(RATE_LIMIT_MS);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}

// ── Entry point ───────────────────────────────────────────────────────────────

async function runScraper() {
  console.log("[scraper] ════════════════════════════════════════════════");
  console.log("[scraper] Nationwide Contractor Lead Scraper – Phase 8");
  console.log("[scraper] ════════════════════════════════════════════════");
  console.log(
    `[scraper] Config: batch=${BATCH_SIZE}  concurrency=${CONCURRENCY}` +
      `  rateLimit=${RATE_LIMIT_MS}ms  state=${STATE_FILTER || "all"}`,
  );

  if (RESET_FLAG) {
    resetProgress();
  }

  // Print coverage summary before this run.
  const before = getCoverageSummary();
  console.log(
    `[scraper] Coverage before run: ${before.completedLocations}/${before.totalLocations} locations` +
      ` (${before.pendingLocations} remaining)`,
  );

  const batch = getNextBatch(BATCH_SIZE, STATE_FILTER);
  if (batch.length === 0) {
    console.log(
      "[scraper] No pending locations. " +
        "Set SCRAPER_RESET=1 to restart the scraping cycle.",
    );
    const summary = getCoverageSummary();
    console.log("[scraper] Final coverage by state:");
    for (const [state, info] of Object.entries(summary.byState).sort()) {
      console.log(`  ${state}: ${info.done}/${info.total}`);
    }
    return;
  }

  console.log(
    `[scraper] Processing ${batch.length} location(s): ` +
      batch.map((l) => `${l.City}, ${l.State}`).join(" | "),
  );

  const keywords = loadKeywords();
  const tasks = generateSearchTasks(batch, keywords);
  console.log(
    `[scraper] ${tasks.length} search tasks` +
      ` (${batch.length} locations × ${keywords.length} keywords)`,
  );

  const newLeads = await processTasksConcurrently(tasks, CONCURRENCY);

  // Merge with existing leads and deduplicate before saving.
  const existing = loadExistingLeads();
  const merged = dedupeLeads([...existing, ...newLeads]);
  saveLeads(merged);

  // Mark all locations in this batch as complete.
  for (const loc of batch) {
    markComplete(loc.ID);
  }

  const after = getCoverageSummary();
  console.log("[scraper] ────────────────────────────────────────────────");
  console.log(`[scraper] New leads collected : ${newLeads.length}`);
  console.log(`[scraper] Total unique leads  : ${merged.length}`);
  console.log(
    `[scraper] Coverage after run  : ` +
      `${after.completedLocations}/${after.totalLocations} locations` +
      ` (${after.pendingLocations} remaining)`,
  );
  console.log("[scraper] Done.");
}

runScraper().catch((err) => {
  console.error("[scraper] Fatal error:", err);
  process.exit(1);
});
