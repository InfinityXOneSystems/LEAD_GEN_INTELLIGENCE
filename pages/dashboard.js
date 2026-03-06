/**
 * XPS Lead Intelligence Dashboard – dashboard.js
 * Handles data loading, table rendering, charts, filtering, and the command terminal.
 */

/* ─── Sample / seed data ─────────────────────────────────── */
// Representative sample leads pre-loaded for demonstration.
// When a live backend or CSV data becomes available this list is
// replaced by the parseCSV() loader below.
const SAMPLE_LEADS = [
  {
    id: 1,
    company: "ProEpoxy Solutions",
    contact: "Mark Rivera",
    phone: "(614) 555-0101",
    email: "mark@proepoxy.com",
    website: "proepoxy.com",
    city: "Columbus",
    state: "OH",
    industry: "Epoxy",
    services: "Garage Epoxy, Commercial",
    rating: 4.8,
    reviews: 142,
    score: 88,
    status: "qualified",
    date: "2025-03-01",
  },
  {
    id: 2,
    company: "Concrete Masters LLC",
    contact: "Sarah Kim",
    phone: "(480) 555-0192",
    email: "sarah@concretemasters.com",
    website: "concretemasters.com",
    city: "Tempe",
    state: "AZ",
    industry: "Concrete",
    services: "Polishing, Sealing",
    rating: 4.5,
    reviews: 98,
    score: 76,
    status: "contacted",
    date: "2025-03-01",
  },
  {
    id: 3,
    company: "GlossFloor Chicago",
    contact: "David Park",
    phone: "(312) 555-0345",
    email: "",
    website: "",
    city: "West Chicago",
    state: "IL",
    industry: "Epoxy",
    services: "Metallic Epoxy, Industrial",
    rating: 4.2,
    reviews: 55,
    score: 52,
    status: "new",
    date: "2025-03-02",
  },
  {
    id: 4,
    company: "OKC Floor Systems",
    contact: "Lisa Moore",
    phone: "(405) 555-0567",
    email: "lisa@okcfloor.com",
    website: "okcfloor.com",
    city: "Oklahoma City",
    state: "OK",
    industry: "Concrete",
    services: "Repair, Resurfacing",
    rating: 4.6,
    reviews: 77,
    score: 71,
    status: "contacted",
    date: "2025-03-02",
  },
  {
    id: 5,
    company: "SurfacePro FL",
    contact: "James White",
    phone: "(954) 555-0789",
    email: "james@surfacepro.com",
    website: "surfacepro.com",
    city: "Pompano Beach",
    state: "FL",
    industry: "SurfacePrep",
    services: "Shot Blasting, Grinding",
    rating: 4.9,
    reviews: 213,
    score: 94,
    status: "converted",
    date: "2025-02-28",
  },
  {
    id: 6,
    company: "Midwest Resin Works",
    contact: "Tom Hansen",
    phone: "",
    email: "",
    website: "",
    city: "Columbus",
    state: "OH",
    industry: "Epoxy",
    services: "Decorative Epoxy",
    rating: 3.8,
    reviews: 22,
    score: 31,
    status: "new",
    date: "2025-03-03",
  },
  {
    id: 7,
    company: "Arizona Polished Concrete",
    contact: "Elena Cruz",
    phone: "(602) 555-0234",
    email: "elena@azpolished.com",
    website: "azpolished.com",
    city: "Tempe",
    state: "AZ",
    industry: "Concrete",
    services: "Staining, Polishing",
    rating: 4.7,
    reviews: 89,
    score: 82,
    status: "qualified",
    date: "2025-03-03",
  },
  {
    id: 8,
    company: "FlakeFloor Inc.",
    contact: "Ryan Scott",
    phone: "(614) 555-0891",
    email: "ryan@flakefloor.com",
    website: "flakefloor.com",
    city: "Columbus",
    state: "OH",
    industry: "Epoxy",
    services: "Flake Epoxy, Polyaspartic",
    rating: 4.4,
    reviews: 67,
    score: 73,
    status: "new",
    date: "2025-03-04",
  },
  {
    id: 9,
    company: "IL Concrete Co.",
    contact: "Nancy Bell",
    phone: "(630) 555-0123",
    email: "nancy@ilconcrete.com",
    website: "ilconcrete.com",
    city: "West Chicago",
    state: "IL",
    industry: "Concrete",
    services: "Sealing, Resurfacing",
    rating: 4.3,
    reviews: 44,
    score: 65,
    status: "contacted",
    date: "2025-03-04",
  },
  {
    id: 10,
    company: "ToughCoat Flooring",
    contact: "Chris Adams",
    phone: "(954) 555-0456",
    email: "chris@toughcoat.com",
    website: "toughcoat.com",
    city: "Pompano Beach",
    state: "FL",
    industry: "Epoxy",
    services: "Polyurea, Commercial",
    rating: 4.6,
    reviews: 101,
    score: 80,
    status: "qualified",
    date: "2025-03-04",
  },
  {
    id: 11,
    company: "Grind & Shine LLC",
    contact: "Amy Foster",
    phone: "(405) 555-0678",
    email: "amy@grindshine.com",
    website: "grindshine.com",
    city: "Oklahoma City",
    state: "OK",
    industry: "SurfacePrep",
    services: "Diamond Grinding",
    rating: 4.1,
    reviews: 30,
    score: 58,
    status: "new",
    date: "2025-03-05",
  },
  {
    id: 12,
    company: "LevelUp Concrete",
    contact: "Kevin Turner",
    phone: "(312) 555-0567",
    email: "",
    website: "",
    city: "West Chicago",
    state: "IL",
    industry: "Concrete",
    services: "Decorative, Stamping",
    rating: 3.9,
    reviews: 18,
    score: 28,
    status: "new",
    date: "2025-03-05",
  },
  {
    id: 13,
    company: "ResinPros AZ",
    contact: "Olivia Lane",
    phone: "(480) 555-0345",
    email: "olivia@resinpros.com",
    website: "resinpros.com",
    city: "Tempe",
    state: "AZ",
    industry: "Epoxy",
    services: "Metallic Epoxy, Residential",
    rating: 4.8,
    reviews: 156,
    score: 91,
    status: "converted",
    date: "2025-02-27",
  },
  {
    id: 14,
    company: "BlastMasters Corp",
    contact: "Derek Hughes",
    phone: "(877) 555-0001",
    email: "derek@blastmasters.com",
    website: "blastmasters.com",
    city: "Pompano Beach",
    state: "FL",
    industry: "SurfacePrep",
    services: "Shot Blasting, Industrial",
    rating: 4.5,
    reviews: 72,
    score: 74,
    status: "qualified",
    date: "2025-03-01",
  },
  {
    id: 15,
    company: "TopCoat OH",
    contact: "Samantha Vega",
    phone: "(614) 555-0999",
    email: "sam@topcoatoh.com",
    website: "topcoatoh.com",
    city: "Columbus",
    state: "OH",
    industry: "Epoxy",
    services: "Garage, Decorative Epoxy",
    rating: 4.7,
    reviews: 188,
    score: 87,
    status: "qualified",
    date: "2025-03-02",
  },
];

