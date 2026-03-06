"use client";

import { useState } from "react";

interface ScraperStatus {
  id: string;
  name: string;
  icon: string;
  status: "Active" | "Idle" | "Error";
  lastRun: string;
  leadsFound: number;
  nextRun: string;
}

const SCRAPERS: ScraperStatus[] = [
  {
    id: "google-maps",
    name: "Google Maps",
    icon: "🗺️",
    status: "Active",
    lastRun: "2h ago",
    leadsFound: 342,
    nextRun: "in 2h",
  },
  {
    id: "yelp",
    name: "Yelp",
    icon: "⭐",
    status: "Active",
    lastRun: "4h ago",
    leadsFound: 187,
    nextRun: "in 4h",
  },
  {
    id: "bing-maps",
    name: "Bing Maps",
    icon: "🔍",
    status: "Idle",
    lastRun: "8h ago",
    leadsFound: 94,
    nextRun: "in 1h",
  },
  {
    id: "directories",
    name: "Directories",
    icon: "📂",
    status: "Idle",
    lastRun: "12h ago",
    leadsFound: 56,
    nextRun: "in 3h",
  },
];

const ACTIVITY_LOG = [
  {
    time: "14:32",
    scraper: "Google Maps",
    action: "Completed",
    detail: "Found 47 flooring contractors in Columbus, OH",
    type: "success",
  },
  {
    time: "12:15",
    scraper: "Yelp",
    action: "Completed",
    detail: "Found 23 epoxy contractors in Cleveland, OH",
    type: "success",
  },
  {
    time: "10:02",
    scraper: "Bing Maps",
    action: "Started",
    detail: "Searching: epoxy contractors Cincinnati OH",
    type: "info",
  },
  {
    time: "08:45",
    scraper: "Google Maps",
    action: "Completed",
    detail: "Found 89 contractors in Akron, OH",
    type: "success",
  },
  {
    time: "06:30",
    scraper: "Directories",
    action: "Error",
    detail: "Rate limit exceeded — retrying in 30m",
    type: "error",
  },
  {
    time: "04:15",
    scraper: "Yelp",
    action: "Completed",
    detail: "Found 34 flooring companies in Toledo, OH",
    type: "success",
  },
];

const INDUSTRIES = [
  "Epoxy Flooring",
  "Concrete Coating",
  "General Flooring",
  "Tile & Stone",
  "Hardwood Flooring",
  "Commercial Flooring",
];
const STATES = ["OH", "MI", "IN", "KY", "PA", "NY", "TX", "FL", "CA", "IL"];

export default function ScraperPanel() {
  const [selectedScraper, setSelectedScraper] = useState("google-maps");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runLog, setRunLog] = useState<string[]>([]);

  const handleTrigger = () => {
    if (!query || !location) return;
    setIsRunning(true);
    setRunProgress(0);
    setRunLog([]);

    const steps = [
      `🚀 Initializing ${SCRAPERS.find((s) => s.id === selectedScraper)?.name} scraper...`,
      `🔍 Searching: "${query}" in "${location}"`,
      `📡 Fetching business listings...`,
      `✅ Found 23 results — parsing data...`,
      `🔬 Extracting: company names, phones, addresses...`,
      `📊 Sending to validation queue...`,
      `✅ Scrape completed! 23 leads queued for processing.`,
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setRunLog((prev) => [...prev, steps[i]]);
        setRunProgress(Math.round(((i + 1) / steps.length) * 100));
        i++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 600);
  };

  const statusClass = (s: string) => {
    if (s === "Active") return "status-active";
    if (s === "Error") return "status-error";
    return "status-idle";
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Scraper Control</h2>
        <div className="flex items-center gap-2 text-sm text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-400 live-dot" />2
          scrapers active
        </div>
      </div>

      {/* Scraper Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {SCRAPERS.map((sc) => (
          <div
            key={sc.id}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 card-hover"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{sc.icon}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${statusClass(sc.status)}`}
              >
                {sc.status}
              </span>
            </div>
            <div className="text-sm font-semibold text-white mb-2">
              {sc.name}
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Last run</span>
                <span className="text-gray-300">{sc.lastRun}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Leads found</span>
                <span className="text-yellow-400 font-semibold">
                  {sc.leadsFound}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Next run</span>
                <span className="text-gray-300">{sc.nextRun}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Trigger */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          🚀 Manual Scraper Trigger
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Scraper</label>
            <select
              value={selectedScraper}
              onChange={(e) => setSelectedScraper(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400/50 transition-colors"
            >
              {SCRAPERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Industry / Query
            </label>
            <select
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400/50 transition-colors"
            >
              <option value="">Select industry...</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">State</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400/50 transition-colors"
            >
              <option value="">Select state...</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isRunning && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Running...</span>
              <span>{runProgress}%</span>
            </div>
            <div className="w-full bg-[#2a2a2a] rounded-full h-1.5 mb-3">
              <div
                className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${runProgress}%` }}
              />
            </div>
            <div className="bg-[#111111] border border-[#2a2a2a] rounded-lg p-3 max-h-32 overflow-y-auto">
              {runLog.map((line, i) => (
                <div key={i} className="text-xs text-gray-300 py-0.5">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleTrigger}
          disabled={isRunning || !query || !location}
          className="px-5 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? "⏳ Running..." : "🚀 Run Scraper"}
        </button>
      </div>

      {/* Activity Log */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">
          📋 Recent Activity
        </h3>
        <div className="space-y-2">
          {ACTIVITY_LOG.map((entry, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-[#1a1a1a] last:border-0"
            >
              <span className="text-xs text-gray-500 w-10 flex-shrink-0 pt-0.5">
                {entry.time}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                  entry.type === "success"
                    ? "status-active"
                    : entry.type === "error"
                      ? "status-error"
                      : "status-idle"
                }`}
              >
                {entry.action}
              </span>
              <div>
                <span className="text-xs text-yellow-400 font-medium">
                  {entry.scraper}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  {entry.detail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
