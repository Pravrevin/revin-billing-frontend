import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { Sale } from '../types/sales'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function createSale(payload: unknown): Promise<Sale> {
  const res = await fetch(apiUrl('/api/v1/sales/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Create sale failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<Sale>
}

export async function fetchAllSales(): Promise<Sale[]> {
  const res = await fetch(apiUrl('/api/v1/sales/?limit=200'), {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to load sales (${res.status})`)
  const data = await res.json()
  if (Array.isArray(data)) return data as Sale[]
  if (data && typeof data === 'object') {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.results)) return o.results as Sale[]
    if (Array.isArray(o.data)) return o.data as Sale[]
  }
  throw new Error('Unexpected sales response shape')
}
