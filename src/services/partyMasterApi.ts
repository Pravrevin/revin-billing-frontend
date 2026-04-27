import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { PartyMaster } from '../types/partyMaster'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export type PartyTypeParam = 'Customer' | 'Distributor'

export async function fetchPartyMasters(partyType: PartyTypeParam): Promise<PartyMaster[]> {
  const q = new URLSearchParams({ party_type: partyType })
  const res = await fetch(apiUrl(`/api/v1/party-master/?${q.toString()}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load parties (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected API response: expected an array')
  }
  return data as PartyMaster[]
}

export async function createPartyMaster(payload: Record<string, unknown>): Promise<PartyMaster> {
  const res = await fetch(apiUrl('/api/v1/party-master/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to create supplier (${res.status})`)
  }
  return res.json() as Promise<PartyMaster>
}
