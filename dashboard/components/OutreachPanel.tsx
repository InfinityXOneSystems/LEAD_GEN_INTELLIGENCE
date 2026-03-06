"use client";

import { useState } from "react";
import { IconMail, IconX } from "@/components/Icons";

const CAMPAIGNS = [
  {
    id: 1,
    name: "Flooring Partnership Intro",
    status: "Active",
    sent: 145,
    opened: 87,
    replied: 23,
    created: "2 days ago",
  },
  {
    id: 2,
    name: "Epoxy Contractors Ohio",
    status: "Completed",
    sent: 89,
    opened: 54,
    replied: 12,
    created: "5 days ago",
  },
  {
    id: 3,
    name: "Follow-up Sequence #3",
    status: "Draft",
    sent: 0,
    opened: 0,
    replied: 0,
    created: "1 day ago",
  },
];

const RECENT_ACTIVITY = [
  {
    time: "14:52",
    action: "Email opened",
    company: "Elite Flooring LLC",
    detail: "Subject: Partnership Opportunity",
  },
  {
    time: "14:30",
    action: "Reply received",
    company: "ProCoat Industrial",
    detail: "Interested in demo call",
  },
  {
    time: "13:15",
    action: "Email sent",
    company: "Midwest Floor Pros",
    detail: "Follow-up #2 delivered",
  },
  {
    time: "11:42",
    action: "Email opened",
    company: "Great Lakes Flooring",
    detail: "First open, 3rd attempt",
  },
  {
    time: "10:00",
    action: "Bounce",
    company: "Old Email Address Inc",
    detail: "Invalid recipient address",
  },
];

const TEMPLATE = `Subject: Partnership Opportunity — {{company_name}}

Hi {{contact_name}},

I came across {{company_name}} while researching top flooring contractors in {{city}}. 
Your {{rating}}-star rating and {{reviews}} reviews really stand out.

We help flooring contractors like you connect with more qualified commercial clients. 
I'd love to schedule a quick 15-minute call to share how we've helped similar businesses 
grow their pipeline.

Are you available this week?

Best regards,
XPS Lead Intelligence Team`;

export default function OutreachPanel() {
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [targetTier, setTargetTier] = useState("HOT");

  const totalSent = CAMPAIGNS.reduce((s, c) => s + c.sent, 0);
  const totalOpened = CAMPAIGNS.reduce((s, c) => s + c.opened, 0);
  const totalReplied = CAMPAIGNS.reduce((s, c) => s + c.replied, 0);
  const openRate =
    totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const replyRate =
    totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0;

  const statusClass = (s: string) => {
    if (s === "Active") return "status-active";
    if (s === "Completed") return "status-idle";
    return "text-yellow-400 bg-yellow-400/10 border border-yellow-400/30";
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Outreach Management</h2>
        <button
          onClick={() => setShowNewCampaign(true)}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold rounded-lg transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Emails Sent", value: totalSent, color: "text-white" },
          {
            label: "Open Rate",
            value: `${openRate}%`,
            color: "text-yellow-400",
          },
          {
            label: "Reply Rate",
            value: `${replyRate}%`,
            color: "text-green-400",
          },
          {
            label: "Campaigns",
            value: CAMPAIGNS.length,
            color: "text-blue-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-4 card-hover text-center"
          >
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#2a2a2a]">
          <h3 className="text-sm font-semibold text-white">Campaigns</h3>
        </div>
        <div className="divide-y divide-[#1a1a1a]">
          {CAMPAIGNS.map((camp) => (
            <div
              key={camp.id}
              className="px-5 py-4 hover:bg-[#111111] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white">
                    {camp.name}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${statusClass(camp.status)}`}
                  >
                    {camp.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">{camp.created}</span>
              </div>
              <div className="flex gap-6 text-xs text-gray-500">
                <span>
                  Sent: <span className="text-white">{camp.sent}</span>
                </span>
                <span>
                  Opened:{" "}
                  <span className="text-yellow-400">
                    {camp.sent > 0
                      ? `${Math.round((camp.opened / camp.sent) * 100)}%`
                      : "—"}
                  </span>
                </span>
                <span>
                  Replied:{" "}
                  <span className="text-green-400">
                    {camp.sent > 0
                      ? `${Math.round((camp.replied / camp.sent) * 100)}%`
                      : "—"}
                  </span>
                </span>
              </div>
              {camp.sent > 0 && (
                <div className="mt-2 w-full bg-[#2a2a2a] rounded-full h-1">
                  <div
                    className="bg-yellow-400 h-1 rounded-full"
                    style={{
                      width: `${Math.round((camp.opened / camp.sent) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity + Template Preview side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">
            Recent Activity
          </h3>
          <div className="space-y-2">
            {RECENT_ACTIVITY.map((a, i) => (
              <div
                key={i}
                className="flex items-start gap-3 py-1.5 border-b border-[#1a1a1a] last:border-0"
              >
                <span className="text-xs text-gray-500 w-10 flex-shrink-0">
                  {a.time}
                </span>
                <div>
                  <span
                    className={`text-xs font-medium ${
                      a.action === "Reply received"
                        ? "text-green-400"
                        : a.action === "Bounce"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    {a.action}
                  </span>
                  <span className="text-xs text-white mx-1">·</span>
                  <span className="text-xs text-white">{a.company}</span>
                  <div className="text-xs text-gray-500">{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Preview */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Email Template</h3>
            <button
              onClick={() => setShowTemplate(!showTemplate)}
              className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              {showTemplate ? "Hide" : "Preview"}
            </button>
          </div>
          {showTemplate ? (
            <pre className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed text-[11px]">
              {TEMPLATE}
            </pre>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#111111] rounded-lg">
                <span className="text-yellow-400/70">
                  <IconMail className="w-6 h-6" />
                </span>
                <div>
                  <div className="text-sm text-white font-medium">
                    Flooring Partnership Intro v2
                  </div>
                  <div className="text-xs text-gray-500">
                    Template with dynamic variables
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  Variables:{" "}
                  <span className="text-yellow-400">
                    company_name, contact_name, city, rating, reviews
                  </span>
                </div>
                <div>
                  Personalization: <span className="text-green-400">High</span>
                </div>
                <div>
                  Subject line A/B:{" "}
                  <span className="text-blue-400">Enabled</span>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 text-center py-2 bg-[#1a1a1a] rounded-lg text-xs text-gray-400">
                  Follow-up 1: <span className="text-white">+3 days</span>
                </div>
                <div className="flex-1 text-center py-2 bg-[#1a1a1a] rounded-lg text-xs text-gray-400">
                  Follow-up 2: <span className="text-white">+7 days</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Campaign Modal */}
      {showNewCampaign && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                Create New Campaign
              </h3>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:text-white hover:bg-[#2a2a2a] transition-colors"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Campaign Name
                </label>
                <input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Ohio Epoxy Contractors Q1"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-yellow-400/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Target Tier
                </label>
                <select
                  value={targetTier}
                  onChange={(e) => setTargetTier(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-400/50 transition-colors"
                >
                  <option>HOT</option>
                  <option>WARM</option>
                  <option>ALL</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNewCampaign(false)}
                className="flex-1 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewCampaign(false)}
                className="flex-1 py-2 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-bold rounded-lg transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
