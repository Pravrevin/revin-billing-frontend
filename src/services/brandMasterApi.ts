import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { BrandMaster } from '../types/brandMaster'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchBrands(): Promise<BrandMaster[]> {
  const res = await fetch(apiUrl('/api/v1/brand-master/'), { headers: authHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load brands (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected response')
  return data as BrandMaster[]
}

export async function createBrand(body: {
  brand_name: string
  is_active: boolean
}): Promise<BrandMaster> {
  const res = await fetch(apiUrl('/api/v1/brand-master/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Create failed (${res.status})`)
  }
  return res.json() as Promise<BrandMaster>
}