const COMMANDS_HELP = [
  { cmd: "help", desc: "Show available commands" },
  { cmd: "leads list", desc: "List all leads" },
  {
    cmd: "leads status <s>",
    desc: "Filter by status (new|contacted|qualified|converted)",
  },
  { cmd: "leads top <n>", desc: "Show top N leads by score" },
  { cmd: "stats", desc: "Show lead statistics summary" },
  { cmd: "score <company>", desc: "Show score breakdown for a company" },
  { cmd: "clear", desc: "Clear terminal output" },
];

/* ─── State ──────────────────────────────────────────────── */
const state = {
  leads: [...SAMPLE_LEADS],
  filtered: [...SAMPLE_LEADS],
  sortCol: "score",
  sortDir: "desc",
  filterStatus: "all",
  filterIndustry: "all",
  filterState: "all",
  searchQuery: "",
  page: 1,
  pageSize: 10,
  activeTab: "overview",
  charts: {},
  termHistory: [],
  termHistoryIdx: -1,
};

/* ─── Utilities ──────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#3b82f6";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function statusBadge(status) {
  const map = {
    new: ["badge-new", "🔵", "New"],
    contacted: ["badge-contacted", "🟡", "Contacted"],
    qualified: ["badge-qualified", "🟢", "Qualified"],
    converted: ["badge-converted", "🟣", "Converted"],
    pending: ["badge-pending", "⚪", "Pending"],
  };
  const [cls, dot, label] = map[status] || map.pending;
  return `<span class="badge ${cls}">${dot} ${label}</span>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

/* ─── CSV parsing (for future live data) ─────────────────── */
function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line, i) => {
    const vals = line.split(",");
    const obj = { id: i + 1 };
    headers.forEach((h, idx) => {
      obj[h.toLowerCase().replace(/ /g, "_")] = (vals[idx] || "").trim();
    });
    return obj;
  });
}

