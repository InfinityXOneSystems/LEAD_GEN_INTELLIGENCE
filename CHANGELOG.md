# CHANGELOG

All notable changes to XPS Intelligence System are documented here.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — 2026-03-10

### Fixed — Workflow & Dependency Audit (`system_validation.yml`)

**Root cause of CI failure (job 66400415060):**  
`pytest` was not installed before the `Run pytest` step.  
`requirements.txt` did not include `pytest`, and the workflow did not install it
separately. The runner exited with code 127 (`pytest: command not found`).

#### Changes made

| File | Change | Reason |
|------|--------|--------|
| `requirements.txt` | Added `pytest>=8.0.0` and `pytest-asyncio>=0.23.0` | Ensure test tooling is installed with all other deps via `pip install -r requirements.txt` |
| `.github/workflows/system_validation.yml` | Full rewrite (see details below) | Multiple structural issues, missing dependencies, no governance annotations |

#### `system_validation.yml` — detailed diff summary

| Issue | Before | After |
|-------|--------|-------|
| `pytest` not installed | `pip install -r requirements.txt` only | `pip install -r requirements.txt` **+** explicit `pip install pytest pytest-asyncio` as defensive fallback |
| No `push` trigger | Only `on: pull_request` | `on: push` (main, develop, copilot/**) + `on: pull_request` |
| Missing step names | `- run: pip install …` (unnamed) | All steps have descriptive `name:` fields |
| No pip cache | `actions/setup-python@v4` without `cache: pip` | `actions/setup-python@v5` with `cache: "pip"` for repeatability |
| Node.js tests not covered | No Node.js job | Added `validate-node` job: sets up Node 20, runs `npm install && npm test` |
| Repo Guardian was a single echo | `echo "Validating architecture"` | Full shell validation loop: checks required + optional paths, emits structured `[OK]`/`[WARN]`/`[ERROR]` output, fails on critical missing files |
| Job fan-out missing | Single `validate` job | Three jobs: `validate-python`, `validate-node`, `repo-guardian` (needs both test jobs) |
| No governance annotations | No comments | Header comment block: purpose, protocol, governance rule, self-healing notes |
| Action version pinning | `setup-python@v4` | `setup-python@v5` (aligned with CI workflow) |

#### Self-healing properties added

- `pip install --upgrade pip` before dependency install prevents stale pip resolver issues.
- Explicit `pip install pytest pytest-asyncio` after `requirements.txt` install acts as a
  defensive fallback — the workflow will not fail due to a missing test tool even if
  `requirements.txt` is temporarily out of sync.
- `python -m pytest` used instead of bare `pytest` to guarantee the correct Python
  environment's pytest is invoked.
- Node cache keyed on `package-lock.json` with graceful fallback for missing lock file.
- Repo Guardian uses `$ERRORS` counter pattern — multiple violations are all reported
  before the job exits, enabling one-pass triage.

#### Governance compliance (110% Protocol)

- All workflow steps include `[validate]` or `[RepoGuardian]` log prefixes for
  traceability in GitHub Actions output.
- This CHANGELOG entry documents all changes for full transparency.
- The workflow is idempotent: re-running on the same commit produces identical results.
- Secrets and credentials are not referenced in any step.
