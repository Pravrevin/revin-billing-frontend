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

export type GstLookupResult = {
  gstin: string
  pan_card?: string | null
  party_name?: string | null
  address?: string | null
  state?: string | null
  city?: string | null
  pincode?: string | null
  status?: string | null
  /** "appyflow" when full details were fetched, "derived" when only state/PAN are known. */
  source: string
}

export async function lookupGstin(gstin: string): Promise<GstLookupResult> {
  const res = await fetch(apiUrl(`/api/v1/party-master/gst-lookup/${encodeURIComponent(gstin)}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    let detail = `GST lookup failed (${res.status})`
    try {
      const body = (await res.json()) as { detail?: string }
      if (body?.detail) detail = body.detail
    } catch {
      /* keep default */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<GstLookupResult>
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
