import { apiUrl, getBearerToken } from '../lib/apiConfig'

export type PermissionItem = { menu_id: number; sub_id: number | null }

export type PharmacyBrief = { id: number; name: string; code?: string | null }

export type UserInfo = {
  id: number
  username: string
  full_name?: string | null
  role: string
  pharmacy?: PharmacyBrief | null
}

export type LoginResult = {
  access_token: string
  token_type: string
  user: UserInfo
  permissions: PermissionItem[]
}

export type MeResult = {
  user: UserInfo
  permissions: PermissionItem[]
}

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function loginRequest(username: string, password: string): Promise<LoginResult> {
  const res = await fetch(apiUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    let msg = `Login failed (${res.status})`
    try {
      const data = await res.json()
      if (data?.detail) msg = data.detail
    } catch {
      /* ignore */
    }
    throw new Error(msg)
  }
  return res.json() as Promise<LoginResult>
}

export async function fetchMe(): Promise<MeResult> {
  const res = await fetch(apiUrl('/api/v1/auth/me'), { headers: authHeaders() })
  if (!res.ok) throw new Error(`Session check failed (${res.status})`)
  return res.json() as Promise<MeResult>
}

/** Fire-and-forget menu open log used for admin usage insights. */
export function logMenuAccess(menuId: number, subId: number | null): void {
  void fetch(apiUrl('/api/v1/auth/log-access'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ menu_id: menuId, sub_id: subId }),
  }).catch(() => {
    /* best-effort; never block navigation */
  })
}
