import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { StockExpiryRow, StockLedgerEntry, StockMaster, StockMasterPatchFields } from '../types/stockMaster'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchStockMasters(): Promise<StockMaster[]> {
  const res = await fetch(apiUrl('/api/v1/stock-master/'), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load stock (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected API response: expected an array')
  }
  return data as StockMaster[]
}

/**
 * PATCH body always ends with `id` (record key from JSON). Send one field or many.
 */
export async function updateStockMaster(
  id: number,
  fields: Partial<StockMasterPatchFields>,
): Promise<StockMaster> {
  // No trailing slash — avoids a 307 redirect that strips auth on the cross-origin hop.
  const url = apiUrl(`/api/v1/stock-master/${id}`)
  const body = { ...fields, id }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Update failed (${res.status})`)
  }
  return res.json() as Promise<StockMaster>
}

export async function fetchStockLedger(params?: {
  item_id?: number
  batch_no?: string
  movement_type?: string
  reference_type?: string
}): Promise<StockLedgerEntry[]> {
  const q = new URLSearchParams()
  if (params?.item_id != null) q.set('item_id', String(params.item_id))
  if (params?.batch_no) q.set('batch_no', params.batch_no)
  if (params?.movement_type) q.set('movement_type', params.movement_type)
  if (params?.reference_type) q.set('reference_type', params.reference_type)
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const res = await fetch(apiUrl(`/api/v1/stock-master/ledger${suffix}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load stock ledger (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected stock-ledger response')
  return data as StockLedgerEntry[]
}

export async function fetchStockExpiry(
  mode: 'all' | 'near' | 'expired' = 'all',
  withinDays = 30,
): Promise<StockExpiryRow[]> {
  const q = new URLSearchParams({ mode, within_days: String(withinDays) })
  const res = await fetch(apiUrl(`/api/v1/stock-master/expiry?${q.toString()}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load expiry data (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected expiry response')
  return data as StockExpiryRow[]
}

export async function createStockMaster(body: Record<string, unknown>): Promise<StockMaster> {
  const res = await fetch(apiUrl('/api/v1/stock-master/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Create failed (${res.status})`)
  }
  return res.json() as Promise<StockMaster>
}
