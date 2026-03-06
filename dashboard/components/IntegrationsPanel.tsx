"use client";

import { useState } from "react";
import {
  IconMail,
  IconGitHub,
  IconCpu,
  IconStar,
  IconSettings,
  IconGlobe,
  IconBarChart,
  IconFolder,
  IconClock,
} from "@/components/Icons";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  description?: string;
}

function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm text-white">{label}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>
      <button
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-yellow-400" : "bg-[#2a2a2a]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card gold-glow-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-yellow-400/10">
        <span className="text-yellow-400/70">{icon}</span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function IntegrationsPanel() {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [autoImport, setAutoImport] = useState(false);
  const [trackReplies, setTrackReplies] = useState(true);
  const [autoIssues, setAutoIssues] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [driveConnected, setDriveConnected] = useState(false);
  const [sheetsAutoExport, setSheetsAutoExport] = useState(false);
  const [driveAutoBackup, setDriveAutoBackup] = useState(false);
  const [sheetsExportStatus, setSheetsExportStatus] = useState<
    "idle" | "running" | "done"
  >("idle");

  const handleTestConnection = () => {
    if (!apiKey) return;
    setTestStatus("testing");
    setTimeout(() => {
      setTestStatus(apiKey.length > 10 ? "success" : "error");
    }, 1500);
  };

  const handleSheetsExport = () => {
    setSheetsExportStatus("running");
    setTimeout(() => setSheetsExportStatus("done"), 2000);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">
          Connect external services to enhance the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gmail */}
        <SectionCard title="Gmail Sync" icon={<IconMail className="w-5 h-5" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Status</div>
                <div
                  className={`text-xs ${gmailConnected ? "text-green-400" : "text-gray-500"}`}
                >
                  {gmailConnected ? "✓ Connected" : "Not connected"}
                </div>
              </div>
              <button
                onClick={() => setGmailConnected(!gmailConnected)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  gmailConnected
                    ? "bg-red-400/10 border border-red-400/30 text-red-400 hover:bg-red-400/20"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black"
                }`}
              >
                {gmailConnected ? "Disconnect" : "Connect Gmail"}
              </button>
            </div>
            <div className="border-t border-[#1a1a1a] pt-3 space-y-0.5">
              <Toggle
                checked={autoImport}
                onChange={() => setAutoImport(!autoImport)}
                label="Auto-import leads from emails"
                description="Parse incoming emails for contact info"
              />
              <Toggle
                checked={trackReplies}
                onChange={() => setTrackReplies(!trackReplies)}
                label="Track outreach replies"
                description="Automatically log email responses"
              />
            </div>
            {gmailConnected && (
              <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-1">
                <div className="text-gray-500">
                  Last sync: <span className="text-white">5 minutes ago</span>
                </div>
                <div className="text-gray-500">
                  Emails processed:{" "}
                  <span className="text-yellow-400">1,234</span>
                </div>
                <div className="text-gray-500">
                  Leads found: <span className="text-green-400">47</span>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* GitHub */}
        <SectionCard
          title="GitHub Connector"
          icon={<IconGitHub className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Status</div>
                <div className="text-xs text-green-400">✓ Connected</div>
              </div>
              <span className="text-xs px-2 py-0.5 status-active rounded-full">
                Active
              </span>
            </div>
            <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-1.5">
              <div className="text-gray-500">Repository</div>
              <a
                href="https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-300 font-mono text-[11px] block"
              >
                InfinityXOneSystems/LEAD_GEN_INTELLIGENCE ↗
              </a>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["Actions", "Issues", "Pull Reqs"].map((link) => (
                <a
                  key={link}
                  href={`https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE/${link.toLowerCase().replace(/\s/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-gray-400 hover:text-yellow-400 hover:border-yellow-400/30 transition-all"
                >
                  {link}
                </a>
              ))}
            </div>
            <div className="border-t border-[#1a1a1a] pt-2">
              <Toggle
                checked={autoIssues}
                onChange={() => setAutoIssues(!autoIssues)}
                label="Auto-create issues for errors"
                description="Log pipeline failures as GitHub issues"
              />
            </div>
            <div className="text-xs text-gray-500">
              Last sync: <span className="text-white">2 minutes ago</span>
            </div>
          </div>
        </SectionCard>

        {/* GPT Actions */}
        <SectionCard title="GPT Actions" icon={<IconCpu className="w-5 h-5" />}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                OpenAI API Key
              </label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-400/50 transition-colors"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="px-2 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-500 hover:text-white transition-colors text-xs"
                >
                  {showApiKey ? (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400/50 transition-colors"
              >
                <option>gpt-4o</option>
                <option>gpt-4</option>
                <option>gpt-3.5-turbo</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleTestConnection}
                disabled={!apiKey || testStatus === "testing"}
                className="flex-1 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-gray-400 hover:text-white hover:border-yellow-400/30 transition-all disabled:opacity-40"
              >
                {testStatus === "testing" ? "Testing..." : "Test Connection"}
              </button>
              {testStatus === "success" && (
                <span className="text-green-400 text-xs">✓ Connected</span>
              )}
              {testStatus === "error" && (
                <span className="text-red-400 text-xs">✕ Failed</span>
              )}
            </div>
            <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-1 text-gray-500">
              <div className="text-gray-400 font-medium mb-1.5">Use Cases:</div>
              <div>• Lead enrichment & research</div>
              <div>• Email composition & personalization</div>
              <div>• Score analysis & recommendations</div>
            </div>
          </div>
        </SectionCard>

        {/* Copilot */}
        <SectionCard
          title="GitHub Copilot"
          icon={<IconStar className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Copilot Status</div>
                <div className="text-xs text-green-400">
                  ✓ Active in workspace
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 status-active rounded-full">
                Enabled
              </span>
            </div>
            <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-1.5">
              <div className="text-gray-400 font-medium mb-1">
                Available Commands:
              </div>
              <div className="space-y-1 text-gray-300">
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">
                  /scrape [query] [location]
                </div>
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">
                  /score --all-leads
                </div>
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">
                  /outreach --tier HOT
                </div>
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">
                  /pipeline --run-all
                </div>
              </div>
            </div>
            <a
              href="https://github.com/mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-[#111111] rounded-lg text-xs hover:bg-[#1a1a1a] transition-colors group"
            >
              <span className="text-gray-400 group-hover:text-white">
                GitHub Mobile App
              </span>
              <span className="text-yellow-400">Open ↗</span>
            </a>
            <div className="space-y-0.5">
              {[
                { label: "Code completion", ok: true },
                { label: "Chat interface", ok: true },
                { label: "Workspace agent", ok: true },
                { label: "GitHub Actions integration", ok: true },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 text-xs py-0.5"
                >
                  <span className={item.ok ? "text-green-400" : "text-red-400"}>
                    {item.ok ? "✓" : "✕"}
                  </span>
                  <span className="text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Google Workspace */}
        <SectionCard
          title="Google Workspace"
          icon={<IconGlobe className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Connection Status</div>
                <div
                  className={`text-xs ${driveConnected ? "text-green-400" : "text-gray-500"}`}
                >
                  {driveConnected ? "✓ Connected" : "Not connected"}
                </div>
              </div>
              <button
                onClick={() => setDriveConnected(!driveConnected)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  driveConnected
                    ? "bg-red-400/10 border border-red-400/30 text-red-400 hover:bg-red-400/20"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black"
                }`}
              >
                {driveConnected ? "Disconnect" : "Connect Google"}
              </button>
            </div>
            <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-1.5">
              <div className="text-gray-400 font-medium mb-1">Services:</div>
              {[
                {
                  icon: <IconMail className="w-3.5 h-3.5" />,
                  name: "Gmail",
                  desc: "Outreach email sending",
                },
                {
                  icon: <IconBarChart className="w-3.5 h-3.5" />,
                  name: "Sheets",
                  desc: "Lead export to spreadsheet",
                },
                {
                  icon: <IconFolder className="w-3.5 h-3.5" />,
                  name: "Drive",
                  desc: "Report backup & storage",
                },
                {
                  icon: <IconClock className="w-3.5 h-3.5" />,
                  name: "Calendar",
                  desc: "Schedule scraping events",
                },
              ].map((svc) => (
                <div key={svc.name} className="flex items-center gap-2">
                  <span className="text-yellow-400/70">{svc.icon}</span>
                  <span className="text-white">{svc.name}</span>
                  <span className="text-gray-500">— {svc.desc}</span>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 bg-[#111111] rounded-lg p-3">
              <div className="text-gray-400 font-medium mb-1">
                Setup Required:
              </div>
              <div>
                Set{" "}
                <span className="font-mono text-yellow-400">
                  GOOGLE_CLIENT_ID
                </span>
              </div>
              <div>
                Set{" "}
                <span className="font-mono text-yellow-400">
                  GOOGLE_CLIENT_SECRET
                </span>
              </div>
              <div>
                Set{" "}
                <span className="font-mono text-yellow-400">
                  GOOGLE_REFRESH_TOKEN
                </span>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Google Sheets Export */}
        <SectionCard
          title="Google Sheets Export"
          icon={<IconBarChart className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="text-xs text-gray-500">
              Export leads directly to a Google Sheets spreadsheet for analysis
              and sharing.
            </div>
            <Toggle
              checked={sheetsAutoExport}
              onChange={() => setSheetsAutoExport(!sheetsAutoExport)}
              label="Auto-export after each pipeline run"
              description="Creates a new sheet with latest scored leads"
            />
            <Toggle
              checked={driveAutoBackup}
              onChange={() => setDriveAutoBackup(!driveAutoBackup)}
              label="Auto-backup reports to Drive"
              description="Stores validation & scoring reports in Drive"
            />
            <button
              onClick={handleSheetsExport}
              disabled={sheetsExportStatus === "running"}
              className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {sheetsExportStatus === "running"
                ? "Exporting..."
                : sheetsExportStatus === "done"
                  ? "✓ Exported to Sheets"
                  : "Export Leads to Google Sheets"}
            </button>
            {sheetsExportStatus === "done" && (
              <div className="text-xs text-green-400 text-center">
                Spreadsheet created — check Google Drive
              </div>
            )}
            <div className="bg-[#111111] rounded-lg p-3 text-xs text-gray-500 space-y-1">
              <div>
                • Exports all fields: company, phone, email, city, score, tier
              </div>
              <div>• Creates new sheet per export with date stamp</div>
              <div>• Supports append mode for incremental updates</div>
            </div>
          </div>
        </SectionCard>

        {/* GPT Actions / Copilot Mobile */}
        <SectionCard
          title="Copilot Mobile + GPT Actions"
          icon={<IconSettings className="w-5 h-5" />}
        >
          <div className="space-y-3">
            <div className="text-xs text-gray-500">
              Control the platform from Copilot Mobile or any Custom GPT via the
              Actions API.
            </div>
            <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-2">
              <div className="text-gray-400 font-medium mb-1">
                API Endpoints:
              </div>
              {[
                { method: "GET", path: "/status", desc: "System health" },
                { method: "GET", path: "/leads", desc: "List leads" },
                { method: "POST", path: "/scrape", desc: "Trigger scraper" },
                {
                  method: "POST",
                  path: "/pipeline/run",
                  desc: "Run full pipeline",
                },
                { method: "POST", path: "/validate", desc: "Validate leads" },
                { method: "GET", path: "/export", desc: "Export snapshot" },
                {
                  method: "POST",
                  path: "/workspace/sheets/export",
                  desc: "Export to Sheets",
                },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[9px] px-1 py-0.5 rounded ${
                      ep.method === "GET"
                        ? "bg-blue-400/20 text-blue-400"
                        : "bg-yellow-400/20 text-yellow-400"
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="font-mono text-[10px] text-gray-300">
                    {ep.path}
                  </span>
                  <span className="text-gray-500 text-[10px]">— {ep.desc}</span>
                </div>
              ))}
            </div>
            <a
              href="/openapi.json"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 bg-[#111111] rounded-lg text-xs hover:bg-[#1a1a1a] transition-colors"
            >
              <span className="text-gray-400">
                OpenAPI Spec (for Custom GPT)
              </span>
              <span className="text-yellow-400">Download ↗</span>
            </a>
            <div className="text-xs text-gray-500 bg-[#111111] rounded-lg p-3">
              <div className="text-gray-400 font-medium mb-1">
                Copilot Mobile cURL Example:
              </div>
              <div className="font-mono text-[10px] text-gray-300 break-all">
                curl -X POST http://localhost:3100/pipeline/run
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
