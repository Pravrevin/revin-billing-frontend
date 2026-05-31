import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { PaymentMode } from '../types/payment'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchPaymentModes(activeOnly = true): Promise<PaymentMode[]> {
  const suffix = activeOnly ? '?is_active=true' : ''
  const res = await fetch(apiUrl(`/api/v1/payment-modes/${suffix}`), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load payment modes (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected payment-modes response')
  return data as PaymentMode[]
}
