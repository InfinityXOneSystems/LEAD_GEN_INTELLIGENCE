"use client";

import { useEffect } from "react";
import {
  IconDashboard,
  IconBarChart,
  IconUsers,
  IconSearch,
  IconMail,
  IconSettings,
  IconLink,
  IconCpu,
  IconGitHub,
} from "@/components/Icons";

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
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
  { id: "analytics", label: "Analytics", icon: <IconBarChart /> },
  { id: "leads", label: "Leads", icon: <IconUsers /> },
  { id: "scraper", label: "Scraper", icon: <IconSearch /> },
  { id: "outreach", label: "Outreach", icon: <IconMail /> },
  { id: "workflows", label: "Workflows", icon: <IconSettings /> },
  { id: "integrations", label: "Integrations", icon: <IconLink /> },
  { id: "ai-command", label: "AI Command", icon: <IconCpu /> },
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
    if (typeof window !== "undefined" && window.innerWidth < 768 && isOpen)
      onToggle();
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
            <span className="text-xl font-black text-yellow-400 mx-auto">
              X
            </span>
          )}

          {/* Desktop collapse toggle */}
          <button
            onClick={onCollapsedToggle}
            className="hidden md:flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors flex-shrink-0"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* Mobile close button */}
          <button
            onClick={onToggle}
            className="md:hidden flex items-center justify-center w-7 h-7 rounded text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            aria-label="Close menu"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
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
                <span
                  className={`flex-shrink-0 w-4 h-4 ${isActive ? "text-yellow-400" : "opacity-70"}`}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
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
            <IconGitHub className="w-4 h-4 flex-shrink-0" />
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
            <IconSettings className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
