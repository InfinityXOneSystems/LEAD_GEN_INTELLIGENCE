'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { scrapeGoogleMaps } = require('./google_maps_scraper');
const { scrapeBingMaps } = require('./bing_maps_scraper');
const { upsertLeads } = require('../db/leadStore');
const { initSchema } = require('../db/db');

const KEYWORDS_CSV = path.join(__dirname, '../data/datasets/XPS_LEAD_INTELLIGENCE_SYSTEM/keywords.csv');
const LOCATIONS_CSV = path.join(__dirname, '../data/datasets/XPS_LEAD_INTELLIGENCE_SYSTEM/locations.csv');
const LEADS_DIR = path.join(__dirname, '../data/leads');
const LEADS_FILE = path.join(LEADS_DIR, 'leads.json');

/** Default engine configuration */
const DEFAULT_CONFIG = {
  sources: ['google_maps'],   // scrapers to use: 'google_maps', 'bing_maps'
  maxKeywords: null,           // limit keywords (null = all)
  maxLocations: null,          // limit locations (null = all)
  concurrency: 1,              // parallel scrape jobs (keep low to avoid rate limits)
  delayBetweenBatchesMs: 3000, // pause between batches of concurrent jobs
};

/**
 * Parse a simple CSV string (with header row) into an array of objects.
 * Handles BOM markers, Windows line endings, and double-quoted fields.
 */
function parseCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Split a single CSV line respecting double-quoted fields
  const splitLine = (line) => {
    const fields = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // Handle escaped quotes ("")
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const headers = splitLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] !== undefined ? values[i] : '';
    });
    return obj;
  });
}

/**
 * Load leads from the leads file.
 */
function loadExistingLeads() {
  if (!fs.existsSync(LEADS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

/**
 * Deduplicate leads by company name + city combination.
 */
function dedupeLeads(leads) {
  const seen = {};
  return leads.filter((lead) => {
    const key = (lead.company + '|' + lead.city).toLowerCase();
    if (seen[key]) return false;
    seen[key] = true;
    return true;
  });
}

/**
 * Save leads array to the leads JSON file.
 */
function saveLeads(leads) {
  if (!fs.existsSync(LEADS_DIR)) {
    fs.mkdirSync(LEADS_DIR, { recursive: true });
  }
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
}

/**
 * Sleep for the given number of milliseconds.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run one scrape job: keyword + location through the configured source.
 */
async function runJob(source, keyword, city, state) {
  switch (source) {
    case 'google_maps':
      return scrapeGoogleMaps(keyword, city, state);
    case 'bing_maps':
      return scrapeBingMaps(keyword, city, state);
    default:
      console.warn(`[engine] Unknown source: ${source}`);
      return [];
  }
}

/**
 * Main scraper engine entry point.
 *
 * @param {object} config - Optional config overrides (see DEFAULT_CONFIG)
 * @returns {Promise<Array>} All collected (and deduped) leads
 */
async function runEngine(config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  console.log('[engine] Starting scraper engine');
  console.log('[engine] Config:', JSON.stringify(cfg, null, 2));

  // Load keyword + location datasets
  const allKeywords = parseCsv(KEYWORDS_CSV);
  const allLocations = parseCsv(LOCATIONS_CSV);

  const keywords = cfg.maxKeywords ? allKeywords.slice(0, cfg.maxKeywords) : allKeywords;
  const locations = cfg.maxLocations ? allLocations.slice(0, cfg.maxLocations) : allLocations;

  console.log(`[engine] Loaded ${keywords.length} keywords, ${locations.length} locations`);

  // Build the job queue: for each source × keyword × location
  const jobs = [];
  for (const source of cfg.sources) {
    for (const kw of keywords) {
      for (const loc of locations) {
        jobs.push({ source, keyword: kw.Keyword, city: loc.City, state: loc.State });
      }
    }
  }

  console.log(`[engine] Total jobs: ${jobs.length}`);

  // Load existing leads to merge with
  let allLeads = loadExistingLeads();
  console.log(`[engine] Loaded ${allLeads.length} existing leads`);

  let completed = 0;
  let newLeadsCount = 0;

  // Run jobs in batches respecting concurrency limit, with delay between batches
  for (let i = 0; i < jobs.length; i += cfg.concurrency) {
    const batch = jobs.slice(i, i + cfg.concurrency);
    const batchResults = await Promise.all(
      batch.map((job) => runJob(job.source, job.keyword, job.city, job.state))
    );
    for (const results of batchResults) {
      allLeads = allLeads.concat(results);
      newLeadsCount += results.length;
      completed++;
    }
    console.log(`[engine] Progress: ${completed}/${jobs.length} jobs done | ${newLeadsCount} new leads`);
    if (i + cfg.concurrency < jobs.length) {
      await sleep(cfg.delayBetweenBatchesMs);
    }
  }

  // Deduplicate and save to JSON snapshot
  allLeads = dedupeLeads(allLeads);
  saveLeads(allLeads);

  // Persist to PostgreSQL
  try {
    await initSchema();
    const dbLeads = allLeads.map((lead) => ({
      company_name: lead.company || '',
      phone:        lead.phone   || null,
      website:      lead.website || null,
      city:         lead.city    || '',
      state:        lead.state   || '',
      industry:     lead.category || null,
      rating:       lead.rating  || null,
      reviews:      lead.reviews || null,
      source:       lead.source  || null,
    }));
    await upsertLeads(dbLeads);
    console.log(`[engine] Persisted ${dbLeads.length} leads to PostgreSQL.`);
  } catch (err) {
    console.error(`[engine] Database persistence failed (leads still saved to JSON): ${err.message}`);
  }

  console.log(`[engine] Done. Total unique leads saved: ${allLeads.length}`);
  return allLeads;
}

module.exports = { runEngine, parseCsv, dedupeLeads, loadExistingLeads, saveLeads };
