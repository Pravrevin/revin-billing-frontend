import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { StockMaster, StockMasterPatchFields } from '../types/stockMaster'

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
  const url = apiUrl(`/api/v1/stock-master/${id}/`)
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
