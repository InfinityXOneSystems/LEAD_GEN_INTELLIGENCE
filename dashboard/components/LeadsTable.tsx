'use client';

import { useState, useEffect } from 'react';

export default function LeadsTable({ filters }: any) {
  const [allLeads, setAllLeads] = useState<any[]>([]);
  const [displayLeads, setDisplayLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const leadsPerPage = 50;

  useEffect(() => {
    fetch('/data/scored_leads.json')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllLeads(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setAllLeads([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = [...allLeads];

    if (filters.tier && filters.tier !== 'ALL') {
      filtered = filtered.filter((lead: any) => {
        const score = lead.lead_score || lead.score || 0;
        const tier = lead.tier || (score >= 75 ? 'HOT' : score >= 50 ? 'WARM' : 'COLD');
        return tier === filters.tier;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((lead: any) => {
        const company = (lead.company || lead.company_name || '').toLowerCase();
        const city = (lead.city || '').toLowerCase();
        const industry = (lead.industry || lead.industry_detected || '').toLowerCase();
        return company.includes(searchLower) || city.includes(searchLower) || industry.includes(searchLower);
      });
    }

    setDisplayLeads(filtered);
    setPage(1);
  }, [filters, allLeads]);

  const totalPages = Math.ceil(displayLeads.length / leadsPerPage);
  const startIdx = (page - 1) * leadsPerPage;
  const paginatedLeads = displayLeads.slice(startIdx, startIdx + leadsPerPage);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 dark:border-yellow-500 mx-auto"></div>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading leads...</p>
      </div>
    );
  }

  if (displayLeads.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          {allLeads.length === 0
            ? 'No leads data available. Run the scoring pipeline to generate leads.'
            : 'No leads found matching your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Industry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Score</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Contact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {paginatedLeads.map((lead: any, idx: number) => (
              <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {lead.company || lead.company_name || 'Unknown'}
                  </div>
                  {lead.rating && (
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      ⭐ {lead.rating.toFixed(1)} ({lead.reviews} reviews)
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                  {lead.city || 'Unknown'}, {lead.state}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-900 dark:text-zinc-100">
                  {lead.industry_detected || lead.industry || 'Unknown'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                    {lead.lead_score || lead.score || 0}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {lead.phone && <div>📞 {lead.phone}</div>}
                  {lead.email && <div>✉️ {lead.email}</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-zinc-50 dark:bg-zinc-800 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Page {page} of {totalPages} ({displayLeads.length} leads)
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
