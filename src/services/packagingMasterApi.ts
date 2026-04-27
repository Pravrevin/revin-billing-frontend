import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { PackagingMaster } from '../types/packagingMaster'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchPackagingMasters(): Promise<PackagingMaster[]> {
  const res = await fetch(apiUrl('/api/v1/packaging-master/'), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load packaging (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected response')
  return data as PackagingMaster[]
}

export async function createPackagingMaster(body: {
  packing_type: string
  unit_primary: string
  unit_secondary: string
  is_active: boolean
}): Promise<PackagingMaster> {
  const res = await fetch(apiUrl('/api/v1/packaging-master/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Create failed (${res.status})`)
  }
  return res.json() as Promise<PackagingMaster>
}