/* ─── KPI computation ────────────────────────────────────── */
function computeStats(leads) {
  const total = leads.length;
  const withEmail = leads.filter((l) => l.email).length;
  const withPhone = leads.filter((l) => l.phone).length;
  const hot = leads.filter((l) => l.score >= 75).length;
  const warm = leads.filter((l) => l.score >= 50 && l.score < 75).length;
  const cold = leads.filter((l) => l.score < 50).length;
  const highScore = total ? Math.max(...leads.map((l) => l.score)) : 0;
  const converted = leads.filter((l) => l.status === "converted").length;
  const avgScore = total
    ? Math.round(leads.reduce((a, l) => a + l.score, 0) / total)
    : 0;
  return { total, withEmail, withPhone, hot, warm, cold, highScore, converted, avgScore };
}

/* ─── Filtering & sorting ────────────────────────────────── */
function applyFilters() {
  let leads = [...state.leads];

  if (state.filterStatus !== "all") {
    leads = leads.filter((l) => l.status === state.filterStatus);
  }
  if (state.filterIndustry !== "all") {
    leads = leads.filter((l) => l.industry === state.filterIndustry);
  }
  if (state.filterState !== "all") {
    leads = leads.filter((l) => l.state === state.filterState);
  }
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.company.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.contact.toLowerCase().includes(q) ||
        l.industry.toLowerCase().includes(q),
    );
  }

  leads.sort((a, b) => {
    let av = a[state.sortCol],
      bv = b[state.sortCol];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return state.sortDir === "asc" ? -1 : 1;
    if (av > bv) return state.sortDir === "asc" ? 1 : -1;
    return 0;
  });

  state.filtered = leads;
  state.page = 1;
}

