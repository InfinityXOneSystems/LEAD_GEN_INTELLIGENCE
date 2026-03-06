'use client';

interface FilterBarProps {
  onFilterChange: (filters: {
    tier?: string;
    search?: string;
  }) => void;
}

export default function FilterBar({ onFilterChange }: FilterBarProps) {
  const handleTierChange = (tier: string) => {
    onFilterChange({ tier: tier === 'ALL' ? undefined : tier });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ search: e.target.value });
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => handleTierChange('ALL')}
            className="px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm font-medium transition-colors"
          >
            All Leads
          </button>
          <button
            onClick={() => handleTierChange('HOT')}
            className="px-4 py-2 rounded-md bg-red-100 dark:bg-red-950 hover:bg-red-200 dark:hover:bg-red-900 text-red-900 dark:text-red-100 text-sm font-medium transition-colors"
          >
            🔥 HOT
          </button>
          <button
            onClick={() => handleTierChange('WARM')}
            className="px-4 py-2 rounded-md bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 text-sm font-medium transition-colors"
          >
            ⚡ WARM
          </button>
          <button
            onClick={() => handleTierChange('COLD')}
            className="px-4 py-2 rounded-md bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900 text-blue-900 dark:text-blue-100 text-sm font-medium transition-colors"
          >
            ❄️ COLD
          </button>
        </div>
        <div className="flex-1 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search leads by company, city, or industry..."
            onChange={handleSearchChange}
            className="w-full px-4 py-2 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-600 text-sm"
          />
        </div>
      </div>
    </div>
  );
}
