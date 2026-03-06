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
import {
  IconDashboard,
  IconBarChart,
  IconUsers,
  IconSettings,
  IconCpu,
  IconMenu,
} from "@/components/Icons";

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

const MOBILE_NAV: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Home", icon: <IconDashboard className="w-5 h-5" /> },
  { id: "leads", label: "Leads", icon: <IconUsers className="w-5 h-5" /> },
  { id: "analytics", label: "Charts", icon: <IconBarChart className="w-5 h-5" /> },
  { id: "workflows", label: "Workflows", icon: <IconSettings className="w-5 h-5" /> },
  { id: "ai-command", label: "AI", icon: <IconCpu className="w-5 h-5" /> },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [filters, setFilters] = useState<{
    tier?: string;
    search?: string;
    state?: string;
    city?: string;
  }>({});

  const handleFilterChange = (newFilters: {
    tier?: string;
    search?: string;
    state?: string;
    city?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const contentMargin = sidebarCollapsed ? "md:ml-16" : "md:ml-[260px]";

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar — desktop only */}
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
        <header className="sticky top-0 z-20 bg-black/95 backdrop-blur-xl border-b border-yellow-400/10 h-14 flex items-center px-4 gap-3">
          {/* Mobile hamburger — opens sidebar overlay */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 transition-colors"
            aria-label="Open menu"
          >
            <IconMenu className="w-5 h-5" />
          </button>

          {/* Logo — mobile only */}
          <span className="md:hidden text-yellow-400 font-black text-base tracking-tight">
            XPS<span className="text-white font-light ml-0.5 text-xs"> INTEL</span>
          </span>

          <div className="flex-1 min-w-0 hidden md:block">
            <h1 className="text-sm font-semibold text-white truncate">
              {SECTION_LABELS[activeSection]}
            </h1>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
            <span className="hidden sm:inline">Live</span>
          </div>

          {/* Chat button in header — desktop */}
          <button
            onClick={() => setChatOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/30 rounded-lg text-xs text-yellow-400 hover:bg-yellow-400/20 transition-all"
          >
            <IconCpu className="w-3.5 h-3.5" />
            <span>AI Command</span>
          </button>

          {/* Chat button — mobile header shortcut */}
          <button
            onClick={() => setChatOpen(true)}
            className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 transition-all hover:bg-yellow-400/20"
            aria-label="AI Command"
          >
            <IconCpu className="w-4 h-4" />
          </button>
        </header>

        {/* Page content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
          {activeSection === "dashboard" && (
            <div className="fade-in space-y-3">
              <StatsCards />
              <FilterBar onFilterChange={handleFilterChange} />
              <LeadsTable filters={filters} />
            </div>
          )}

          {activeSection === "analytics" && <AnalyticsSection filters={filters} onFilterChange={handleFilterChange} />}

          {activeSection === "leads" && (
            <div className="fade-in space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">All Leads</h2>
                <span className="text-xs text-gray-500">Lead database</span>
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

        {/* Footer — desktop only */}
        <footer className="hidden md:flex border-t border-[#2a2a2a] px-6 py-3 items-center justify-between">
          <span className="text-xs text-gray-600">© 2026 XPS Lead Intelligence</span>
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

      {/* Floating chat button — desktop only */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-yellow-400 hover:bg-yellow-500 text-black items-center justify-center shadow-lg shadow-yellow-400/20 transition-all hover:scale-110 gold-pulse"
          aria-label="Open AI Command Chat"
        >
          <IconCpu className="w-5 h-5" />
        </button>
      )}

      {/* Chat Panel */}
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav md:hidden">
        <div className="flex items-center justify-around px-1 py-1.5">
          {MOBILE_NAV.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={[
                  "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-[52px]",
                  isActive
                    ? "text-yellow-400 bg-yellow-400/10"
                    : "text-gray-500 hover:text-gray-300",
                ].join(" ")}
              >
                <span className={`${isActive ? "text-yellow-400" : "text-gray-500"}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-medium leading-none ${isActive ? "text-yellow-400" : "text-gray-600"}`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-yellow-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