/* ─── Table rendering ────────────────────────────────────── */
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
    tbody.innerHTML = pageLeads
      .map(
        (lead) => `
      <tr data-id="${lead.id}">
        <td>
          <div class="company-name">${escapeHtml(lead.company)}</div>
          <div class="company-sub">${escapeHtml(lead.contact || "—")}</div>
        </td>
        <td>
          <div>${escapeHtml(lead.city)}, ${escapeHtml(lead.state)}</div>
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
        <td class="text-muted fs-12">${lead.phone ? escapeHtml(lead.phone) : '<span style="opacity:.4">—</span>'}</td>
        <td class="text-muted fs-12">${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}" style="color:var(--text-accent);text-decoration:none">${escapeHtml(lead.email)}</a>` : '<span style="opacity:.4">—</span>'}</td>
        <td class="text-muted fs-12">${timeAgo(lead.date)}</td>
      </tr>
    `,
      )
      .join("");
  }

  // Pagination
  renderPagination();

  // Update filter count
  const countEl = document.getElementById("filterCount");
  if (countEl) countEl.textContent = `${state.filtered.length} leads`;
}

function renderPagination() {
  const totalPages = Math.max(
    1,
    Math.ceil(state.filtered.length / state.pageSize),
  );
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
    if (
      totalPages <= 7 ||
      p === 1 ||
      p === totalPages ||
      Math.abs(p - state.page) <= 1
    ) {
      btns += `<button class="page-btn ${p === state.page ? "active" : ""}" onclick="changePage(${p})">${p}</button>`;
    } else if (Math.abs(p - state.page) === 2) {
      btns += `<span style="color:var(--text-muted);padding:0 4px;font-size:12px">…</span>`;
    }
  }
  btns += `<button class="page-btn" ${state.page >= totalPages ? "disabled" : ""} onclick="changePage(${state.page + 1})">›</button>`;
  paginationBtns.innerHTML = btns;
}

window.changePage = function (p) {
  state.page = p;
  renderTable();
};

/* ─── Sort column ────────────────────────────────────────── */
window.sortBy = function (col) {
  if (state.sortCol === col) {
    state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
  } else {
    state.sortCol = col;
    state.sortDir = col === "score" ? "desc" : "asc";
  }
  // Update header classes
  document.querySelectorAll(".leads-table th").forEach((th) => {
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
};

/* ─── KPI cards ──────────────────────────────────────────── */
function renderStats() {
  const s = computeStats(state.leads);
  const el = (id) => document.getElementById(id);
  if (el("stat-total")) el("stat-total").textContent = s.total;
  if (el("stat-hot")) el("stat-hot").textContent = s.hot;
  if (el("stat-warm")) el("stat-warm").textContent = s.warm;
  if (el("stat-cold")) el("stat-cold").textContent = s.cold;
  if (el("stat-highscore")) el("stat-highscore").textContent = s.highScore;
  if (el("stat-converted")) el("stat-converted").textContent = s.converted;
  if (el("stat-avgscore")) el("stat-avgscore").textContent = s.avgScore;

  // Tier counts in analytics tab
  if (el("tier-hot-count")) el("tier-hot-count").textContent = s.hot;
  if (el("tier-warm-count")) el("tier-warm-count").textContent = s.warm;
  if (el("tier-cold-count")) el("tier-cold-count").textContent = s.cold;

  // Pipeline analytics bars
  const statusCounts = {
    new: state.leads.filter((l) => l.status === "new").length,
    contacted: state.leads.filter((l) => l.status === "contacted").length,
    qualified: state.leads.filter((l) => l.status === "qualified").length,
    converted: s.converted,
  };
  const maxCount = Math.max(1, ...Object.values(statusCounts));
  for (const [status, count] of Object.entries(statusCounts)) {
    const barEl = el("pipeline-" + status);
    const countEl = el("pipeline-" + status + "-count");
    if (barEl) barEl.style.width = Math.round((count / maxCount) * 100) + "%";
    if (countEl) countEl.textContent = count;
  }

  // Top leads preview on overview tab
  renderTopLeadsPreview();

  // Cities analytics
  renderCitiesAnalytics();
}

function renderTopLeadsPreview() {
  const container = document.getElementById("topLeadsPreview");
  if (!container) return;
  const hotLeads = state.leads.filter((l) => l.score >= 75).slice(0, 5);
  if (!hotLeads.length) {
    container.innerHTML = '<p class="empty-hint">No HOT leads yet. Run the scraper to discover new leads.</p>';
    return;
  }
  container.innerHTML = hotLeads.map((l) => `
    <div class="top-lead-row">
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
  state.leads.forEach((l) => {
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
      <span class="city-name">${escapeHtml(city)}</span>
      <div class="city-bar-wrap"><div class="city-bar" style="width:${Math.round((count/max)*100)}%"></div></div>
      <span class="city-count">${count}</span>
    </div>
  `).join("");
}

/* ─── Charts ─────────────────────────────────────────────── */
function buildCharts() {
  if (typeof Chart === "undefined") return;

  Chart.defaults.color = "#94a3b8";
  Chart.defaults.borderColor = "rgba(255,255,255,0.06)";
  Chart.defaults.font.family = "'Inter','Segoe UI',system-ui,sans-serif";
  Chart.defaults.font.size = 12;

  // Industry breakdown – doughnut
  const industryCounts = {};
  state.leads.forEach((l) => {
    industryCounts[l.industry] = (industryCounts[l.industry] || 0) + 1;
  });
  const industryCtx = document.getElementById("industryChart");
  if (industryCtx) {
    if (state.charts.industry) state.charts.industry.destroy();
    state.charts.industry = new Chart(industryCtx, {
      type: "doughnut",
      data: {
        labels: Object.keys(industryCounts),
        datasets: [
          {
            data: Object.values(industryCounts),
            backgroundColor: [
              "#3b82f6",
              "#10b981",
              "#f59e0b",
              "#8b5cf6",
              "#ef4444",
            ],
            borderWidth: 2,
            borderColor: "#1e293b",
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: { position: "bottom", labels: { padding: 14, boxWidth: 12 } },
          tooltip: {
            callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` },
          },
        },
      },
    });
  }

  // Status breakdown – horizontal bar
  const statusCounts = { new: 0, contacted: 0, qualified: 0, converted: 0 };
  state.leads.forEach((l) => {
    if (statusCounts[l.status] !== undefined) statusCounts[l.status]++;
  });
  const statusCtx = document.getElementById("statusChart");
  if (statusCtx) {
    if (state.charts.status) state.charts.status.destroy();
    state.charts.status = new Chart(statusCtx, {
      type: "bar",
      data: {
        labels: ["New", "Contacted", "Qualified", "Converted"],
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: [
              "rgba(59,130,246,0.7)",
              "rgba(245,158,11,0.7)",
              "rgba(16,185,129,0.7)",
              "rgba(139,92,246,0.7)",
            ],
            borderColor: [
              "rgb(59,130,246)",
              "rgb(245,158,11)",
              "rgb(16,185,129)",
              "rgb(139,92,246)",
            ],
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { precision: 0 },
          },
          y: { grid: { display: false } },
        },
      },
    });
  }

  // Score distribution – histogram
  const buckets = ["0–20", "21–40", "41–60", "61–80", "81–100"];
  const bucketCounts = [0, 0, 0, 0, 0];
  state.leads.forEach((l) => {
    const b = Math.min(4, Math.floor(l.score / 20));
    bucketCounts[b]++;
  });
  const scoreDistCtx = document.getElementById("scoreDistChart");
  if (scoreDistCtx) {
    if (state.charts.scoreDist) state.charts.scoreDist.destroy();
    state.charts.scoreDist = new Chart(scoreDistCtx, {
      type: "bar",
      data: {
        labels: buckets,
        datasets: [
          {
            label: "Leads",
            data: bucketCounts,
            backgroundColor: [
              "rgba(239,68,68,0.7)",
              "rgba(245,158,11,0.7)",
              "rgba(59,130,246,0.7)",
              "rgba(16,185,129,0.7)",
              "rgba(16,185,129,0.9)",
            ],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: "rgba(255,255,255,0.05)" },
            ticks: { precision: 0 },
          },
        },
      },
    });
  }
}

