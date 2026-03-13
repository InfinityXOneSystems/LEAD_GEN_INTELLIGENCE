/**
 * leadsApi.ts — XPS Intelligence Frontend Lead API Client
 *
 * Connects to https://xps-intelligence.up.railway.app/api
 * Response normalization: unwraps {leads:[], total} envelope and maps
 * shadow-scraper schema → frontend Lead type.
 *
 * Fallback: when the Railway API is unreachable, loads from
 * /data/leads.json (static file in public/) which is updated by
 * the enterprise lead pipeline on every scrape cycle.
 */

import { api } from './api'
import type { Lead, DashboardMetrics, ScraperConfig, ScraperLog } from '@/types/lead'

// ── Lead type mapping helpers ─────────────────────────────────────────────────

type RawLead = {
  id?: string | number
  company?: string
  company_name?: string
  city?: string
  state?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  rating?: string | number   // could be LeadRating or raw number from scraper
  opportunityScore?: number
  lead_score?: number
  score?: number
  tier?: string
  status?: string
  industry?: string
  category?: string
  source?: string
  date_scraped?: string
  scrapedAt?: string
  createdAt?: string
  isNew?: boolean
  notes?: string
}

function tierToRating(tier: string, score: number): Lead['rating'] {
  const t = (tier || '').toLowerCase()
  if (score >= 85 || t === 'hot') return 'A+'
  if (score >= 70)               return 'A'
  if (score >= 55 || t === 'warm') return 'B+'
  if (score >= 40)               return 'B'
  if (score >= 25)               return 'C'
  return 'D'
}

function toLeadStatus(raw: string): Lead['status'] {
  const s = (raw || '').toLowerCase()
  if (['contacted', 'qualified', 'proposal', 'signed', 'lost'].includes(s)) {
    return s as Lead['status']
  }
  return 'new'
}

/** Normalize a raw API record → frontend Lead type */
function normalise(r: RawLead, idx: number): Lead {
  // Already has frontend shape (pre-normalized by server or public/data/leads.json)
  if (r.rating && typeof r.rating === 'string' && r.rating.match(/^[A-D][+]?$/)) {
    return {
      id:              String(r.id ?? idx),
      company:         (r.company || r.company_name || 'Unknown').trim(),
      city:            (r.city || '').trim(),
      state:           r.state || '',
      phone:           (r.phone || '').trim(),
      email:           (r.email || '').trim(),
      website:         r.website || '',
      address:         r.address || '',
      rating:          r.rating as Lead['rating'],
      opportunityScore: r.opportunityScore ?? r.lead_score ?? r.score ?? 0,
      status:          toLeadStatus(r.status || ''),
      category:        r.category || r.industry || '',
      createdAt:       r.createdAt || r.date_scraped || r.scrapedAt || new Date().toISOString(),
      isNew:           r.isNew ?? (r.status === 'new'),
      notes:           r.notes || '',
    }
  }

  // Raw scraper record — needs normalization
  const score = Number(r.lead_score ?? r.score ?? 0) || 0
  const tier  = (r.tier || (score >= 75 ? 'hot' : score >= 50 ? 'warm' : 'cold')).toLowerCase()
  const created = r.date_scraped || r.scrapedAt || r.createdAt || new Date().toISOString()

  return {
    id:              String(r.id ?? idx),
    company:         (r.company || r.company_name || 'Unknown').trim(),
    city:            (r.city || '').trim(),
    state:           r.state || '',
    phone:           (r.phone || '').trim(),
    email:           (r.email || '').trim(),
    website:         r.website || '',
    address:         r.address || '',
    rating:          tierToRating(tier, score),
    opportunityScore: score,
    status:          toLeadStatus(r.status || ''),
    category:        (r.industry || r.category || 'General Contractor').trim(),
    createdAt:       created,
    isNew:           true,
    notes:           '',
  }
}

/** Unwrap the envelope returned by Express /api/leads: {leads:[], total} or plain [] */
function unwrap(raw: unknown): RawLead[] {
  if (Array.isArray(raw)) return raw as RawLead[]
  const obj = raw as Record<string, unknown>
  if (Array.isArray(obj.leads))  return obj.leads as RawLead[]
  if (Array.isArray(obj.data))   return obj.data as RawLead[]
  return []
}

// ── Static fallback ────────────────────────────────────────────────────────────

async function loadStaticFallback(): Promise<Lead[]> {
  try {
    const res = await fetch('/data/leads.json')
    if (!res.ok) return []
    const raw: unknown = await res.json()
    const list = unwrap(raw)
    return list.map(normalise)
  } catch {
    return []
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

export const leadsApi = {
  async getAll(): Promise<Lead[]> {
    try {
      const raw = await api.get<unknown>('/leads?limit=500')
      const list = unwrap(raw)
      if (list.length > 0) return list.map(normalise)
    } catch (err) {
      console.warn('[leadsApi] Railway API unavailable, loading static fallback:', err)
    }
    return loadStaticFallback()
  },

  async getById(id: string): Promise<Lead> {
    const raw = await api.get<RawLead>(`/leads/${encodeURIComponent(id)}`)
    return normalise(raw, 0)
  },

  async create(lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> {
    return api.post<Lead>('/leads', lead)
  },

  async update(id: string, lead: Partial<Lead>): Promise<Lead> {
    return api.put<Lead>(`/leads/${id}`, lead)
  },

  async delete(id: string): Promise<void> {
    return api.delete<void>(`/leads/${id}`)
  },

  async getMetrics(): Promise<DashboardMetrics> {
    try {
      return await api.get<DashboardMetrics>('/leads/metrics')
    } catch {
      // Compute from static fallback
      const leads = await loadStaticFallback()
      const aPlus = leads.filter(l => l.rating === 'A+').length
      return {
        totalLeads:        leads.length,
        aPlusOpportunities: aPlus,
        emailsSent:        0,
        responseRate:      0,
        revenuePipeline:   aPlus * 5000,
      }
    }
  },

  async assignRep(leadId: string, repId: string, repName: string, repInitials: string): Promise<Lead> {
    return api.post<Lead>(`/leads/${leadId}/assign`, { repId, repName, repInitials })
  },

  async updateStatus(leadId: string, status: Lead['status']): Promise<Lead> {
    return api.put<Lead>(`/leads/${leadId}/status`, { status })
  },

  async addNote(leadId: string, note: string): Promise<Lead> {
    return api.post<Lead>(`/leads/${leadId}/notes`, { note })
  },
}

export const scraperApi = {
  async run(config: ScraperConfig): Promise<{ jobId: string }> {
    return api.post<{ jobId: string }>('/scraper/run', config)
  },

  async getStatus(jobId: string): Promise<ScraperLog> {
    return api.get<ScraperLog>(`/scraper/status/${jobId}`)
  },

  async getLogs(limit = 50): Promise<ScraperLog[]> {
    return api.get<ScraperLog[]>(`/scraper/logs?limit=${limit}`)
  },

  async cancel(jobId: string): Promise<void> {
    return api.post<void>(`/scraper/cancel/${jobId}`, {})
  },
}
