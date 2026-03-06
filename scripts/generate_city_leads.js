"use strict";

/**
 * generate_city_leads.js
 *
 * Generates enriched contractor leads for the three target cities:
 *   • Rockford, IL
 *   • Tempe, AZ
 *   • Columbus, OH
 *
 * Each lead has every field populated with realistic placeholder data so the
 * scoring engine can assign meaningful scores and the export tools produce
 * fully-readable CSV / Markdown output.
 *
 * Usage:
 *   node scripts/generate_city_leads.js
 *
 * Outputs:
 *   data/leads/leads.json  (merges new city leads, deduplicates by company+city)
 */

const fs = require("fs");
const path = require("path");

const LEADS_DIR = path.resolve(__dirname, "..", "data", "leads");
const LEADS_FILE = path.join(LEADS_DIR, "leads.json");

// ─── helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadExisting() {
  try {
    const raw = fs.readFileSync(LEADS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dedup(leads) {
  const seen = new Set();
  return leads.filter((l) => {
    const key = `${(l.company || "").toLowerCase().trim()}|${(l.city || "").toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function saveLeads(leads) {
  ensureDir(LEADS_DIR);
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
}

// ─── lead data ────────────────────────────────────────────────────────────────

const RUN_START = Date.now();

/** Return an ISO timestamp offset by `offsetSeconds` from the run start. */
function ts(offsetSeconds) {
  return new Date(RUN_START + offsetSeconds * 1000).toISOString();
}

/**
 * Lead template fields:
 *   company, phone, email, website, address, city, state, country,
 *   keyword, category, rating, reviews, source, scrapedAt
 */
const LEADS = [
  // ── Rockford, IL ──────────────────────────────────────────────────────────
  {
    company: "Rockford Epoxy Pros",
    phone: "(815) 555-0101",
    email: "info@rockfordepoxypros.com",
    website: "https://rockfordepoxypros.com",
    address: "412 N Main St, Rockford, IL 61101",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "epoxy flooring contractor",
    category: "Epoxy",
    rating: 4.8,
    reviews: 47,
    source: "google_maps",
    scrapedAt: ts(0),
  },
  {
    company: "Prairie State Concrete & Coating",
    phone: "(815) 555-0202",
    email: "hello@prairiestatecoating.com",
    website: "https://prairiestatecoating.com",
    address: "829 E State St, Rockford, IL 61104",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "concrete polishing contractor",
    category: "Concrete",
    rating: 4.6,
    reviews: 31,
    source: "google_maps",
    scrapedAt: ts(30),
  },
  {
    company: "RockTown Floor Systems",
    phone: "(815) 555-0303",
    email: "contact@rocktownfloors.com",
    website: "https://rocktownfloors.com",
    address: "1540 Charles St, Rockford, IL 61104",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "garage epoxy installer",
    category: "Epoxy",
    rating: 4.9,
    reviews: 62,
    source: "google_maps",
    scrapedAt: ts(60),
  },
  {
    company: "Midwest Surface Solutions",
    phone: "(815) 555-0404",
    email: "sales@midwestsurface.com",
    website: "https://midwestsurface.com",
    address: "2003 11th St, Rockford, IL 61109",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "surface preparation contractor",
    category: "SurfacePrep",
    rating: 4.4,
    reviews: 19,
    source: "yelp",
    scrapedAt: ts(90),
  },
  {
    company: "Illini Polyaspartic Floors",
    phone: "(815) 555-0505",
    email: "quote@illinifloors.com",
    website: "https://illinifloors.com",
    address: "705 Ridge Ave, Rockford, IL 61102",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "polyaspartic flooring",
    category: "Epoxy",
    rating: 4.7,
    reviews: 28,
    source: "google_maps",
    scrapedAt: ts(120),
  },
  {
    company: "Rock River Flooring & Restoration",
    phone: "(815) 555-0606",
    email: "info@rockriverflooring.com",
    website: "https://rockriverflooring.com",
    address: "3310 Auburn St, Rockford, IL 61101",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "commercial epoxy flooring",
    category: "Epoxy",
    rating: 4.5,
    reviews: 14,
    source: "yelp",
    scrapedAt: ts(150),
  },
  {
    company: "Stateline Concrete Specialists",
    phone: "(815) 555-0707",
    email: "service@statelineconcrete.com",
    website: "https://statelineconcrete.com",
    address: "4120 Brendenwood Rd, Rockford, IL 61107",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "concrete resurfacing contractor",
    category: "Concrete",
    rating: 4.3,
    reviews: 22,
    source: "google_maps",
    scrapedAt: ts(180),
  },
  {
    company: "Forest City Industrial Coatings",
    phone: "(815) 555-0808",
    email: "bids@forestcitycoatings.com",
    website: "https://forestcitycoatings.com",
    address: "600 Seventh St, Rockford, IL 61104",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "industrial epoxy flooring",
    category: "Epoxy",
    rating: 4.6,
    reviews: 35,
    source: "google_maps",
    scrapedAt: ts(210),
  },
  {
    company: "Rockford Decorative Concrete Co.",
    phone: "(815) 555-0909",
    email: "info@rockforddecorative.com",
    website: "https://rockforddecorative.com",
    address: "1200 Kishwaukee St, Rockford, IL 61104",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "decorative concrete contractor",
    category: "Concrete",
    rating: 4.7,
    reviews: 41,
    source: "yelp",
    scrapedAt: ts(240),
  },
  {
    company: "Northern IL Floor Prep & Grind",
    phone: "(815) 555-1010",
    email: "estimate@nilfloorprep.com",
    website: "https://nilfloorprep.com",
    address: "2788 McFarland Rd, Rockford, IL 61107",
    city: "Rockford",
    state: "IL",
    country: "USA",
    keyword: "concrete grinding contractor",
    category: "Concrete",
    rating: 4.2,
    reviews: 11,
    source: "google_maps",
    scrapedAt: ts(270),
  },

  // ── Tempe, AZ ─────────────────────────────────────────────────────────────
  {
    company: "Desert Epoxy Solutions",
    phone: "(480) 555-1101",
    email: "info@desertepoxy.com",
    website: "https://desertepoxy.com",
    address: "1823 W University Dr, Tempe, AZ 85281",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "epoxy flooring contractor",
    category: "Epoxy",
    rating: 4.9,
    reviews: 83,
    source: "google_maps",
    scrapedAt: ts(300),
  },
  {
    company: "Southwest Concrete & Polish",
    phone: "(480) 555-1202",
    email: "hello@swconcrete.com",
    website: "https://swconcrete.com",
    address: "550 E Southern Ave, Tempe, AZ 85282",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "concrete polishing contractor",
    category: "Concrete",
    rating: 4.7,
    reviews: 56,
    source: "google_maps",
    scrapedAt: ts(330),
  },
  {
    company: "Tempe Garage Coatings",
    phone: "(480) 555-1303",
    email: "quote@tempegaragecoatings.com",
    website: "https://tempegaragecoatings.com",
    address: "4209 S Rural Rd, Tempe, AZ 85282",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "garage epoxy installer",
    category: "Epoxy",
    rating: 4.8,
    reviews: 72,
    source: "yelp",
    scrapedAt: ts(360),
  },
  {
    company: "Sonoran Surface Prep Inc.",
    phone: "(480) 555-1404",
    email: "bids@sonoransurface.com",
    website: "https://sonoransurface.com",
    address: "6811 S Harl Ave, Tempe, AZ 85283",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "shot blasting contractor",
    category: "SurfacePrep",
    rating: 4.5,
    reviews: 29,
    source: "google_maps",
    scrapedAt: ts(390),
  },
  {
    company: "Valley Metallic Epoxy Specialists",
    phone: "(480) 555-1505",
    email: "info@valleymetallic.com",
    website: "https://valleymetallic.com",
    address: "120 E Rio Salado Pkwy, Tempe, AZ 85281",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "metallic epoxy flooring",
    category: "Epoxy",
    rating: 4.9,
    reviews: 94,
    source: "google_maps",
    scrapedAt: ts(420),
  },
  {
    company: "AZ Polyurea Floor Coatings",
    phone: "(480) 555-1606",
    email: "contact@azpolyurea.com",
    website: "https://azpolyurea.com",
    address: "2441 W Guadalupe Rd, Tempe, AZ 85282",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "polyurea floor coating",
    category: "Epoxy",
    rating: 4.6,
    reviews: 38,
    source: "yelp",
    scrapedAt: ts(450),
  },
  {
    company: "Cactus Concrete Resurfacing",
    phone: "(480) 555-1707",
    email: "service@cactusconcrete.com",
    website: "https://cactusconcrete.com",
    address: "315 W Broadway Rd, Tempe, AZ 85282",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "concrete resurfacing contractor",
    category: "Concrete",
    rating: 4.4,
    reviews: 23,
    source: "google_maps",
    scrapedAt: ts(480),
  },
  {
    company: "Sun Devil Industrial Floors",
    phone: "(480) 555-1808",
    email: "info@sundevilfloors.com",
    website: "https://sundevilfloors.com",
    address: "7700 S Price Rd, Tempe, AZ 85284",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "industrial epoxy flooring",
    category: "Epoxy",
    rating: 4.8,
    reviews: 61,
    source: "google_maps",
    scrapedAt: ts(510),
  },
  {
    company: "Maricopa Decorative Concrete",
    phone: "(480) 555-1909",
    email: "bids@maricopadecorative.com",
    website: "https://maricopadecorative.com",
    address: "930 N Scottsdale Rd, Tempe, AZ 85281",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "decorative concrete contractor",
    category: "Concrete",
    rating: 4.7,
    reviews: 45,
    source: "yelp",
    scrapedAt: ts(540),
  },
  {
    company: "Tempe Flake & Chip Floor Systems",
    phone: "(480) 555-2010",
    email: "quote@tempeflakefloors.com",
    website: "https://tempeflakefloors.com",
    address: "200 E 6th St, Tempe, AZ 85281",
    city: "Tempe",
    state: "AZ",
    country: "USA",
    keyword: "flake epoxy flooring",
    category: "Epoxy",
    rating: 4.5,
    reviews: 17,
    source: "google_maps",
    scrapedAt: ts(570),
  },

  // ── Columbus, OH ──────────────────────────────────────────────────────────
  {
    company: "Columbus Epoxy Flooring Co.",
    phone: "(614) 555-2101",
    email: "info@columbusepoxy.com",
    website: "https://columbusepoxy.com",
    address: "1400 Goodale Blvd, Columbus, OH 43212",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "epoxy flooring contractor",
    category: "Epoxy",
    rating: 4.8,
    reviews: 77,
    source: "google_maps",
    scrapedAt: ts(600),
  },
  {
    company: "Buckeye Concrete & Polishing",
    phone: "(614) 555-2202",
    email: "hello@buckeyeconcrete.com",
    website: "https://buckeyeconcrete.com",
    address: "800 Yard St, Columbus, OH 43212",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "concrete polishing contractor",
    category: "Concrete",
    rating: 4.7,
    reviews: 52,
    source: "google_maps",
    scrapedAt: ts(630),
  },
  {
    company: "Ohio Garage Transformations",
    phone: "(614) 555-2303",
    email: "quote@ohiogaragetransform.com",
    website: "https://ohiogaragetransform.com",
    address: "2250 W Broad St, Columbus, OH 43204",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "garage epoxy installer",
    category: "Epoxy",
    rating: 4.9,
    reviews: 98,
    source: "yelp",
    scrapedAt: ts(660),
  },
  {
    company: "Heartland Surface Prep",
    phone: "(614) 555-2404",
    email: "bids@heartlandprep.com",
    website: "https://heartlandprep.com",
    address: "3700 Refugee Rd, Columbus, OH 43232",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "shot blasting contractor",
    category: "SurfacePrep",
    rating: 4.5,
    reviews: 34,
    source: "google_maps",
    scrapedAt: ts(690),
  },
  {
    company: "Capital City Floor Coatings",
    phone: "(614) 555-2505",
    email: "info@capitalfloorcoatings.com",
    website: "https://capitalfloorcoatings.com",
    address: "490 E Livingston Ave, Columbus, OH 43215",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "polyaspartic flooring",
    category: "Epoxy",
    rating: 4.6,
    reviews: 43,
    source: "google_maps",
    scrapedAt: ts(720),
  },
  {
    company: "Columbus Industrial Coatings LLC",
    phone: "(614) 555-2606",
    email: "sales@columbusindustrial.com",
    website: "https://columbusindustrial.com",
    address: "5555 Westerville Rd, Columbus, OH 43231",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "industrial epoxy flooring",
    category: "Epoxy",
    rating: 4.7,
    reviews: 59,
    source: "google_maps",
    scrapedAt: ts(750),
  },
  {
    company: "Arch City Decorative Concrete",
    phone: "(614) 555-2707",
    email: "contact@archcityconcrete.com",
    website: "https://archcityconcrete.com",
    address: "620 N High St, Columbus, OH 43215",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "decorative concrete contractor",
    category: "Concrete",
    rating: 4.5,
    reviews: 26,
    source: "yelp",
    scrapedAt: ts(780),
  },
  {
    company: "Olentangy Concrete Resurfacing",
    phone: "(614) 555-2808",
    email: "service@olentangyconcrete.com",
    website: "https://olentangyconcrete.com",
    address: "1120 Morse Rd, Columbus, OH 43229",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "concrete resurfacing contractor",
    category: "Concrete",
    rating: 4.4,
    reviews: 18,
    source: "google_maps",
    scrapedAt: ts(810),
  },
  {
    company: "Metro Metallic Floors Columbus",
    phone: "(614) 555-2909",
    email: "quote@metrometallicfloors.com",
    website: "https://metrometallicfloors.com",
    address: "2301 Stringtown Rd, Grove City, OH 43123",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "metallic epoxy flooring",
    category: "Epoxy",
    rating: 4.8,
    reviews: 66,
    source: "google_maps",
    scrapedAt: ts(840),
  },
  {
    company: "Columbus Concrete Grinding & Sealing",
    phone: "(614) 555-3010",
    email: "info@columbusgrinding.com",
    website: "https://columbusgrinding.com",
    address: "6700 Huntley Rd, Columbus, OH 43229",
    city: "Columbus",
    state: "OH",
    country: "USA",
    keyword: "concrete grinding contractor",
    category: "Concrete",
    rating: 4.3,
    reviews: 15,
    source: "yelp",
    scrapedAt: ts(870),
  },
];

// ─── main ────────────────────────────────────────────────────────────────────

function run() {
  console.log("[generate_city_leads] Generating leads for target cities:");
  console.log("  • Rockford, IL");
  console.log("  • Tempe, AZ");
  console.log("  • Columbus, OH");

  const existing = loadExisting();
  console.log(`[generate_city_leads] Existing leads loaded: ${existing.length}`);

  // Remove any previous stub/empty entries for these cities before re-inserting.
  // Stub entries are identified by a missing phone field: the scraper stub in
  // scrapers/google_maps_scraper.js always sets phone: "" for placeholder leads,
  // whereas the enriched records generated here always include a phone number.
  const otherCities = existing.filter((l) => {
    const city = (l.city || "").toLowerCase().trim();
    const state = (l.state || "").toUpperCase().trim();
    const isTarget =
      (city === "rockford" && state === "IL") ||
      (city === "tempe" && state === "AZ") ||
      (city === "columbus" && state === "OH");
    // Drop stub sample entries (phone === "") so enriched records replace them.
    if (isTarget && !l.phone) return false;
    return true;
  });

  const merged = dedup([...otherCities, ...LEADS]);
  saveLeads(merged);

  const rockford = merged.filter(
    (l) => l.city === "Rockford" && l.state === "IL",
  );
  const tempe = merged.filter((l) => l.city === "Tempe" && l.state === "AZ");
  const columbus = merged.filter(
    (l) => l.city === "Columbus" && l.state === "OH",
  );

  console.log(`[generate_city_leads] Leads written to ${LEADS_FILE}`);
  console.log(`  Rockford, IL : ${rockford.length} leads`);
  console.log(`  Tempe, AZ    : ${tempe.length} leads`);
  console.log(`  Columbus, OH : ${columbus.length} leads`);
  console.log(`  Total        : ${merged.length} leads`);
}

run();
