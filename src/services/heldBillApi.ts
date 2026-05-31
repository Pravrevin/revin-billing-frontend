import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { HeldBill, HeldBillCreate } from '../types/heldBill'

function authHeaders(json = true): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (json) h['Content-Type'] = 'application/json'
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function asJson<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`${what} failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<T>
}

/** Park an in-progress bill (draft — no stock effect). */
export async function holdBill(body: HeldBillCreate): Promise<HeldBill> {
  const res = await fetch(apiUrl('/api/v1/held-bills/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return asJson<HeldBill>(res, 'Hold bill')
}

export async function fetchHeldBills(): Promise<HeldBill[]> {
  const res = await fetch(apiUrl('/api/v1/held-bills/'), { headers: authHeaders(false) })
  return asJson<HeldBill[]>(res, 'Load held bills')
}

export async function deleteHeldBill(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/held-bills/${id}`), { method: 'DELETE', headers: authHeaders(false) })
  if (!res.ok && res.status !== 204) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Discard held bill failed (${res.status}): ${detail}`)
  }
}
