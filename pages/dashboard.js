/**
 * XPS Lead Intelligence Dashboard — dashboard.js
 * Enterprise-grade: data normalization, mobile cards, lead modal,
 * CSV export, city spotlight, auto-refresh, connection status.
 */

/* ═══════════════════════════════════════════════════════════
   SAMPLE / SEED LEADS
   ═══════════════════════════════════════════════════════════ */
const SAMPLE_LEADS = [
  { id:1, company:"ProEpoxy Solutions", contact:"Mark Rivera", phone:"(614) 555-0101", email:"mark@proepoxy.com", website:"https://proepoxy.com", city:"Columbus", state:"OH", industry:"Epoxy", rating:4.8, reviews:142, score:88, status:"qualified", date:"2025-03-01", source:"sample" },
  { id:2, company:"Concrete Masters LLC", contact:"Sarah Kim", phone:"(480) 555-0192", email:"sarah@concretemasters.com", website:"https://concretemasters.com", city:"Tempe", state:"AZ", industry:"Concrete", rating:4.5, reviews:98, score:76, status:"contacted", date:"2025-03-01", source:"sample" },
  { id:3, company:"GlossFloor Chicago", contact:"David Park", phone:"(312) 555-0345", email:"", website:"", city:"West Chicago", state:"IL", industry:"Epoxy", rating:4.2, reviews:55, score:52, status:"new", date:"2025-03-02", source:"sample" },
  { id:4, company:"OKC Floor Systems", contact:"Lisa Moore", phone:"(405) 555-0567", email:"lisa@okcfloor.com", website:"https://okcfloor.com", city:"Oklahoma City", state:"OK", industry:"Concrete", rating:4.6, reviews:77, score:71, status:"contacted", date:"2025-03-02", source:"sample" },
  { id:5, company:"SurfacePro FL", contact:"James White", phone:"(954) 555-0789", email:"james@surfacepro.com", website:"https://surfacepro.com", city:"Pompano Beach", state:"FL", industry:"SurfacePrep", rating:4.9, reviews:213, score:94, status:"converted", date:"2025-02-28", source:"sample" },
  { id:6, company:"Midwest Resin Works", contact:"Tom Hansen", phone:"", email:"", website:"", city:"Columbus", state:"OH", industry:"Epoxy", rating:3.8, reviews:22, score:31, status:"new", date:"2025-03-03", source:"sample" },
  { id:7, company:"Arizona Polished Concrete", contact:"Elena Cruz", phone:"(602) 555-0234", email:"elena@azpolished.com", website:"https://azpolished.com", city:"Tempe", state:"AZ", industry:"Concrete", rating:4.7, reviews:89, score:82, status:"qualified", date:"2025-03-03", source:"sample" },
  { id:8, company:"FlakeFloor Inc.", contact:"Ryan Scott", phone:"(614) 555-0891", email:"ryan@flakefloor.com", website:"https://flakefloor.com", city:"Columbus", state:"OH", industry:"Epoxy", rating:4.4, reviews:67, score:73, status:"new", date:"2025-03-04", source:"sample" },
  { id:9, company:"IL Concrete Co.", contact:"Nancy Bell", phone:"(630) 555-0123", email:"nancy@ilconcrete.com", website:"https://ilconcrete.com", city:"Rockville", state:"IL", industry:"Concrete", rating:4.3, reviews:44, score:65, status:"contacted", date:"2025-03-04", source:"sample" },
  { id:10, company:"ToughCoat Flooring", contact:"Chris Adams", phone:"(954) 555-0456", email:"chris@toughcoat.com", website:"https://toughcoat.com", city:"Pompano Beach", state:"FL", industry:"Epoxy", rating:4.6, reviews:101, score:80, status:"qualified", date:"2025-03-04", source:"sample" },
  { id:11, company:"Grind & Shine LLC", contact:"Amy Foster", phone:"(405) 555-0678", email:"amy@grindshine.com", website:"https://grindshine.com", city:"Oklahoma City", state:"OK", industry:"SurfacePrep", rating:4.1, reviews:30, score:58, status:"new", date:"2025-03-05", source:"sample" },
  { id:12, company:"LevelUp Concrete", contact:"Kevin Turner", phone:"(312) 555-0567", email:"", website:"", city:"Rockville", state:"IL", industry:"Concrete", rating:3.9, reviews:18, score:28, status:"new", date:"2025-03-05", source:"sample" },
  { id:13, company:"ResinPros AZ", contact:"Olivia Lane", phone:"(480) 555-0345", email:"olivia@resinpros.com", website:"https://resinpros.com", city:"Tempe", state:"AZ", industry:"Epoxy", rating:4.8, reviews:156, score:91, status:"converted", date:"2025-02-27", source:"sample" },
  { id:14, company:"BlastMasters Corp", contact:"Derek Hughes", phone:"(877) 555-0001", email:"derek@blastmasters.com", website:"https://blastmasters.com", city:"Pompano Beach", state:"FL", industry:"SurfacePrep", rating:4.5, reviews:72, score:74, status:"qualified", date:"2025-03-01", source:"sample" },
  { id:15, company:"TopCoat OH", contact:"Samantha Vega", phone:"(614) 555-0999", email:"sam@topcoatoh.com", website:"https://topcoatoh.com", city:"Columbus", state:"OH", industry:"Epoxy", rating:4.7, reviews:188, score:87, status:"qualified", date:"2025-03-02", source:"sample" },
  { id:16, company:"Desert Epoxy Solutions", contact:"", phone:"(480) 555-1101", email:"info@desertepoxy.com", website:"https://desertepoxy.com", city:"Tempe", state:"AZ", industry:"Epoxy", rating:4.9, reviews:83, score:95, status:"new", date:"", source:"google_maps" },
  { id:17, company:"Rockville Floor Pros", contact:"", phone:"(815) 555-0222", email:"contact@rockvillefloor.com", website:"https://rockvillefloor.com", city:"Rockville", state:"IL", industry:"Flooring", rating:4.3, reviews:38, score:66, status:"new", date:"", source:"yelp" },
  { id:18, company:"Columbus Epoxy Kings", contact:"", phone:"(614) 555-0444", email:"", website:"", city:"Columbus", state:"OH", industry:"Epoxy", rating:4.0, reviews:15, score:40, status:"new", date:"", source:"bing_maps" },
];

