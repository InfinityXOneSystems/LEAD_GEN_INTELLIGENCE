"use client";

import { useState } from "react";
import StatsCards from "@/components/StatsCards";
import FilterBar from "@/components/FilterBar";
import LeadsTable from "@/components/LeadsTable";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const [filters, setFilters] = useState<{
    tier?: string;
    search?: string;
  }>({});

  const handleFilterChange = (newFilters: {
    tier?: string;
    search?: string;
  }) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                XPS Lead Intelligence
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Contractor Lead Generation Platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Live Dashboard
              </div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <StatsCards />

        {/* Filter Bar */}
        <FilterBar onFilterChange={handleFilterChange} />

        {/* Leads Table */}
        <LeadsTable filters={filters} />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © 2026 XPS Lead Intelligence Platform
            </p>
            <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <a
                href="https://github.com/InfinityXOneSystems/LEAD_GEN_INTELLIGENCE"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-yellow-600 dark:hover:text-yellow-500 transition-colors"
              >
                GitHub
              </a>
              <span>•</span>
              <span>Phase 6: Dashboard UI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
