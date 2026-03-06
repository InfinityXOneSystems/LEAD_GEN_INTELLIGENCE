"use client";

import { useState } from "react";

interface FilterBarProps {
  onFilterChange: (filters: { tier?: string; search?: string }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeTier, setActiveTier] = useState("ALL");
  const [searchValue, setSearchValue] = useState("");

  const handleTierChange = (tier: string) => {
    setActiveTier(tier);
    onFilterChange({ tier: tier === "ALL" ? undefined : tier });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onFilterChange({ search: e.target.value });
  };

  const tiers = [
    { id: "ALL", label: "All", icon: "🎯" },
    { id: "HOT", label: "HOT", icon: "🔥" },
    { id: "WARM", label: "WARM", icon: "⚡" },
    { id: "COLD", label: "COLD", icon: "❄️" },
  ];

  return (
    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 mb-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Tier filters */}
        <div className="flex gap-1.5 flex-shrink-0">
          {tiers.map((t) => {
            const isActive = activeTier === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleTierChange(t.id)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? t.id === "HOT"
                      ? "bg-red-900/40 text-red-400 border border-red-400/40"
                      : t.id === "WARM"
                      ? "bg-orange-900/40 text-orange-400 border border-orange-400/40"
                      : t.id === "COLD"
                      ? "bg-blue-900/40 text-blue-400 border border-blue-400/40"
                      : "bg-yellow-400/10 text-yellow-400 border border-yellow-400/40"
                    : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:text-white hover:border-gray-600",
                ].join(" ")}
              >
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchValue}
              placeholder="Search by company, city, or industry..."
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-gray-600 focus:border-yellow-400/50 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
