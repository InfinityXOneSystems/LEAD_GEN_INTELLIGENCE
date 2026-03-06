"use client";

import { useState } from "react";

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
        {description && <div className="text-xs text-gray-500">{description}</div>}
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

function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5 card-hover">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1a1a1a]">
        <span className="text-xl">{icon}</span>
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
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");

  const handleTestConnection = () => {
    if (!apiKey) return;
    setTestStatus("testing");
    setTimeout(() => {
      setTestStatus(apiKey.length > 10 ? "success" : "error");
    }, 1500);
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Integrations</h2>
        <p className="text-sm text-gray-500 mt-1">Connect external services to enhance the platform</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gmail */}
        <SectionCard title="Gmail Sync" icon="📬">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Status</div>
                <div className={`text-xs ${gmailConnected ? "text-green-400" : "text-gray-500"}`}>
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
                <div className="text-gray-500">Last sync: <span className="text-white">5 minutes ago</span></div>
                <div className="text-gray-500">Emails processed: <span className="text-yellow-400">1,234</span></div>
                <div className="text-gray-500">Leads found: <span className="text-green-400">47</span></div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* GitHub */}
        <SectionCard title="GitHub Connector" icon="🐙">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Status</div>
                <div className="text-xs text-green-400">✓ Connected</div>
              </div>
              <span className="text-xs px-2 py-0.5 status-active rounded-full">Active</span>
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
            <div className="text-xs text-gray-500">Last sync: <span className="text-white">2 minutes ago</span></div>
          </div>
        </SectionCard>

        {/* GPT Actions */}
        <SectionCard title="GPT Actions" icon="🤖">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">OpenAI API Key</label>
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
                  {showApiKey ? "🙈" : "👁️"}
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
              {testStatus === "success" && <span className="text-green-400 text-xs">✓ Connected</span>}
              {testStatus === "error" && <span className="text-red-400 text-xs">✕ Failed</span>}
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
        <SectionCard title="GitHub Copilot" icon="✨">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-white">Copilot Status</div>
                <div className="text-xs text-green-400">✓ Active in workspace</div>
              </div>
              <span className="text-xs px-2 py-0.5 status-active rounded-full">Enabled</span>
            </div>
            <div className="bg-[#111111] rounded-lg p-3 text-xs space-y-1.5">
              <div className="text-gray-400 font-medium mb-1">Available Commands:</div>
              <div className="space-y-1 text-gray-300">
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">/scrape [query] [location]</div>
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">/score --all-leads</div>
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">/outreach --tier HOT</div>
                <div className="font-mono text-[10px] bg-[#0a0a0a] px-2 py-1 rounded">/pipeline --run-all</div>
              </div>
            </div>
            <a
              href="https://github.com/mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 bg-[#111111] rounded-lg text-xs hover:bg-[#1a1a1a] transition-colors group"
            >
              <span className="text-gray-400 group-hover:text-white">GitHub Mobile App</span>
              <span className="text-yellow-400">Open ↗</span>
            </a>
            <div className="space-y-0.5">
              {[
                { label: "Code completion", ok: true },
                { label: "Chat interface", ok: true },
                { label: "Workspace agent", ok: true },
                { label: "GitHub Actions integration", ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs py-0.5">
                  <span className={item.ok ? "text-green-400" : "text-red-400"}>
                    {item.ok ? "✓" : "✕"}
                  </span>
                  <span className="text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
