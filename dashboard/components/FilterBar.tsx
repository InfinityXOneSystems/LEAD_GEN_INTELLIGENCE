"use client";

import { useState } from "react";
import { IconSearch, IconMapPin, IconBuilding, IconX, IconFire, IconBolt, IconSnowflake, IconTarget } from "@/components/Icons";

interface FilterBarProps {
  onFilterChange: (filters: {
    tier?: string;
    search?: string;
    state?: string;
    city?: string;
  }) => void;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
];

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const [activeTier, setActiveTier] = useState("ALL");
  const [searchValue, setSearchValue] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [cityValue, setCityValue] = useState("");

  const handleTierChange = (tier: string) => {
    setActiveTier(tier);
    onFilterChange({ tier: tier === "ALL" ? undefined : tier });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onFilterChange({ search: e.target.value });
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    onFilterChange({ state: e.target.value || undefined });
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCityValue(e.target.value);
    onFilterChange({ city: e.target.value || undefined });
  };

  const tiers = [
    { id: "ALL", label: "All", icon: <IconTarget className="w-3.5 h-3.5" /> },
    { id: "HOT", label: "HOT", icon: <IconFire className="w-3.5 h-3.5" /> },
    { id: "WARM", label: "WARM", icon: <IconBolt className="w-3.5 h-3.5" /> },
    { id: "COLD", label: "COLD", icon: <IconSnowflake className="w-3.5 h-3.5" /> },
  ];

  const hasActiveFilters = activeTier !== "ALL" || searchValue || selectedState || cityValue;

  return (
    <div className="glass-card rounded-2xl p-4 mb-3 space-y-3">
      {/* Row 1: Tier pills + Search */}
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
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  isActive
                    ? t.id === "HOT"
                      ? "bg-red-900/40 text-red-400 border border-red-400/50"
                      : t.id === "WARM"
                        ? "bg-orange-900/40 text-orange-400 border border-orange-400/50"
                        : t.id === "COLD"
                          ? "bg-blue-900/40 text-blue-400 border border-blue-400/50"
                          : "bg-yellow-400/15 text-yellow-400 border border-yellow-400/50"
                    : "bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:text-white hover:border-gray-600",
                ].join(" ")}
              >
                {t.icon}
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={searchValue}
              placeholder="Search company, city, industry…"
              onChange={handleSearchChange}
              className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-gray-600 focus:border-yellow-400/50 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Row 2: State + City */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* State dropdown */}
        <div className="flex-1 relative">
          <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
          <select
            value={selectedState}
            onChange={handleStateChange}
            className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white focus:border-yellow-400/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">All States</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* City input */}
        <div className="flex-1 relative">
          <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={cityValue}
            placeholder="Filter by city…"
            onChange={handleCityChange}
            className="w-full pl-9 pr-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-gray-600 focus:border-yellow-400/50 transition-colors"
          />
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              setActiveTier("ALL");
              setSearchValue("");
              setSelectedState("");
              setCityValue("");
              onFilterChange({ tier: undefined, search: undefined, state: undefined, city: undefined });
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-400 hover:text-yellow-400 border border-[#2a2a2a] hover:border-yellow-400/30 rounded-xl transition-all whitespace-nowrap"
          >
            <IconX className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
