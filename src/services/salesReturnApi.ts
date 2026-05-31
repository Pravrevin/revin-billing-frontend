import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { Returnable, SalesReturn, SalesReturnCreate } from '../types/salesReturn'

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

/** Returnable (per-line) summary for a sale: sold, already returned, still returnable. */
export async function fetchReturnable(saleId: number): Promise<Returnable> {
  const res = await fetch(apiUrl(`/api/v1/sales/${saleId}/returnable`), { headers: authHeaders(false) })
  return asJson<Returnable>(res, 'Load returnable')
}

/** Record a sales return — restores stock and (optionally) refunds the customer. */
export async function createSalesReturn(body: SalesReturnCreate): Promise<SalesReturn> {
  const res = await fetch(apiUrl('/api/v1/sales-returns/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return asJson<SalesReturn>(res, 'Record return')
}

export async function fetchSalesReturns(params?: { sales_id?: number }): Promise<SalesReturn[]> {
  const q = params?.sales_id ? `?sales_id=${params.sales_id}` : ''
  const res = await fetch(apiUrl(`/api/v1/sales-returns/${q}`), { headers: authHeaders(false) })
  return asJson<SalesReturn[]>(res, 'Load returns')
}

export async function deleteSalesReturn(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/sales-returns/${id}`), { method: 'DELETE', headers: authHeaders(false) })
  if (!res.ok && res.status !== 204) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Delete return failed (${res.status}): ${detail}`)
  }
}