/* ─── Command terminal ───────────────────────────────────── */
function termPrint(text, cls = "output") {
  const body = document.getElementById("terminalBody");
  if (!body) return;
  const line = document.createElement("div");
  line.className = `terminal-line ${cls}`;
  line.textContent = text;
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

function termClear() {
  const body = document.getElementById("terminalBody");
  if (body) body.innerHTML = "";
}

function runCommand(cmd) {
  const trimmed = cmd.trim();
  if (!trimmed) return;
  state.termHistory.unshift(trimmed);
  state.termHistoryIdx = -1;

  termPrint(`xps> ${trimmed}`, "prompt");

  const parts = trimmed.toLowerCase().split(/\s+/);

  if (parts[0] === "help") {
    termPrint("Available commands:", "info");
    COMMANDS_HELP.forEach((c) =>
      termPrint(`  ${c.cmd.padEnd(22)} ${c.desc}`, "output"),
    );
  } else if (parts[0] === "clear") {
    termClear();
  } else if (parts[0] === "stats") {
    const s = computeStats(state.leads);
    termPrint(`Total leads    : ${s.total}`, "output");
    termPrint(`High-score (≥70): ${s.highScore}`, "output");
    termPrint(`Avg score      : ${s.avgScore}`, "output");
    termPrint(`Converted      : ${s.converted}`, "success");
    termPrint(`With email     : ${s.withEmail}`, "output");
    termPrint(`With phone     : ${s.withPhone}`, "output");
  } else if (parts[0] === "leads" && parts[1] === "list") {
    state.leads
      .slice(0, 10)
      .forEach((l) =>
        termPrint(
          `  [${String(l.score).padStart(3)}] ${l.company.padEnd(30)} ${l.city}, ${l.state}  (${l.status})`,
        ),
      );
    if (state.leads.length > 10)
      termPrint(`  … and ${state.leads.length - 10} more`, "comment");
  } else if (parts[0] === "leads" && parts[1] === "status") {
    const s = parts[2];
    const filtered = s
      ? state.leads.filter((l) => l.status === s)
      : state.leads;
    if (!s) {
      termPrint(
        "Usage: leads status <new|contacted|qualified|converted>",
        "warning",
      );
      return;
    }
    if (filtered.length === 0) {
      termPrint(`No leads with status "${s}"`, "warning");
      return;
    }
    termPrint(`Leads with status "${s}" (${filtered.length}):`, "info");
    filtered.forEach((l) =>
      termPrint(
        `  [${String(l.score).padStart(3)}] ${l.company}  — ${l.city}, ${l.state}`,
      ),
    );
  } else if (parts[0] === "leads" && parts[1] === "top") {
    const n = parseInt(parts[2]) || 5;
    const top = [...state.leads].sort((a, b) => b.score - a.score).slice(0, n);
    termPrint(`Top ${n} leads by score:`, "info");
    top.forEach((l, i) =>
      termPrint(
        `  ${String(i + 1).padStart(2)}. [${l.score}] ${l.company.padEnd(30)} ${l.city}, ${l.state}`,
      ),
    );
  } else if (parts[0] === "score") {
    const query = parts.slice(1).join(" ");
    const lead = state.leads.find((l) =>
      l.company.toLowerCase().includes(query),
    );
    if (!lead) {
      termPrint(`Lead not found: "${query}"`, "warning");
      return;
    }
    termPrint(`Score breakdown for "${lead.company}":`, "info");
    termPrint(`  Website present  : ${lead.website ? "+10" : "  0"}`, "output");
    termPrint(`  Email present    : ${lead.email ? "+15" : "  0"}`, "output");
    termPrint(`  Phone present    : ${lead.phone ? "+10" : "  0"}`, "output");
    termPrint(
      `  Reviews > 10     : ${lead.reviews > 10 ? " +5" : "  0"}`,
      "output",
    );
    termPrint(
      `  Rating > 4       : ${lead.rating > 4 ? "+10" : "  0"}`,
      "output",
    );
    termPrint(`  ─────────────────────────────────`, "comment");
    termPrint(`  Total score      : ${lead.score}`, "success");
  } else {
    termPrint(
      `Unknown command: "${trimmed}". Type "help" for available commands.`,
      "warning",
    );
  }
}

/* ─── Event binding ──────────────────────────────────────── */
function bindEvents() {
  // Table sorting
  document.querySelectorAll(".leads-table th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => sortBy(th.dataset.sort));
  });

  // Filters
  const filterStatus = document.getElementById("filterStatus");
  const filterIndustry = document.getElementById("filterIndustry");
  const filterState = document.getElementById("filterStateEl");
  const searchInput = document.getElementById("searchInput");

  if (filterStatus)
    filterStatus.addEventListener("change", (e) => {
      state.filterStatus = e.target.value;
      applyFilters();
      renderTable();
    });
  if (filterIndustry)
    filterIndustry.addEventListener("change", (e) => {
      state.filterIndustry = e.target.value;
      applyFilters();
      renderTable();
    });
  if (filterState)
    filterState.addEventListener("change", (e) => {
      state.filterState = e.target.value;
      applyFilters();
      renderTable();
    });
  if (searchInput)
    searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      applyFilters();
      renderTable();
    });

  // Top-bar search (mirrors the leads tab search)
  const topbarSearch = document.getElementById("topbarSearch");
  if (topbarSearch)
    topbarSearch.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      if (searchInput) searchInput.value = e.target.value;
      applyFilters();
      renderTable();
    });

  // Tab navigation
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      document
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const panel = document.getElementById(`tab-${tab}`);
      if (panel) panel.classList.add("active");
      state.activeTab = tab;
      if (tab === "overview") buildCharts();
    });
  });

  // Sidebar nav items
  document.querySelectorAll(".nav-item[data-tab]").forEach((item) => {
    item.addEventListener("click", () => {
      document
        .querySelectorAll(".nav-item")
        .forEach((n) => n.classList.remove("active"));
      item.classList.add("active");
      const tab = item.dataset.tab;
      // Switch to the correct tab-btn
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
      if (tabBtn) tabBtn.click();
    });
  });

  // Command terminal input
  const termInput = document.getElementById("terminalInput");
  if (termInput) {
    termInput.addEventListener("keydown", (e) => {
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

  // Mobile sidebar toggle
  const menuBtn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");
  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));
    document.addEventListener("click", (e) => {
      if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("open");
      }
    });
  }
}

