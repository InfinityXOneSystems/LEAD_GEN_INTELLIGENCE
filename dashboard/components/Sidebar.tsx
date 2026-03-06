"use client";

import { useEffect } from "react";

export type SectionId =
  | "dashboard"
  | "analytics"
  | "leads"
  | "scraper"
  | "outreach"
  | "workflows"
  | "integrations"
  | "ai-command";

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "analytics", label: "Analytics", icon: "📈" },
  { id: "leads", label: "Leads", icon: "🎯" },
  { id: "scraper", label: "Scraper", icon: "🤖" },
  { id: "outreach", label: "Outreach", icon: "📧" },
  { id: "workflows", label: "Workflows", icon: "⚙️" },
  { id: "integrations", label: "Integrations", icon: "🔗" },
  { id: "ai-command", label: "AI Command", icon: "🧠" },
];

interface SidebarProps {
  activeSection: SectionId;
  onSectionChange: (section: SectionId) => void;
  isOpen: boolean;
  onToggle: () => void;
  collapsed: boolean;
  onCollapsedToggle: () => void;
}

export default function Sidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onToggle,
  collapsed,
  onCollapsedToggle,
}: SidebarProps) {
  // Close sidebar on mobile when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onToggle();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onToggle]);

  const handleNavClick = (section: SectionId) => {
    onSectionChange(section);
    // Close mobile overlay when selecting
    if (window.innerWidth < 768 && isOpen) onToggle();
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 h-full z-40 flex flex-col",
          "bg-[#111111] border-r border-[#2a2a2a]",
          "sidebar-transition",
          // Mobile: slide in/out
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: collapsed / expanded
          collapsed ? "md:w-16" : "md:w-[260px]",
          "w-[260px]",
        ].join(" ")}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-[#2a2a2a] flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-xl font-black text-yellow-400 tracking-tight leading-none">
                XPS
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white leading-none truncate">
                  Lead Intelligence
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 live-dot" />
                  <span className="text-[10px] text-green-400">LIVE</span>
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <span className="text-xl font-black text-yellow-400 mx-auto">X</span>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={onCollapsedToggle}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors flex-shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobile close button */}
          <button
            onClick={onToggle}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                title={collapsed ? item.label : undefined}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5",
                  "text-sm font-medium transition-all duration-150",
                  isActive
                    ? "nav-active text-yellow-400"
                    : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]",
                  collapsed ? "justify-center" : "",
                ].join(" ")}
              >
                <span className={`text-base flex-shrink-0 ${isActive ? "" : "opacity-70"}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-[#2a2a2a] px-2 py-3 flex-shrink-0">
          <a
            href="https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE"
            target="_blank"
            rel="noopener noreferrer"
            className={[
              "flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            title={collapsed ? "GitHub" : undefined}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            {!collapsed && <span>GitHub</span>}
          </a>

          <button
            className={[
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
              "text-sm text-gray-400 hover:text-white hover:bg-[#1a1a1a] transition-all",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            title={collapsed ? "Settings" : undefined}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