/* ═══════════════════════════════════════════════════════════
   TERMINAL COMMANDS
   ═══════════════════════════════════════════════════════════ */
const COMMANDS_HELP = [
  { cmd: "help",                 desc: "Show available commands" },
  { cmd: "leads list",           desc: "List all leads" },
  { cmd: "leads status <s>",     desc: "Filter by status (new|contacted|qualified|converted)" },
  { cmd: "leads top <n>",        desc: "Show top N leads by score" },
  { cmd: "leads city <city>",    desc: "Filter leads by city name" },
  { cmd: "stats",                desc: "Show lead statistics summary" },
  { cmd: "score <company>",      desc: "Show score breakdown for a company" },
  { cmd: "export",               desc: "Export filtered leads as CSV" },
  { cmd: "refresh",              desc: "Reload live data now" },
  { cmd: "clear",                desc: "Clear terminal output" },
];

/* ═══════════════════════════════════════════════════════════
   APPLICATION STATE
   ═══════════════════════════════════════════════════════════ */
const state = {
  leads: [],
  filtered: [],
  sortCol: "score",
  sortDir: "desc",
  filterStatus: "",
  filterIndustry: "",
  filterState: "",
  filterCity: "",
  searchQuery: "",
  page: 1,
  pageSize: 10,
  activeTab: "overview",
  charts: {},
  termHistory: [],
  termHistoryIdx: -1,
  isLiveData: false,
  lastUpdated: null,
  refreshTimer: null,
  AUTO_REFRESH_MS: 5 * 60 * 1000, // 5 minutes
};

/* ═══════════════════════════════════════════════════════════
   DATA NORMALIZATION
   ═══════════════════════════════════════════════════════════ */
/**
 * Normalizes a lead from any source format into the canonical shape.
 * Handles: lead_score vs score, company_name vs company,
 *          date_scraped vs date, missing fields, etc.
 */
function normalizeLead(l, index) {
  const score = Number(l.lead_score ?? l.score ?? 0) || 0;
  const company = (l.company || l.company_name || "Unknown").trim();
  const status = (l.status || "new").toLowerCase();
  const date = l.date_scraped || l.date || "";
  const website = l.website || "";
  const email = l.email || "";
  const phone = l.phone || "";
  const city = l.city || "";
  const stateVal = l.state || "";
  const industry = l.industry || l.category || "Other";
  const rating = Number(l.rating) || 0;
  const reviews = Number(l.reviews) || 0;
  const source = l.source || "unknown";
  const tier = score >= 75 ? "hot" : score >= 50 ? "warm" : "cold";

  return {
    id: l.id || index + 1,
    company,
    contact: l.contact || l.contact_name || "",
    phone,
    email,
    website: website && !website.startsWith("http") ? "https://" + website : website,
    city,
    state: stateVal,
    industry,
    rating,
    reviews,
    score,
    status,
    date,
    source,
    tier,
  };
}

function normalizeLeads(leads) {
  return leads.map(normalizeLead);
}

/* ═══════════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════════ */
function scoreColor(score) {
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  if (score >= 25) return "#3b82f6";
  return "#6b7280";
}

function tierLabel(score) {
  if (score >= 75) return "🔥 HOT";
  if (score >= 50) return "♨️ WARM";
  return "❄️ COLD";
}

function tierClass(score) {
  if (score >= 75) return "hot";
  if (score >= 50) return "warm";
  return "cold";
}