/* ─── Initial terminal boot sequence ─────────────────────── */
function bootTerminal() {
  const lines = [
    ["# XPS Lead Intelligence System v1.0", "comment"],
    ["# Phase 7 — Autonomous Orchestration Active", "comment"],
    ["", "output"],
    ["Initializing lead database…", "info"],
    [`Loaded ${state.leads.length} leads`, "success"],
    ["", "output"],
    ['Type "help" to see available commands.', "output"],
  ];
  let delay = 0;
  lines.forEach(([text, cls]) => {
    setTimeout(() => termPrint(text, cls), delay);
    delay += 120;
  });
}

/* ─── Live clock ─────────────────────────────────────────── */
function startClock() {
  const el = document.getElementById("liveClock");
  if (!el) return;
  const update = () => {
    el.textContent = new Date().toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  update();
  setInterval(update, 1000);
}

/* ─── Live data loader ────────────────────────────────────── */
/**
 * Tries to fetch scored_leads.json from multiple paths in priority order.
 * Falls back to SAMPLE_LEADS if all fetches fail (works offline / demo mode).
 */
function renderDashboard() {
  applyFilters();
  renderStats();
  renderTable();
  buildCharts();
}

function loadLiveLeads() {
  const PATHS = [
    "./data/scored_leads.json",          // pages/data/ (after pipeline runs)
    "../data/leads/scored_leads.json",   // dev: root data/leads/
  ];

  function tryNext(index) {
    if (index >= PATHS.length) {
      // All paths failed — stay with SAMPLE_LEADS
      console.info("[dashboard] No live data found. Using sample leads.");
      renderDashboard();
      return;
    }
    fetch(PATHS[index])
      .then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          state.leads = data;
          state.filtered = [...data];
          console.info(`[dashboard] Loaded ${data.length} live leads from ${PATHS[index]}`);
          renderDashboard();
        } else {
          tryNext(index + 1);
        }
      })
      .catch(() => tryNext(index + 1));
  }

  tryNext(0);
}

/* ─── Boot ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  // Initial render with sample data while live data loads
  applyFilters();
  renderStats();
  renderTable();
  buildCharts();
  bindEvents();
  bootTerminal();
  startClock();
  // Attempt to load live scored leads asynchronously
  loadLiveLeads();
});
