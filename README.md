# XPS Lead Intelligence Platform

> **Autonomous B2B lead generation for the flooring and construction industry.**  
> Discover · Validate · Enrich · Score · Outreach · Dashboard — fully automated.

[![Docs Reflection](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions/workflows/docs_reflection.yml/badge.svg)](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions/workflows/docs_reflection.yml)
[![System Validation](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions/workflows/system_validation.yml/badge.svg)](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions/workflows/system_validation.yml)

---

## What Is This?

The **XPS Lead Intelligence Platform** is an open-source, autonomous lead generation system built specifically for flooring and construction contractors. It:

- 🔍 **Discovers** contractors from Google Maps, Bing Maps, Yelp, and directories
- ✅ **Validates** and deduplicates contact data
- 📊 **Enriches** records with emails, LinkedIn profiles, and additional contacts
- 🏆 **Scores** leads 0–100 using a proprietary quality model
- 📧 **Automates outreach** with personalized email sequences
- 📱 **Displays** leads in a real-time PWA dashboard
- 🤖 **Operates autonomously** via GitHub Actions — no human required

**Phase 6 is complete.** The dashboard, scoring engine, and outreach automation are fully operational.

---

## Quickstart

### Prerequisites

- Node.js 18+
- PostgreSQL (optional; SQLite fallback available)
- Git

### 1. Clone and Install

```bash
git clone https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE.git
cd LEAD_GEN_INTELLIGENCE
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database and SMTP credentials
```

### 3. Run Lead Scoring

```bash
npm run score
# Outputs: data/leads/scored_leads.json, data/leads/scoring_report.json
```

### 4. Start the Dashboard

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### 5. Update Living Docs

```bash
node tools/docs/evolve_docs.js
# Updates docs/REPO_MAP.md, docs/TODO.md, docs/STATUS.md, docs/SELF_REVIEW.md
```

---

## Operations

### Scheduled Pipeline

The lead pipeline runs automatically via GitHub Actions:

| Workflow | Schedule | Purpose |
|---|---|---|
| Lead Scraper | Configurable | Scrape + validate + score leads |
| National Discovery | Daily | Nationwide contractor discovery |
| System Validation | Push / PR | Health checks |
| **Docs Reflection** | **Daily + Push** | **Update living docs, self-review, create issues** |

**Trigger manually:**
1. Go to [Actions tab](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions)
2. Select the workflow
3. Click **Run workflow**

### Required GitHub Secrets

| Secret | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SMTP_HOST` | Email server (outreach) |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password |

`GITHUB_TOKEN` is auto-provided by GitHub Actions.

---

## Documentation

| Document | Description |
|---|---|
| [docs/VISION.md](docs/VISION.md) | Product vision, mission, and principles |
| [docs/BLUEPRINT.md](docs/BLUEPRINT.md) | System blueprint: components and data flow |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture and deployment |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Development phases and milestones |
| [docs/SOP.md](docs/SOP.md) | Standard operating procedures |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Runbooks and incident response |
| [docs/SECURITY.md](docs/SECURITY.md) | Security policy and threat model |
| [docs/DATA_GOVERNANCE.md](docs/DATA_GOVERNANCE.md) | Data sources, compliance, retention |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Key terms and definitions |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Architecture decision log (ADR-lite) |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Release history |

### Auto-Generated Living Docs

These are updated automatically by `tools/docs/evolve_docs.js` and the `docs_reflection` workflow:

| Document | Description |
|---|---|
| [docs/REPO_MAP.md](docs/REPO_MAP.md) | Repository file tree + key entrypoints |
| [docs/TODO.md](docs/TODO.md) | Open TODO items from codebase |
| [docs/TODO.json](docs/TODO.json) | Machine-readable TODO data |
| [docs/STATUS.md](docs/STATUS.md) | Current pipeline status |
| [docs/SELF_REVIEW.md](docs/SELF_REVIEW.md) | Automated repo review + recommendations |
| [docs/todo.html](docs/todo.html) | Interactive TODO web dashboard |

### Investor Materials

| Document | Description |
|---|---|
| [docs/INVESTOR_OVERVIEW.md](docs/INVESTOR_OVERVIEW.md) | One-pager: problem, solution, market |
| [docs/INVESTOR_DECK_OUTLINE.md](docs/INVESTOR_DECK_OUTLINE.md) | Slide-by-slide pitch deck outline |

---

## Architecture

```
Orchestrator → Task Queue → Scrapers → Raw Data → Validation
    → Enrichment → Lead Scoring → Outreach → Dashboard + API
```

**Tech Stack:**
- **Backend:** Node.js, Crawlee, Playwright, Express, PostgreSQL, Redis
- **Dashboard:** Next.js 16, Tailwind CSS, TypeScript, PWA
- **CI/CD:** GitHub Actions, GitHub Pages
- **AI:** OpenAI (optional enrichment)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

---

## Project Structure

```
LEAD_GEN_INTELLIGENCE/
├── agents/          — Pipeline agents (orchestrator, scoring, email, etc.)
├── scrapers/        — Web scrapers (Google Maps, Bing, etc.)
├── outreach/        — Email outreach automation
├── db/              — PostgreSQL database layer
├── dashboard/       — Next.js PWA dashboard
├── pages/           — Static HTML dashboard (GitHub Pages)
├── data/            — Pipeline outputs (leads, outreach logs)
├── docs/            — Documentation suite
├── tools/docs/      — evolve_docs.js + create_issues.js
├── tests/           — Unit tests
└── .github/         — GitHub Actions workflows
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes following the code style
4. Run tests: `npm test`
5. Open a Pull Request

See [docs/SOP.md](docs/SOP.md) for development procedures.

---

## License

ISC License — see [LICENSE](LICENSE) for details.

---

## Links

- **Dashboard (Live):** [https://infinityxonesystems.github.io/LEAD_GEN_INTELLIGENCE/](https://infinityxonesystems.github.io/LEAD_GEN_INTELLIGENCE/)
- **GitHub:** [https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE)
- **Issues:** [https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/issues](https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/issues)