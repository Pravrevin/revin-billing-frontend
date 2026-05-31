import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { LedgerEntry, OutstandingInvoice, OutstandingSale, OutstandingSummary, Payment, PaymentCreate, SupplierLedger } from '../types/payment'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function asJson<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `${what} failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

/** Record a payment (txn_type=PAYMENT against a purchase, or RECEIPT against a sale). */
export async function createPayment(body: PaymentCreate): Promise<Payment> {
  const res = await fetch(apiUrl('/api/v1/payments/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  return asJson<Payment>(res, 'Record payment')
}

/** Upload a receipt image (UPI / Card slip) and attach it to a payment. */
export async function uploadPaymentReceipt(paymentId: number, file: File): Promise<Payment> {
  const token = getBearerToken()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  // NB: do NOT set Content-Type — the browser adds the multipart boundary.
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(apiUrl(`/api/v1/payments/${paymentId}/receipt`), {
    method: 'POST',
    headers,
    body: form,
  })
  return asJson<Payment>(res, 'Upload receipt')
}

/** Full running ledger for a party (invoices as debit, payments as credit). */
export async function fetchPartyLedger(partyId: number): Promise<LedgerEntry[]> {
  const res = await fetch(apiUrl(`/api/v1/parties/${partyId}/ledger`), {
    headers: authHeaders(),
  })
  return asJson<LedgerEntry[]>(res, 'Load ledger')
}

/** Industry-standard supplier (creditor) account statement: opening, Dr/Cr rows, closing. */
export async function fetchSupplierLedger(distributorId: number): Promise<SupplierLedger> {
  const res = await fetch(apiUrl(`/api/v1/distributors/${distributorId}/ledger`), {
    headers: authHeaders(),
  })
  return asJson<SupplierLedger>(res, 'Load supplier ledger')
}

/** One-line balance snapshot for a party. */
export async function fetchPartyOutstandingSummary(partyId: number): Promise<OutstandingSummary> {
  const res = await fetch(apiUrl(`/api/v1/parties/${partyId}/outstanding-summary`), {
    headers: authHeaders(),
  })
  return asJson<OutstandingSummary>(res, 'Load summary')
}

/** Unpaid / partial purchase invoices, optionally for one supplier. */
export async function fetchPurchaseOutstanding(partyId?: number): Promise<OutstandingInvoice[]> {
  const q = partyId ? `?party_id=${partyId}` : ''
  const res = await fetch(apiUrl(`/api/v1/purchases/outstanding${q}`), {
    headers: authHeaders(),
  })
  return asJson<OutstandingInvoice[]>(res, 'Load outstanding')
}

/** Unpaid / partial sales invoices (receivables), optionally for one customer. */
export async function fetchSalesOutstanding(partyId?: number): Promise<OutstandingSale[]> {
  const q = partyId ? `?party_id=${partyId}` : ''
  const res = await fetch(apiUrl(`/api/v1/sales/outstanding${q}`), {
    headers: authHeaders(),
  })
  return asJson<OutstandingSale[]>(res, 'Load receivables')
}
