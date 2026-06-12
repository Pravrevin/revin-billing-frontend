import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { ExtractedBill, Purchase } from '../types/purchase'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

function normalizePurchaseList(data: unknown): Purchase[] {
  if (Array.isArray(data)) return data as Purchase[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.results)) return o.results as Purchase[]
    if (Array.isArray(o.data)) return o.data as Purchase[]
    if (Array.isArray(o.purchases)) return o.purchases as Purchase[]
  }
  throw new Error('Unexpected purchases response shape')
}

function normalizePurchaseOne(data: unknown): Purchase {
  if (data && typeof data === 'object' && 'id' in data) return data as Purchase
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (o.data && typeof o.data === 'object' && o.data !== null && 'id' in o.data) {
      return o.data as Purchase
    }
  }
  throw new Error('Unexpected purchase response shape')
}

export async function fetchPurchasesByPartyId(partyId: number): Promise<Purchase[]> {
  const q = new URLSearchParams({ supplier_id: String(partyId) })
  const res = await fetch(apiUrl(`/api/v1/purchases/?${q.toString()}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load purchases (${res.status})`)
  }
  const data: unknown = await res.json()
  return normalizePurchaseList(data)
}

export async function fetchAllPurchases(params?: {
  party_id?: number
  party_type?: string
  payment_status?: string
  limit?: number
}): Promise<Purchase[]> {
  const q = new URLSearchParams()
  if (params?.party_id) q.set('party_id', String(params.party_id))
  if (params?.party_type) q.set('party_type', params.party_type)
  if (params?.payment_status) q.set('payment_status', params.payment_status)
  if (params?.limit != null) q.set('limit', String(params.limit))
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const res = await fetch(apiUrl(`/api/v1/purchases/${suffix}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load purchases (${res.status})`)
  }
  const data: unknown = await res.json()
  return normalizePurchaseList(data)
}

export async function fetchPurchaseById(id: number): Promise<Purchase> {
  // No trailing slash: the backend route is /purchases/{id}. A trailing slash
  // triggers a 307 redirect to an absolute backend URL, and browsers strip the
  // Authorization header on that cross-origin hop → 401 (View invoice broke).
  const res = await fetch(apiUrl(`/api/v1/purchases/${id}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load purchase (${res.status})`)
  }
  const data: unknown = await res.json()
  return normalizePurchaseOne(data)
}

/**
 * Upload a supplier bill (one PDF, one image, or several images) and let the
 * AI extract a purchase-entry prefill. Slow — OCR + LLM can take 20–60s.
 */
export async function extractBill(files: File[]): Promise<ExtractedBill> {
  const token = getBearerToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  // NB: do NOT set Content-Type — the browser adds the multipart boundary.
  const form = new FormData()
  for (const f of files) form.append('files', f)
  const res = await fetch(apiUrl('/api/v1/purchases/extract-bill'), {
    method: 'POST',
    headers,
    body: form,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Bill extraction failed (${res.status})`)
  }
  return res.json() as Promise<ExtractedBill>
}

export async function createPurchase(payload: unknown): Promise<Purchase> {
  const res = await fetch(apiUrl('/api/v1/purchases/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to create purchase (${res.status})`)
  }
  const data: unknown = await res.json()
  return normalizePurchaseOne(data)
}
