'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, TrendingUp, Send, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';

export default function OutreachPage() {
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    industry: '',
    min_score: '60',
    template: 'default',
  });
  const [creating, setCreating] = useState(false);

  const { data: statsData } = useQuery({
    queryKey: ['outreach-stats'],
    queryFn: () => apiClient.get('/outreach/stats').then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: campaignsData, refetch } = useQuery({
    queryKey: ['outreach-campaigns'],
    queryFn: () => apiClient.get('/outreach/campaigns').then((r) => r.data),
  });

  const handleCreateCampaign = async () => {
    if (!campaignForm.name) return toast.error('Campaign name required');
    setCreating(true);
    try {
      await apiClient.post('/outreach/campaigns', null, {
        params: {
          name: campaignForm.name,
          industry: campaignForm.industry || undefined,
          min_score: parseFloat(campaignForm.min_score),
          template: campaignForm.template,
        },
      });
      toast.success('Campaign created');
      refetch();
      setCampaignForm({ name: '', industry: '', min_score: '60', template: 'default' });
    } catch (e: unknown) {
      const err = e as Error;
      toast.error(err.message || 'Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Outreach</h1>
        <p className="text-gray-500 text-sm mt-1">Manage email campaigns and track results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-500 rounded-xl"><Mail className="w-5 h-5 text-white" /></div>
          <div>
            <p className="text-sm text-gray-500">Total Sent</p>
            <p className="text-2xl font-bold">{statsData?.total_sent ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-500 rounded-xl"><TrendingUp className="w-5 h-5 text-white" /></div>
          <div>
            <p className="text-sm text-gray-500">Last 30 Days</p>
            <p className="text-2xl font-bold">{statsData?.last_30_days ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-purple-500 rounded-xl"><Send className="w-5 h-5 text-white" /></div>
          <div>
            <p className="text-sm text-gray-500">Campaigns</p>
            <p className="text-2xl font-bold">{campaignsData?.total ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-orange-500 rounded-xl"><Users className="w-5 h-5 text-white" /></div>
          <div>
            <p className="text-sm text-gray-500">By Email</p>
            <p className="text-2xl font-bold">
              {statsData?.by_channel?.find((c: { channel: string }) => c.channel === 'email')?.count ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* New Campaign Form */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">New Campaign</h2>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Campaign Name *</label>
            <input
              type="text"
              value={campaignForm.name}
              onChange={(e) => setCampaignForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Q3 Epoxy Outreach"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Industry Filter</label>
            <input
              type="text"
              value={campaignForm.industry}
              onChange={(e) => setCampaignForm((f) => ({ ...f, industry: e.target.value }))}
              placeholder="epoxy"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Lead Score</label>
            <input
              type="number"
              value={campaignForm.min_score}
              onChange={(e) => setCampaignForm((f) => ({ ...f, min_score: e.target.value }))}
              min={0}
              max={100}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template</label>
            <select
              value={campaignForm.template}
              onChange={(e) => setCampaignForm((f) => ({ ...f, template: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="default">Default</option>
              <option value="followup">Follow-up</option>
            </select>
          </div>
        </div>
        <button onClick={handleCreateCampaign} disabled={creating} className="btn-primary">
          <Send className="w-4 h-4" />
          {creating ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="card overflow-hidden p-0">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Campaigns</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Name', 'Industry', 'Min Score', 'Targets', 'Sent', 'Status', 'Created'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {campaignsData?.campaigns?.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No campaigns yet</td></tr>
            ) : (
              campaignsData?.campaigns?.map((c: Record<string, string | number>) => (
                <tr key={c.id as string} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.name as string}</td>
                  <td className="px-4 py-3 text-gray-600">{(c.industry as string) || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.min_score as number}</td>
                  <td className="px-4 py-3 text-gray-600">{c.target_count as number}</td>
                  <td className="px-4 py-3 text-gray-600">{c.sent_count as number}</td>
                  <td className="px-4 py-3"><span className="badge badge-blue">{c.status as string}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(c.created_at as string).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
