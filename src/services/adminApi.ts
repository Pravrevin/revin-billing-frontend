import { apiUrl, getBearerToken, handleUnauthorized } from '../lib/apiConfig'
import type { PermissionItem } from './authApi'

export type Pharmacy = {
  id: number
  name: string
  code?: string | null
  address?: string | null
  phone?: string | null
  is_active: boolean
  user_count: number
}

export type AdminUser = {
  id: number
  pharmacy_id: number | null
  username: string
  full_name?: string | null
  role: string
  is_active: boolean
}

export type PharmacyMetrics = {
  sales_total: number
  sales_count: number
  purchase_total: number
  expense_total: number
  item_count: number
  user_count: number
}

export type MenuUsage = { menu_id: number; sub_id: number | null; hits: number }

export type GlobalInsights = {
  pharmacy_count: number
  active_pharmacy_count: number
  totals: { sales_total: number; purchase_total: number; sales_count: number }
  per_pharmacy: Array<{ id: number; name: string; is_active: boolean } & PharmacyMetrics>
  top_menus: MenuUsage[]
}

export type PharmacyInsights = {
  id: number
  name: string
  is_active: boolean
  metrics: PharmacyMetrics
  top_menus: MenuUsage[]
}

function headers(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), { ...init, headers: headers() })
  if (res.status === 401) {
    handleUnauthorized()
    throw new Error('Session expired. Please log in again.')
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.detail) msg = data.detail
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── pharmacies ──────────────────────────────────────────────────────────────

export const listPharmacies = () => req<Pharmacy[]>('/api/v1/admin/pharmacies')

export const getPharmacy = (id: number) =>
  req<Pharmacy>(`/api/v1/admin/pharmacies/${id}`)

export const createPharmacy = (body: {
  name: string
  code?: string
  address?: string
  phone?: string
}) =>
  req<Pharmacy>('/api/v1/admin/pharmacies', {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const updatePharmacy = (id: number, body: Partial<Pharmacy>) =>
  req<Pharmacy>(`/api/v1/admin/pharmacies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

// ── users ─────────────────────────────────────────────────────────────────────

export const listPharmacyUsers = (pharmacyId: number) =>
  req<AdminUser[]>(`/api/v1/admin/pharmacies/${pharmacyId}/users`)

export const createUser = (
  pharmacyId: number,
  body: {
    username: string
    password: string
    full_name?: string
    permissions?: PermissionItem[]
  },
) =>
  req<AdminUser>(`/api/v1/admin/pharmacies/${pharmacyId}/users`, {
    method: 'POST',
    body: JSON.stringify(body),
  })

export const updateUser = (
  userId: number,
  body: { full_name?: string; password?: string; is_active?: boolean },
) =>
  req<AdminUser>(`/api/v1/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })

// ── permissions ──────────────────────────────────────────────────────────────

export const getUserPermissions = (userId: number) =>
  req<PermissionItem[]>(`/api/v1/admin/users/${userId}/permissions`)

export const setUserPermissions = (userId: number, permissions: PermissionItem[]) =>
  req<PermissionItem[]>(`/api/v1/admin/users/${userId}/permissions`, {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  })

// ── insights ──────────────────────────────────────────────────────────────────

export const globalInsights = () => req<GlobalInsights>('/api/v1/admin/insights')

export const pharmacyInsights = (id: number) =>
  req<PharmacyInsights>(`/api/v1/admin/pharmacies/${id}/insights`)
