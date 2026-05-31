import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type {
  DailyReport,
  GstReport,
  InventoryReport,
  ProfitReport,
  PurchaseReport,
  SalesReport,
} from '../types/report'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { headers: authHeaders() })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Report failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<T>
}

function rangeQuery(from?: string, to?: string): string {
  const q = new URLSearchParams()
  if (from) q.set('date_from', from)
  if (to) q.set('date_to', to)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function fetchSalesReport(from?: string, to?: string) {
  return getJson<SalesReport>(`/api/v1/reports/sales${rangeQuery(from, to)}`)
}

export function fetchPurchaseReport(from?: string, to?: string) {
  return getJson<PurchaseReport>(`/api/v1/reports/purchase${rangeQuery(from, to)}`)
}

export function fetchProfitReport(from?: string, to?: string) {
  return getJson<ProfitReport>(`/api/v1/reports/profit${rangeQuery(from, to)}`)
}

export function fetchDailyReport(day?: string) {
  const q = day ? `?day=${day}` : ''
  return getJson<DailyReport>(`/api/v1/reports/daily${q}`)
}

export function fetchGstReport(from?: string, to?: string) {
  return getJson<GstReport>(`/api/v1/reports/gst${rangeQuery(from, to)}`)
}

export function fetchInventoryReport() {
  return getJson<InventoryReport>('/api/v1/reports/inventory')
}
