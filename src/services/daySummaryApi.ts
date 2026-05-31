import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { DaySummary } from '../types/daySummary'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchDaySummary(from: string, to: string): Promise<DaySummary> {
  const q = new URLSearchParams({ date_from: from, date_to: to })
  const res = await fetch(apiUrl(`/api/v1/sales-summary?${q.toString()}`), { headers: authHeaders() })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Day summary failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<DaySummary>
}