function statusBadge(status) {
  const map = {
    new:       ["badge-new",       "🔵", "New"],
    contacted: ["badge-contacted", "🟡", "Contacted"],
    qualified: ["badge-qualified", "🟢", "Qualified"],
    converted: ["badge-converted", "🟣", "Converted"],
    pending:   ["badge-pending",   "⚪", "Pending"],
  };
  const [cls, dot, label] = map[status] || map.pending;
  return `<span class="badge ${cls}">${dot} ${label}</span>`;
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (isNaN(diff) || diff < 0) return "—";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

function companyInitial(company) {
  return (company || "?").charAt(0).toUpperCase();
}

/* ═══════════════════════════════════════════════════════════
   CSV EXPORT
   ═══════════════════════════════════════════════════════════ */
window.exportCSV = function () {
  const headers = ["ID","Company","Phone","Email","Website","City","State","Industry","Rating","Reviews","Score","Status","Source","Date"];
  const rows = state.filtered.map(l => [
    l.id,
    `"${(l.company||"").replace(/"/g,'""')}"`,
    `"${(l.phone||"").replace(/"/g,'""')}"`,
    `"${(l.email||"").replace(/"/g,'""')}"`,
    `"${(l.website||"").replace(/"/g,'""')}"`,
    `"${(l.city||"").replace(/"/g,'""')}"`,
    l.state || "",
    l.industry || "",
    l.rating || 0,
    l.reviews || 0,
    l.score || 0,
    l.status || "",
    l.source || "",
    `"${(l.date||"").replace(/"/g,'""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xps_leads_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  termPrint(`Exported ${state.filtered.length} leads to CSV.`, "success");
};

/* ═══════════════════════════════════════════════════════════
   KPI COMPUTATION
   ═══════════════════════════════════════════════════════════ */
function computeStats(leads) {
  const total = leads.length;
  const withEmail = leads.filter(l => l.email).length;
  const withPhone = leads.filter(l => l.phone).length;
  const hot = leads.filter(l => l.score >= 75).length;
  const warm = leads.filter(l => l.score >= 50 && l.score < 75).length;
  const cold = leads.filter(l => l.score < 50).length;
  const highScore = total ? Math.max(...leads.map(l => l.score)) : 0;
  const converted = leads.filter(l => l.status === "converted").length;
  const contacted = leads.filter(l => l.status === "contacted").length;
  const avgScore = total
    ? Math.round(leads.reduce((a, l) => a + l.score, 0) / total)
    : 0;
  return { total, withEmail, withPhone, hot, warm, cold, highScore, converted, contacted, avgScore };
}

/* ═══════════════════════════════════════════════════════════
   FILTERING & SORTING
   ═══════════════════════════════════════════════════════════ */
function applyFilters() {
  let leads = [...state.leads];

  if (state.filterStatus) {
    leads = leads.filter(l => l.status === state.filterStatus);
  }
  if (state.filterIndustry) {
    leads = leads.filter(l => l.industry === state.filterIndustry);
  }
  if (state.filterState) {
    leads = leads.filter(l => l.state === state.filterState);
  }
  if (state.filterCity) {
    leads = leads.filter(l => l.city.toLowerCase().includes(state.filterCity.toLowerCase()));
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    leads = leads.filter(l =>
      (l.company || "").toLowerCase().includes(q) ||
      (l.city    || "").toLowerCase().includes(q) ||
      (l.contact || "").toLowerCase().includes(q) ||
      (l.industry|| "").toLowerCase().includes(q) ||
      (l.email   || "").toLowerCase().includes(q) ||
      (l.phone   || "").toLowerCase().includes(q)
    );
  }

  leads.sort((a, b) => {
    let av = a[state.sortCol] ?? "";
    let bv = b[state.sortCol] ?? "";
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return state.sortDir === "asc" ? -1 : 1;
    if (av > bv) return state.sortDir === "asc" ? 1 : -1;
    return 0;
  });

  state.filtered = leads;
  state.page = 1;

  // Update filter count
  const countEl = document.getElementById("filterCount");
  if (countEl) countEl.textContent = `${state.filtered.length} lead${state.filtered.length !== 1 ? "s" : ""}`;
}

/* ═══════════════════════════════════════════════════════════
   TABLE RENDERING (desktop)
   ═══════════════════════════════════════════════════════════ */
function renderTable() {
  const start = (state.page - 1) * state.pageSize;
  const pageLeads = state.filtered.slice(start, start + state.pageSize);
  const tbody = document.getElementById("leadsTableBody");
  if (!tbody) return;

  if (pageLeads.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:0">
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>No leads match your current filters.</p>
      </div>
    </td></tr>`;
  } else {
    tbody.innerHTML = pageLeads.map(lead => `
      <tr data-id="${lead.id}" onclick="openLeadModal(${lead.id})" style="cursor:pointer">
        <td>
          <div class="company-name">${escapeHtml(lead.company)}</div>
          <div class="company-sub">${escapeHtml(lead.city)}${lead.state ? ", " + escapeHtml(lead.state) : ""}</div>
        </td>
        <td><span class="industry-pill">${escapeHtml(lead.industry)}</span></td>
        <td>
          <div class="score-cell">
            <div class="score-bar-bg">
              <div class="score-bar-fill" style="width:${lead.score}%;background:${scoreColor(lead.score)}"></div>
            </div>
            <span class="score-val" style="color:${scoreColor(lead.score)}">${lead.score}</span>
          </div>
        </td>
        <td>${statusBadge(lead.status)}</td>
        <td class="col-hide-sm fs-12 text-muted">${lead.phone ? escapeHtml(lead.phone) : '<span style="opacity:.35">—</span>'}</td>
        <td class="col-hide-sm fs-12">
          ${lead.email
            ? `<a href="mailto:${escapeHtml(lead.email)}" style="color:var(--gold);text-decoration:none;font-size:12px" onclick="event.stopPropagation()">${escapeHtml(lead.email)}</a>`
            : '<span style="opacity:.35;font-size:12px">—</span>'}
        </td>
        <td class="col-hide-md fs-12 text-muted">${timeAgo(lead.date)}</td>
        <td class="col-hide-md">
          <div class="row-actions">
            ${lead.phone ? `<a class="row-action-btn" href="tel:${escapeHtml(lead.phone)}" title="Call" onclick="event.stopPropagation()">📞</a>` : ""}
            ${lead.email ? `<a class="row-action-btn" href="mailto:${escapeHtml(lead.email)}" title="Email" onclick="event.stopPropagation()">📧</a>` : ""}
            ${lead.website ? `<a class="row-action-btn" href="${escapeHtml(lead.website)}" target="_blank" rel="noopener" title="Website" onclick="event.stopPropagation()">🌐</a>` : ""}
          </div>
        </td>
      </tr>
    `).join("");
  }

  renderPagination();
}

/* ═══════════════════════════════════════════════════════════
   MOBILE LEAD CARDS
   ═══════════════════════════════════════════════════════════ */
function renderLeadCards() {
  const start = (state.page - 1) * state.pageSize;
  const pageLeads = state.filtered.slice(start, start + state.pageSize);
  const container = document.getElementById("leadCards");
  if (!container) return;

  if (pageLeads.length === 0) {
    container.innerHTML = `<div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>No leads match your current filters.</p>
    </div>`;
    return;
  }

  container.innerHTML = pageLeads.map(lead => `
    <div class="lead-card" onclick="openLeadModal(${lead.id})" role="button" tabindex="0"
      onkeydown="if(event.key==='Enter')openLeadModal(${lead.id})">
      <div class="lead-card-header">
        <div class="lead-card-title">
          <div class="lead-card-company">${escapeHtml(lead.company)}</div>
          <div class="lead-card-location">
            <span>📍</span>
            ${escapeHtml(lead.city)}${lead.state ? ", " + escapeHtml(lead.state) : ""}
          </div>
        </div>
        <div class="lead-card-score-wrap">
          <div class="lead-card-score" style="background:${scoreColor(lead.score)}">
            ${lead.score}
          </div>
          <div class="lead-card-tier" style="color:${scoreColor(lead.score)}">
            ${lead.score >= 75 ? "HOT" : lead.score >= 50 ? "WARM" : "COLD"}
          </div>
        </div>
      </div>

      <div class="lead-card-body">
        <div class="lead-card-row">
          <div class="lead-card-meta">
            <span class="industry-pill">${escapeHtml(lead.industry)}</span>
            ${statusBadge(lead.status)}
          </div>
        </div>
        ${lead.rating ? `
        <div class="lead-card-row">
          <span class="lead-card-stars">${renderStars(lead.rating)} <span style="color:var(--text-muted);font-size:11px">${lead.rating.toFixed(1)} (${lead.reviews})</span></span>
        </div>` : ""}
      </div>

      <div class="lead-card-actions">
        ${lead.phone
          ? `<a class="lead-action-btn phone" href="tel:${escapeHtml(lead.phone)}" onclick="event.stopPropagation()">📞 Call</a>`
          : `<span class="lead-action-btn" style="opacity:.35;pointer-events:none">📞 No Phone</span>`}
        ${lead.email
          ? `<a class="lead-action-btn email" href="mailto:${escapeHtml(lead.email)}" onclick="event.stopPropagation()">📧 Email</a>`
          : `<span class="lead-action-btn" style="opacity:.35;pointer-events:none">📧 No Email</span>`}
        ${lead.website
          ? `<a class="lead-action-btn web" href="${escapeHtml(lead.website)}" target="_blank" rel="noopener" onclick="event.stopPropagation()">🌐 Web</a>`
          : `<span class="lead-action-btn" style="opacity:.35;pointer-events:none">🌐 No Site</span>`}
      </div>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════════════════════════
   PAGINATION
   ═══════════════════════════════════════════════════════════ */
function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  const paginationInfo = document.getElementById("paginationInfo");
  const paginationBtns = document.getElementById("paginationBtns");
  if (!paginationInfo || !paginationBtns) return;

  const start = (state.page - 1) * state.pageSize + 1;
  const end = Math.min(state.page * state.pageSize, state.filtered.length);
  paginationInfo.textContent = state.filtered.length
    ? `Showing ${start}–${end} of ${state.filtered.length}`
    : "No results";

  let btns = `<button class="page-btn" ${state.page <= 1 ? "disabled" : ""} onclick="changePage(${state.page - 1})">‹</button>`;
  for (let p = 1; p <= totalPages; p++) {
    if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - state.page) <= 1) {
      btns += `<button class="page-btn ${p === state.page ? "active" : ""}" onclick="changePage(${p})">${p}</button>`;
    } else if (Math.abs(p - state.page) === 2) {
      btns += `<span style="color:var(--text-muted);padding:0 4px;font-size:13px">…</span>`;
    }
  }
  btns += `<button class="page-btn" ${state.page >= totalPages ? "disabled" : ""} onclick="changePage(${state.page + 1})">›</button>`;
  paginationBtns.innerHTML = btns;
}

window.changePage = function (p) {
  state.page = p;
  renderTable();
  renderLeadCards();
  renderPagination();
};

/* ═══════════════════════════════════════════════════════════
   SORT
   ═══════════════════════════════════════════════════════════ */
window.sortBy = function (col) {
  if (state.sortCol === col) {
    state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
  } else {
    state.sortCol = col;
    state.sortDir = col === "score" ? "desc" : "asc";
  }

  document.querySelectorAll(".leads-table th").forEach(th => {
    th.classList.remove("sorted");
    const arrow = th.querySelector(".sort-arrow");
    if (arrow) arrow.textContent = "";
  });
  const activeHeader = document.querySelector(`[data-sort="${col}"]`);
  if (activeHeader) {
    activeHeader.classList.add("sorted");
    const arrow = activeHeader.querySelector(".sort-arrow");
    if (arrow) arrow.textContent = state.sortDir === "asc" ? " ↑" : " ↓";
  }

  applyFilters();
  renderTable();
  renderLeadCards();
};

/* ═══════════════════════════════════════════════════════════
   LEAD DETAIL MODAL
   ═══════════════════════════════════════════════════════════ */
window.openLeadModal = function (leadId) {
  const lead = state.leads.find(l => l.id === leadId || l.id === String(leadId));
  if (!lead) return;

  const modal = document.getElementById("leadModal");
  if (!modal) return;

  // Populate header
  const icon = document.getElementById("modalCompanyIcon");
  if (icon) icon.textContent = companyInitial(lead.company);

  const nameEl = document.getElementById("modalCompanyName");
  if (nameEl) nameEl.textContent = lead.company;

  const locEl = document.getElementById("modalLocation");
  if (locEl) locEl.textContent = [lead.city, lead.state].filter(Boolean).join(", ") || "—";

  // Score ring
  const ring = document.getElementById("modalScoreRing");
  if (ring) ring.style.background = scoreColor(lead.score);

  const scoreVal = document.getElementById("modalScoreVal");
  if (scoreVal) scoreVal.textContent = lead.score;

  // Tier badge
  const tierBadge = document.getElementById("modalTierBadge");
  if (tierBadge) {
    tierBadge.textContent = tierLabel(lead.score);
    tierBadge.className = "modal-tier-badge " + tierClass(lead.score);
  }

  const industryEl = document.getElementById("modalIndustry");
  if (industryEl) industryEl.textContent = lead.industry || "—";

  const ratingEl = document.getElementById("modalRating");
  if (ratingEl) ratingEl.textContent = lead.rating ? `${renderStars(lead.rating)} ${lead.rating.toFixed(1)} (${lead.reviews} reviews)` : "—";

  // Status badge
  const statusEl = document.getElementById("modalStatusBadge");
  if (statusEl) statusEl.innerHTML = statusBadge(lead.status);

  // Action buttons
  const phoneBtn = document.getElementById("modalPhoneBtn");
  if (phoneBtn) {
    if (lead.phone) {
      phoneBtn.href = `tel:${lead.phone}`;
      phoneBtn.classList.remove("disabled");
    } else {
      phoneBtn.href = "#";
      phoneBtn.classList.add("disabled");
    }
  }

  const emailBtn = document.getElementById("modalEmailBtn");
  if (emailBtn) {
    if (lead.email) {
      emailBtn.href = `mailto:${lead.email}`;
      emailBtn.classList.remove("disabled");
    } else {
      emailBtn.href = "#";
      emailBtn.classList.add("disabled");
    }
  }

  const webBtn = document.getElementById("modalWebsiteBtn");
  if (webBtn) {
    if (lead.website) {
      webBtn.href = lead.website;
      webBtn.classList.remove("disabled");
    } else {
      webBtn.href = "#";
      webBtn.classList.add("disabled");
    }
  }

  // Detail rows
  const setDetail = (id, val, isLink) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!val) { el.textContent = "—"; return; }
    if (isLink === "email") {
      el.innerHTML = `<a href="mailto:${escapeHtml(val)}" style="color:var(--gold)">${escapeHtml(val)}</a>`;
    } else if (isLink === "web") {
      el.innerHTML = `<a href="${escapeHtml(val)}" target="_blank" rel="noopener" style="color:var(--gold)">${escapeHtml(val)}</a>`;
    } else {
      el.textContent = val;
    }
  };

  setDetail("modalPhone", lead.phone);
  setDetail("modalEmail", lead.email, "email");
  setDetail("modalWebsite", lead.website, "web");
  setDetail("modalIndustryDetail", lead.industry);
  setDetail("modalSource", lead.source);
  setDetail("modalRatingDetail", lead.rating ? `${lead.rating.toFixed(1)} ★ (${lead.reviews} reviews)` : "");
  setDetail("modalReviews", lead.reviews ? String(lead.reviews) : "");
  setDetail("modalDate", lead.date ? formatDate(lead.date) : "");

  // Open
  modal.removeAttribute("aria-hidden");
  modal.classList.add("open");
  document.body.style.overflow = "hidden";
};

window.closeLeadModal = function () {
  const modal = document.getElementById("leadModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
};

/* ═══════════════════════════════════════════════════════════
   KPI STAT CARDS
   ═══════════════════════════════════════════════════════════ */
function renderStats() {
  const s = computeStats(state.leads);
  const el = id => document.getElementById(id);

  const animateVal = (id, val) => {
    const e = el(id);
    if (!e) return;
    e.textContent = val;
    e.style.animation = "none";
    // Trigger reflow
    void e.offsetHeight;
    e.style.animation = "countUp 0.3s ease";
  };

  animateVal("stat-total", s.total);
  animateVal("stat-hot", s.hot);
  animateVal("stat-warm", s.warm);
  animateVal("stat-cold", s.cold);
  animateVal("stat-highscore", s.highScore);
  animateVal("stat-converted", s.converted);
  animateVal("stat-avgscore", s.avgScore);
  animateVal("stat-outreach", s.contacted);

  // Nav badges
  const badgeOvEl = el("nav-badge-overview");
  if (badgeOvEl) badgeOvEl.textContent = s.total;
  const badgeLeadsEl = el("nav-badge-leads");
  if (badgeLeadsEl) badgeLeadsEl.textContent = s.hot;

  // Analytics — tiers
  const setEl = (id, val) => { const e = el(id); if (e) e.textContent = val; };
  setEl("tier-hot-count", s.hot);
  setEl("tier-warm-count", s.warm);
  setEl("tier-cold-count", s.cold);

  // Pipeline bars
  const statusCounts = {
    new: state.leads.filter(l => l.status === "new").length,
    contacted: s.contacted,
    qualified: state.leads.filter(l => l.status === "qualified").length,
    converted: s.converted,
  };
  const maxCount = Math.max(1, ...Object.values(statusCounts));
  for (const [status, count] of Object.entries(statusCounts)) {
    const barEl = el("pipeline-" + status);
    const countEl = el("pipeline-" + status + "-count");
    if (barEl) barEl.style.width = Math.round((count / maxCount) * 100) + "%";
    if (countEl) countEl.textContent = count;
  }

  renderTopLeadsPreview();
  renderCitiesAnalytics();
}

function renderTopLeadsPreview() {
  const container = document.getElementById("topLeadsPreview");
  if (!container) return;
  const hotLeads = [...state.leads].filter(l => l.score >= 75).sort((a, b) => b.score - a.score).slice(0, 6);
  if (!hotLeads.length) {
    container.innerHTML = '<p class="empty-hint">No HOT leads yet. Run the scraper to discover leads.</p>';
    return;
  }
  container.innerHTML = hotLeads.map(l => `
    <div class="top-lead-row" onclick="openLeadModal(${l.id})" role="button">
      <div class="top-lead-info">
        <span class="top-lead-company">${escapeHtml(l.company)}</span>
        <span class="top-lead-location">${escapeHtml(l.city || "")}${l.state ? ", " + escapeHtml(l.state) : ""}</span>
      </div>
      <div class="top-lead-meta">
        <span class="industry-pill">${escapeHtml(l.industry || "")}</span>
        <span class="score-badge" style="background:${scoreColor(l.score)}">${l.score}</span>
      </div>
    </div>
  `).join("");
}

function renderCitiesAnalytics() {
  const container = document.getElementById("citiesAnalytics");
  if (!container) return;
  const cityMap = {};
  state.leads.forEach(l => {
    if (l.city) {
      const key = l.city + (l.state ? ", " + l.state : "");
      cityMap[key] = (cityMap[key] || 0) + 1;
    }
  });
  const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!sorted.length) {
    container.innerHTML = '<p class="empty-hint">No city data available yet.</p>';
    return;
  }
  const max = sorted[0][1];
  container.innerHTML = sorted.map(([city, count]) => `
    <div class="city-row">
      <span class="city-name" title="${escapeHtml(city)}">${escapeHtml(city)}</span>
      <div class="city-bar-wrap"><div class="city-bar" style="width:${Math.round((count / max) * 100)}%"></div></div>
      <span class="city-count">${count}</span>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════════════════════════
   CHARTS
   ═══════════════════════════════════════════════════════════ */
function buildCharts() {
  if (typeof Chart === "undefined") return;

  const isDark = document.documentElement.getAttribute("data-theme") !== "light";
  const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const labelColor = isDark ? "#888888" : "#666666";
  const borderColor = isDark ? "#1c1c1c" : "#ffffff";

  Chart.defaults.color = labelColor;
  Chart.defaults.borderColor = gridColor;
  Chart.defaults.font.family = "'Inter','Segoe UI',system-ui,sans-serif";
  Chart.defaults.font.size = 11;

  // Industry doughnut
  const industryCounts = {};
  state.leads.forEach(l => { industryCounts[l.industry] = (industryCounts[l.industry] || 0) + 1; });
  const industryCtx = document.getElementById("industryChart");
  if (industryCtx) {
    if (state.charts.industry) state.charts.industry.destroy();
    state.charts.industry = new Chart(industryCtx, {
      type: "doughnut",
      data: {
        labels: Object.keys(industryCounts),
        datasets: [{
          data: Object.values(industryCounts),
          backgroundColor: ["#EAB308","#ef4444","#3b82f6","#22c55e","#a855f7","#f59e0b"],
          borderWidth: 2,
          borderColor,
          hoverOffset: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { position: "bottom", labels: { padding: 12, boxWidth: 10 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed}` } },
        },
      },
    });
  }

  // Status bar
  const statusCounts = { new: 0, contacted: 0, qualified: 0, converted: 0 };
  state.leads.forEach(l => { if (statusCounts[l.status] !== undefined) statusCounts[l.status]++; });
  const statusCtx = document.getElementById("statusChart");
  if (statusCtx) {
    if (state.charts.status) state.charts.status.destroy();
    state.charts.status = new Chart(statusCtx, {
      type: "bar",
      data: {
        labels: ["New", "Contacted", "Qualified", "Converted"],
        datasets: [{
          data: Object.values(statusCounts),
          backgroundColor: ["rgba(59,130,246,0.75)","rgba(234,179,8,0.75)","rgba(34,197,94,0.75)","rgba(168,85,247,0.75)"],
          borderColor: ["#3b82f6","#EAB308","#22c55e","#a855f7"],
          borderWidth: 1,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { precision: 0, color: labelColor } },
          y: { grid: { display: false }, ticks: { color: labelColor } },
        },
      },
    });
  }

  // Score distribution histogram
  const buckets = ["0–20","21–40","41–60","61–80","81–100"];
  const bucketCounts = [0,0,0,0,0];
  state.leads.forEach(l => { const b = Math.min(4, Math.floor(l.score / 20)); bucketCounts[b]++; });
  const scoreDistCtx = document.getElementById("scoreDistChart");
  if (scoreDistCtx) {
    if (state.charts.scoreDist) state.charts.scoreDist.destroy();
    state.charts.scoreDist = new Chart(scoreDistCtx, {
      type: "bar",
      data: {
        labels: buckets,
        datasets: [{
          label: "Leads",
          data: bucketCounts,
          backgroundColor: ["rgba(107,114,128,0.7)","rgba(59,130,246,0.7)","rgba(234,179,8,0.7)","rgba(249,115,22,0.7)","rgba(239,68,68,0.8)"],
          borderWidth: 0,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: labelColor } },
          y: { grid: { color: gridColor }, ticks: { precision: 0, color: labelColor } },
        },
      },
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   COMMAND TERMINAL
   ═══════════════════════════════════════════════════════════ */
function termPrint(text, cls = "output") {
  const body = document.getElementById("terminalBody");
  if (!body) return;
  const line = document.createElement("div");
  line.className = `terminal-line ${cls}`;
  line.textContent = text;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

window.termClear = function () {
  const body = document.getElementById("terminalBody");
  if (body) body.innerHTML = "";
};

function runCommand(cmd) {
  const trimmed = cmd.trim();
  if (!trimmed) return;
  state.termHistory.unshift(trimmed);
  state.termHistoryIdx = -1;
  termPrint(`xps> ${trimmed}`, "prompt");

  const parts = trimmed.toLowerCase().split(/\s+/);

  if (parts[0] === "help") {
    termPrint("Available commands:", "info");
    COMMANDS_HELP.forEach(c => termPrint(`  ${c.cmd.padEnd(25)} ${c.desc}`, "output"));

  } else if (parts[0] === "clear") {
    window.termClear();

  } else if (parts[0] === "stats") {
    const s = computeStats(state.leads);
    termPrint(`Total leads      : ${s.total}`, "output");
    termPrint(`HOT (≥75)        : ${s.hot}`, "warning");
    termPrint(`WARM (50–74)     : ${s.warm}`, "info");
    termPrint(`COLD (<50)       : ${s.cold}`, "comment");
    termPrint(`Top score        : ${s.highScore}`, "output");
    termPrint(`Avg score        : ${s.avgScore}`, "output");
    termPrint(`Converted        : ${s.converted}`, "success");
    termPrint(`With email       : ${s.withEmail}`, "output");
    termPrint(`With phone       : ${s.withPhone}`, "output");
    termPrint(`Data mode        : ${state.isLiveData ? "LIVE" : "DEMO"}`, state.isLiveData ? "success" : "warning");

  } else if (parts[0] === "leads" && parts[1] === "list") {
    state.leads.slice(0, 10).forEach(l =>
      termPrint(`  [${String(l.score).padStart(3)}] ${l.company.padEnd(30)} ${l.city}, ${l.state}  (${l.status})`)
    );
    if (state.leads.length > 10)
      termPrint(`  … and ${state.leads.length - 10} more`, "comment");

  } else if (parts[0] === "leads" && parts[1] === "status") {
    const s = parts[2];
    if (!s) { termPrint("Usage: leads status <new|contacted|qualified|converted>", "warning"); return; }
    const filtered = state.leads.filter(l => l.status === s);
    if (!filtered.length) { termPrint(`No leads with status "${s}"`, "warning"); return; }
    termPrint(`Leads with status "${s}" (${filtered.length}):`, "info");
    filtered.forEach(l => termPrint(`  [${String(l.score).padStart(3)}] ${l.company}  — ${l.city}, ${l.state}`));

  } else if (parts[0] === "leads" && parts[1] === "top") {
    const n = parseInt(parts[2]) || 5;
    const top = [...state.leads].sort((a, b) => b.score - a.score).slice(0, n);
    termPrint(`Top ${n} leads by score:`, "info");
    top.forEach((l, i) =>
      termPrint(`  ${String(i + 1).padStart(2)}. [${l.score}] ${l.company.padEnd(30)} ${l.city}, ${l.state}`)
    );

  } else if (parts[0] === "leads" && parts[1] === "city") {
    const cityQ = parts.slice(2).join(" ");
    if (!cityQ) { termPrint("Usage: leads city <city name>", "warning"); return; }
    const filtered = state.leads.filter(l => (l.city || "").toLowerCase().includes(cityQ));
    if (!filtered.length) { termPrint(`No leads found in "${cityQ}"`, "warning"); return; }
    termPrint(`Leads in "${cityQ}" (${filtered.length}):`, "info");
    filtered.forEach(l => termPrint(`  [${String(l.score).padStart(3)}] ${l.company}  (${l.status})`));

  } else if (parts[0] === "score") {
    const query = parts.slice(1).join(" ");
    const lead = state.leads.find(l => l.company.toLowerCase().includes(query));
    if (!lead) { termPrint(`Lead not found: "${query}"`, "warning"); return; }
    termPrint(`Score breakdown for "${lead.company}":`, "info");
    termPrint(`  Website present  : ${lead.website ? "+10" : "  0"}`, "output");
    termPrint(`  Email present    : ${lead.email   ? "+15" : "  0"}`, "output");
    termPrint(`  Phone present    : ${lead.phone   ? "+10" : "  0"}`, "output");
    termPrint(`  Reviews > 10     : ${lead.reviews > 10  ? " +5" : "  0"}`, "output");
    termPrint(`  Rating > 4       : ${lead.rating  > 4   ? "+10" : "  0"}`, "output");
    termPrint(`  ─────────────────────────────────────`, "comment");
    termPrint(`  Total score      : ${lead.score}`, "success");

  } else if (parts[0] === "export") {
    window.exportCSV();

  } else if (parts[0] === "refresh") {
    termPrint("Refreshing live data…", "info");
    loadLiveLeads();

  } else {
    termPrint(`Unknown command: "${trimmed}". Type "help" for available commands.`, "warning");
  }
}

/* ═══════════════════════════════════════════════════════════
   DATA STATUS BANNER
   ═══════════════════════════════════════════════════════════ */
function updateDataBanner(isLive, lastUpdate) {
  const dot    = document.getElementById("dataBannerDot");
  const text   = document.getElementById("dataBannerText");
  const timeEl = document.getElementById("dataBannerTime");

  if (!dot || !text) return;

  if (isLive) {
    dot.className = "data-banner-dot live";
    text.textContent = "Live Data";
    text.style.color = "var(--success)";
  } else {
    dot.className = "data-banner-dot demo";
    text.textContent = "Demo Mode";
    text.style.color = "var(--warning)";
  }

  if (lastUpdate && timeEl) {
    const d = new Date(lastUpdate);
    timeEl.textContent = "· updated " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  // Also update sidebar status
  const sidebarDot   = document.getElementById("sidebarStatusDot");
  const sidebarLabel = document.getElementById("sidebarStatusLabel");
  if (sidebarDot && sidebarLabel) {
    if (isLive) {
      sidebarDot.style.background = "var(--success)";
      sidebarLabel.textContent = "Live Data";
    } else {
      sidebarDot.style.background = "var(--warning)";
      sidebarLabel.textContent = "Demo Mode";
    }
  }
}

/* ═══════════════════════════════════════════════════════════
   AUTO-REFRESH
   ═══════════════════════════════════════════════════════════ */
function startAutoRefresh() {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  state.refreshTimer = setInterval(() => {
    loadLiveLeads(true); // silent refresh
  }, state.AUTO_REFRESH_MS);
}

function stopAutoRefresh() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }
}

/* ═══════════════════════════════════════════════════════════
   RENDER DASHBOARD
   ═══════════════════════════════════════════════════════════ */
function renderDashboard() {
  applyFilters();
  renderStats();
  renderTable();
  renderLeadCards();
  buildCharts();
}

/* ═══════════════════════════════════════════════════════════
   LIVE DATA LOADER
   ═══════════════════════════════════════════════════════════ */
function loadLiveLeads(silent = false) {
  const PATHS = [
    "./data/scored_leads.json",
    "../data/leads/scored_leads.json",
    "../data/scored_leads.json",
  ];

  if (!silent) {
    // Show spinning refresh indicator
    const refreshBtn = document.getElementById("dataBannerRefresh");
    if (refreshBtn) refreshBtn.classList.add("spinning");
  }

  function tryNext(index) {
    if (index >= PATHS.length) {
      console.info("[dashboard] No live data found. Using sample leads.");
      if (!silent || state.leads.length === 0) {
        state.leads = normalizeLeads(SAMPLE_LEADS);
        state.isLiveData = false;
        state.lastUpdated = new Date();
        renderDashboard();
        updateDataBanner(false, state.lastUpdated);
        bootTerminal();
      }
      const refreshBtn = document.getElementById("dataBannerRefresh");
      if (refreshBtn) refreshBtn.classList.remove("spinning");
      startAutoRefresh();
      return;
    }

    fetch(PATHS[index] + "?t=" + Date.now())
      .then(r => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          state.leads = normalizeLeads(data);
          state.isLiveData = true;
          state.lastUpdated = new Date();
          console.info(`[dashboard] Loaded ${data.length} live leads from ${PATHS[index]}`);
          renderDashboard();
          updateDataBanner(true, state.lastUpdated);
          if (!silent) bootTerminal();
          const refreshBtn = document.getElementById("dataBannerRefresh");
          if (refreshBtn) refreshBtn.classList.remove("spinning");
          startAutoRefresh();
        } else {
          tryNext(index + 1);
        }
      })
      .catch(() => tryNext(index + 1));
  }

  tryNext(0);
}

/* ═══════════════════════════════════════════════════════════
   LIVE CLOCK
   ═══════════════════════════════════════════════════════════ */
function startClock() {
  const el = document.getElementById("liveClock");
  if (!el) return;
  const update = () => {
    el.textContent = new Date().toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };
  update();
  setInterval(update, 30000);
}

/* ═══════════════════════════════════════════════════════════
   TERMINAL BOOT SEQUENCE
   ═══════════════════════════════════════════════════════════ */
let _booted = false;
function bootTerminal() {
  if (_booted) {
    termPrint("", "output");
    termPrint(`Data refreshed — ${state.leads.length} leads loaded (${state.isLiveData ? "LIVE" : "DEMO"})`, "success");
    return;
  }
  _booted = true;

  const lines = [
    ["# XPS Lead Intelligence System v1.0", "comment"],
    ["# Phase 7 — Autonomous Orchestration Active", "comment"],
    ["", "output"],
    ["Initializing lead database…", "info"],
    [`Loaded ${state.leads.length} leads [${state.isLiveData ? "LIVE" : "DEMO MODE"}]`, state.isLiveData ? "success" : "warning"],
    ["", "output"],
    ['Type "help" to see available commands.', "output"],
    ['Try: leads top 5 | stats | score ProEpoxy', "comment"],
  ];
  let delay = 0;
  lines.forEach(([text, cls]) => {
    setTimeout(() => termPrint(text, cls), delay);
    delay += 100;
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENT BINDING
   ═══════════════════════════════════════════════════════════ */
function bindEvents() {
  // Table sort headers
  document.querySelectorAll(".leads-table th[data-sort]").forEach(th => {
    th.addEventListener("click", () => sortBy(th.dataset.sort));
  });

  // Filter dropdowns / search
  const filterStatus   = document.getElementById("filterStatus");
  const filterIndustry = document.getElementById("filterIndustry");
  const filterState    = document.getElementById("filterStateEl");
  const searchInput    = document.getElementById("searchInput");

  if (filterStatus)   filterStatus.addEventListener("change",   e => { state.filterStatus   = e.target.value; applyFilters(); renderTable(); renderLeadCards(); });
  if (filterIndustry) filterIndustry.addEventListener("change", e => { state.filterIndustry = e.target.value; applyFilters(); renderTable(); renderLeadCards(); });
  if (filterState)    filterState.addEventListener("change",    e => { state.filterState    = e.target.value; applyFilters(); renderTable(); renderLeadCards(); });
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      applyFilters();
      renderTable();
      renderLeadCards();
    });
  }

  // Topbar search mirrors lead search
  const topbarSearch = document.getElementById("topbarSearch");
  if (topbarSearch) {
    topbarSearch.addEventListener("input", e => {
      state.searchQuery = e.target.value;
      if (searchInput) searchInput.value = e.target.value;
      applyFilters();
      renderTable();
      renderLeadCards();
    });
  }

  // Export CSV button
  const exportBtn = document.getElementById("exportCsvBtn");
  if (exportBtn) exportBtn.addEventListener("click", window.exportCSV);

  // City spotlight tabs
  document.querySelectorAll(".spotlight-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".spotlight-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filterCity = btn.dataset.city || "";
      applyFilters();
      renderTable();
      renderLeadCards();
    });
  });
  // Activate "All Cities" by default
  const allCitiesTab = document.querySelector('.spotlight-tab[data-city=""]');
  if (allCitiesTab) allCitiesTab.classList.add("active");

  // Tab navigation (desktop tab bar + nav items + bottom nav)
  function activateTab(tabName) {
    // Tab content panels
    document.querySelectorAll(".tab-content").forEach(p => p.classList.remove("active"));
    const panel = document.getElementById(`tab-${tabName}`);
    if (panel) panel.classList.add("active");

    // Desktop tab buttons
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tabName);
      b.setAttribute("aria-selected", b.dataset.tab === tabName ? "true" : "false");
    });

    // Sidebar nav items
    document.querySelectorAll(".nav-item[data-tab]").forEach(n => {
      n.classList.toggle("active", n.dataset.tab === tabName);
    });

    // Bottom nav items
    document.querySelectorAll(".bottom-nav-item[data-tab]").forEach(n => {
      n.classList.toggle("active", n.dataset.tab === tabName);
    });

    state.activeTab = tabName;

    if (tabName === "overview") buildCharts();
  }

  document.querySelectorAll("[data-tab]").forEach(btn => {
    if (btn.classList.contains("tab-btn") ||
        btn.classList.contains("nav-item") ||
        btn.classList.contains("bottom-nav-item")) {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    }
  });

  // Sidebar overlay / mobile toggle
  const menuBtn         = document.getElementById("menuBtn");
  const sidebar         = document.getElementById("sidebar");
  const sidebarOverlay  = document.getElementById("sidebarOverlay");

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add("open");
    if (sidebarOverlay) sidebarOverlay.classList.add("visible");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove("open");
    if (sidebarOverlay) sidebarOverlay.classList.remove("visible");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      if (sidebar && sidebar.classList.contains("open")) closeSidebar();
      else openSidebar();
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
  }

  // Close sidebar when nav item clicked on mobile
  document.querySelectorAll(".nav-item[data-tab]").forEach(item => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 900) closeSidebar();
    });
  });

  // Modal close events
  const modalOverlay = document.getElementById("leadModal");
  const modalClose   = document.getElementById("modalClose");

  if (modalClose) modalClose.addEventListener("click", window.closeLeadModal);
  if (modalOverlay) {
    modalOverlay.addEventListener("click", e => {
      if (e.target === modalOverlay) window.closeLeadModal();
    });
    // Escape key
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modalOverlay.classList.contains("open")) {
        window.closeLeadModal();
      }
    });
  }

  // Terminal input
  const termInput = document.getElementById("terminalInput");
  if (termInput) {
    termInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        runCommand(termInput.value);
        termInput.value = "";
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (state.termHistoryIdx < state.termHistory.length - 1) {
          state.termHistoryIdx++;
          termInput.value = state.termHistory[state.termHistoryIdx];
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (state.termHistoryIdx > 0) {
          state.termHistoryIdx--;
          termInput.value = state.termHistory[state.termHistoryIdx];
        } else {
          state.termHistoryIdx = -1;
          termInput.value = "";
        }
      }
    });
  }

  // Manual refresh button in banner
  const refreshBtn = document.getElementById("dataBannerRefresh");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      stopAutoRefresh();
      loadLiveLeads(false);
    });
  }

  // Keyboard shortcut ⌘K / Ctrl+K → focus search
  document.addEventListener("keydown", e => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      const s = document.getElementById("topbarSearch");
      if (s) s.focus();
    }
  });

  // Re-render charts on theme toggle (theme-btn is in index.html inline script)
  // Poll for theme changes
  let lastTheme = document.documentElement.getAttribute("data-theme");
  setInterval(() => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    if (currentTheme !== lastTheme) {
      lastTheme = currentTheme;
      if (state.activeTab === "overview") buildCharts();
    }
  }, 500);
}

/* ═══════════════════════════════════════════════════════════
   GLOBAL HELPERS (window scope for inline HTML usage)
   ═══════════════════════════════════════════════════════════ */
window.sortBy        = window.sortBy;
window.changePage    = window.changePage;
window.openLeadModal = window.openLeadModal;
window.closeLeadModal= window.closeLeadModal;
window.exportCSV     = window.exportCSV;
window.termClear     = window.termClear;

window.switchTab = function (tabName) {
  const btn = document.querySelector('.tab-btn[data-tab="' + tabName + '"]');
  if (btn) btn.click();
};

/* ═══════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize with normalized sample data while live data loads
  state.leads = normalizeLeads(SAMPLE_LEADS);
  state.filtered = [...state.leads];

  applyFilters();
  renderStats();
  renderTable();
  renderLeadCards();
  buildCharts();
  bindEvents();
  startClock();

  // Show initializing banner state
  updateDataBanner(false, null);

  // Attempt to load live scored_leads.json
  loadLiveLeads(false);
});
