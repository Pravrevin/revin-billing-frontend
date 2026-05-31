import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type {
  AccountsOverview,
  CashBankBook,
  DayBook,
  Expense,
  ExpenseCreate,
  SupplierWise,
} from '../types/account'
import type { Payment } from '../types/payment'

function authHeaders(json = true): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (json) h['Content-Type'] = 'application/json'
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { headers: authHeaders(false) })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Request failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<T>
}

function rangeQuery(from?: string, to?: string): string {
  const q = new URLSearchParams()
  if (from) q.set('date_from', from)
  if (to) q.set('date_to', to)
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function fetchAccountsOverview() {
  return getJson<AccountsOverview>('/api/v1/accounts/overview')
}

export function fetchCashBook(from?: string, to?: string) {
  return getJson<CashBankBook>(`/api/v1/accounts/cash-book${rangeQuery(from, to)}`)
}

export function fetchBankBook(from?: string, to?: string) {
  return getJson<CashBankBook>(`/api/v1/accounts/bank-book${rangeQuery(from, to)}`)
}

export function fetchDayBook(day?: string) {
  return getJson<DayBook>(`/api/v1/accounts/day-book${day ? `?day=${day}` : ''}`)
}

export function fetchSupplierWise() {
  return getJson<SupplierWise>('/api/v1/accounts/supplier-wise')
}

// ── Payments history ──────────────────────────────────────────────────────────

export function fetchPayments(params?: {
  txn_type?: 'RECEIPT' | 'PAYMENT'
  date_from?: string
  date_to?: string
  party_id?: number
}): Promise<Payment[]> {
  const q = new URLSearchParams()
  if (params?.txn_type) q.set('txn_type', params.txn_type)
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to) q.set('date_to', params.date_to)
  if (params?.party_id != null) q.set('party_id', String(params.party_id))
  const s = q.toString()
  return getJson<Payment[]>(`/api/v1/payments/${s ? `?${s}` : ''}`)
}

// ── Expenses ────────────────────────────────────────────────────────────────

export function fetchExpenses(params?: { date_from?: string; date_to?: string; category?: string }): Promise<Expense[]> {
  const q = new URLSearchParams()
  if (params?.date_from) q.set('date_from', params.date_from)
  if (params?.date_to) q.set('date_to', params.date_to)
  if (params?.category) q.set('category', params.category)
  const s = q.toString()
  return getJson<Expense[]>(`/api/v1/expenses/${s ? `?${s}` : ''}`)
}

export function fetchExpenseCategories() {
  return getJson<string[]>('/api/v1/expenses/categories')
}

export async function createExpense(body: ExpenseCreate): Promise<Expense> {
  const res = await fetch(apiUrl('/api/v1/expenses/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Save expense failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<Expense>
}

export async function deleteExpense(id: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/v1/expenses/${id}`), {
    method: 'DELETE',
    headers: authHeaders(false),
  })
  if (!res.ok && res.status !== 204) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Delete expense failed (${res.status}): ${detail}`)
  }
}
