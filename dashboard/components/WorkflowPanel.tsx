"use client";

import { useState } from "react";
import { IconCheck, IconX, IconRefresh, IconMinus, IconClock, IconExternalLink, IconActivity } from "@/components/Icons";

interface Workflow {
  id: string;
  name: string;
  file: string;
  schedule: string;
  lastRun: string;
  lastStatus: "success" | "failure" | "running" | "skipped";
  nextRun: string;
  description: string;
  stages: string[];
  yaml: string;
}

const WORKFLOWS: Workflow[] = [
  {
    id: "lead-pipeline",
    name: "Lead Pipeline",
    file: "lead_pipeline.yml",
    schedule: "Every 4 hours",
    lastRun: "2h ago",
    lastStatus: "success",
    nextRun: "in 2h",
    description: "Full autonomous lead discovery pipeline",
    stages: ["Scrape", "Validate", "Enrich", "Score", "Outreach"],
    yaml: `name: Lead Intelligence Pipeline

on:
  schedule:
    - cron: '0 */4 * * *'
  workflow_dispatch:

jobs:
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run Scrapers
        run: node scrapers/index.js
      - name: Validate Leads
        run: node validators/validate.js
      - name: Enrich Leads
        run: node tools/enrichment.js
      - name: Score Leads
        run: node tools/scoring.js
      - name: Queue Outreach
        run: node outreach/queue.js`,
  },
  {
    id: "repo-guardian",
    name: "Repo Guardian",
    file: "repo_guardian.yml",
    schedule: "Every 6 hours",
    lastRun: "4h ago",
    lastStatus: "success",
    nextRun: "in 2h",
    description: "Auto-fixes code issues, updates docs",
    stages: ["Lint", "Auto-fix", "Commit"],
    yaml: `name: Repo Guardian

on:
  schedule:
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  guardian:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run ESLint autofix
        run: npm run lint -- --fix
      - name: Commit changes
        run: |
          git config --global user.name "Copilot"
          git add -A
          git diff --staged --quiet || git commit -m "auto: fix lint issues"
          git push`,
  },
  {
    id: "national-discovery",
    name: "National Discovery",
    file: "national_discovery.yml",
    schedule: "Daily at 2 AM",
    lastRun: "22h ago",
    lastStatus: "success",
    nextRun: "in 2h",
    description: "Nationwide lead discovery across all 50 states",
    stages: ["US Scrapers", "Deduplicate", "Score", "Store"],
    yaml: `name: National Lead Discovery

on:
  schedule:
    - cron: '0 2 * * *'
  workflow_dispatch:

jobs:
  discover:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run National Scrapers
        run: node scrapers/national.js
      - name: Deduplicate
        run: node validators/dedup.js
      - name: Score All Leads
        run: node tools/scoring.js --all`,
  },
  {
    id: "docs-reflection",
    name: "Docs Reflection",
    file: "docs_reflection.yml",
    schedule: "Weekly",
    lastRun: "3 days ago",
    lastStatus: "skipped",
    nextRun: "in 4 days",
    description: "Auto-updates documentation and README",
    stages: ["Analyze", "Generate", "Commit"],
    yaml: `name: Docs Reflection

on:
  schedule:
    - cron: '0 0 * * 1'
  workflow_dispatch:

jobs:
  reflect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Generate docs
        run: node tools/docs-generator.js
      - name: Push updates
        run: |
          git config --global user.name "Copilot"
          git add docs/
          git diff --staged --quiet || git commit -m "docs: auto-update"
          git push`,
  },
];

const statusColor = (s: string) => {
  if (s === "success")
    return "text-green-400 bg-green-400/10 border border-green-400/30";
  if (s === "failure")
    return "text-red-400 bg-red-400/10 border border-red-400/30";
  if (s === "running")
    return "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30";
  return "text-gray-500 bg-gray-500/10 border border-gray-500/30";
};

const statusIcon = (s: string): React.ReactNode => {
  if (s === "success") return <IconCheck className="w-3 h-3" />;
  if (s === "failure") return <IconX className="w-3 h-3" />;
  if (s === "running") return <IconRefresh className="w-3 h-3 animate-spin" />;
  return <IconMinus className="w-3 h-3" />;
};

export default function WorkflowPanel() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null,
  );
  const [showYaml, setShowYaml] = useState(false);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          GitHub Actions Workflows
        </h2>
        <a
          href="https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-gray-400 hover:text-white hover:border-yellow-400/40 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>
          View on GitHub
        </a>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 gap-4">
        {WORKFLOWS.map((wf) => (
          <div
            key={wf.id}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5 card-hover cursor-pointer"
            onClick={() => {
              setSelectedWorkflow(wf);
              setShowYaml(false);
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">
                    {wf.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusColor(wf.lastStatus)}`}
                  >
                    {statusIcon(wf.lastStatus)} {wf.lastStatus}
                  </span>
                </div>
                <div className="text-xs text-gray-500">{wf.description}</div>
              </div>
              <div className="text-right text-xs text-gray-500 flex-shrink-0 ml-4">
                <div>Last: {wf.lastRun}</div>
                <div>Next: {wf.nextRun}</div>
              </div>
            </div>

            {/* Pipeline stages */}
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              {wf.stages.map((stage, i) => (
                <span key={stage} className="flex items-center gap-1">
                  <span className="text-xs px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-300">
                    {stage}
                  </span>
                  {i < wf.stages.length - 1 && (
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <IconClock className="w-3 h-3" /> {wf.schedule}
                </span>
                <span className="font-mono text-[10px] text-gray-600">
                  {wf.file}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWorkflow(wf);
                    setShowYaml(true);
                  }}
                  className="text-xs px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 transition-all"
                >
                  View YAML
                </button>
                <a
                  href={`https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/actions/workflows/${wf.file}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded text-yellow-400 hover:bg-yellow-400/20 transition-all"
                >
                  Trigger <IconExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* YAML Viewer Modal */}
      {selectedWorkflow && showYaml && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {selectedWorkflow.name}
                </h3>
                <span className="text-xs text-gray-500 font-mono">
                  {selectedWorkflow.file}
                </span>
              </div>
              <button
                onClick={() => setShowYaml(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-xs text-green-400 leading-relaxed font-mono">
                {selectedWorkflow.yaml}
              </pre>
            </div>
            <div className="px-5 py-3 border-t border-[#2a2a2a]">
              <a
                href={`https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/blob/main/.github/workflows/${selectedWorkflow.file}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-yellow-400 hover:text-yellow-300"
              >
                View on GitHub <IconExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
