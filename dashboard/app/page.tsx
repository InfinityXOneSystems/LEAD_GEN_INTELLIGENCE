"use client";

import { useState } from "react";
import Sidebar, { SectionId } from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import FilterBar from "@/components/FilterBar";
import LeadsTable from "@/components/LeadsTable";
import ChatPanel from "@/components/ChatPanel";
import AnalyticsSection from "@/components/AnalyticsSection";
import ScraperPanel from "@/components/ScraperPanel";
import OutreachPanel from "@/components/OutreachPanel";
import WorkflowPanel from "@/components/WorkflowPanel";
import IntegrationsPanel from "@/components/IntegrationsPanel";
import AICommandPanel from "@/components/AICommandPanel";

const SECTION_LABELS: Record<SectionId, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  leads: "Leads",
  scraper: "Scraper Control",
  outreach: "Outreach",
  workflows: "Workflows",
  integrations: "Integrations",
  "ai-command": "AI Orchestration",
};

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [filters, setFilters] = useState<{ tier?: string; search?: string }>(
    {},
  );

  const handleFilterChange = (newFilters: {
    tier?: string;
    search?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Main content offset based on sidebar state
  const contentMargin = sidebarCollapsed ? "md:ml-16" : "md:ml-[260px]";

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSectionChange={(s) => {
          setActiveSection(s);
          setSidebarOpen(false);
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        collapsed={sidebarCollapsed}
        onCollapsedToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main area */}
      <div
        className={`flex-1 flex flex-col min-h-screen ${contentMargin} content-transition`}
      >
        {/* Top header */}
        <header className="sticky top-0 z-20 bg-black/95 backdrop-blur border-b border-[#2a2a2a] h-14 flex items-center px-4 gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">
              {SECTION_LABELS[activeSection]}
            </h1>
          </div>

          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
            Live
          </div>

          {/* Chat button in header */}
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-400/20 transition-all"
          >
            <span>🧠</span>
            <span className="hidden sm:inline">AI Command</span>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {activeSection === "dashboard" && (
            <div className="fade-in space-y-2">
              <StatsCards />
              <FilterBar onFilterChange={handleFilterChange} />
              <LeadsTable filters={filters} />
            </div>
          )}

          {activeSection === "analytics" && <AnalyticsSection />}

          {activeSection === "leads" && (
            <div className="fade-in space-y-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">All Leads</h2>
                <span className="text-sm text-gray-500">
                  Manage & filter your lead database
                </span>
              </div>
              <FilterBar onFilterChange={handleFilterChange} />
              <LeadsTable filters={filters} />
            </div>
          )}

          {activeSection === "scraper" && <ScraperPanel />}
          {activeSection === "outreach" && <OutreachPanel />}
          {activeSection === "workflows" && <WorkflowPanel />}
          {activeSection === "integrations" && <IntegrationsPanel />}
          {activeSection === "ai-command" && <AICommandPanel />}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#2a2a2a] px-6 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-600">
            © 2026 XPS Lead Intelligence
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <a
              href="https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-yellow-400 transition-colors"
            >
              GitHub
            </a>
            <span>Phase 6: Dashboard UI</span>
          </div>
        </footer>
      </div>

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black text-xl flex items-center justify-center shadow-lg shadow-yellow-400/20 transition-all hover:scale-110 gold-pulse"
          aria-label="Open AI Command Chat"
        >
          💬
        </button>
      )}

      {/* Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
