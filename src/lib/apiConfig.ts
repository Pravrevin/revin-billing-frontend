/** In dev, leave `VITE_API_BASE_URL` unset to use the Vite proxy (`/api` → backend). */
function resolveBase(): string {
  const env = import.meta.env.VITE_API_BASE_URL
  if (typeof env === 'string' && env.trim()) {
    return env.replace(/\/$/, '')
  }
  if (import.meta.env.DEV) return ''
  return 'http://localhost:8000'
}

const base = resolveBase()

/** sessionStorage key holding the JWT issued by /auth/login. */
export const TOKEN_KEY = 'revin-bill-token'

/**
 * Bearer token for API calls — the JWT saved at login. Every service funnels
 * through here, so storing the token is all that's needed to authenticate them.
 */
export function getBearerToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setBearerToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* ignore */
  }
}

export function clearBearerToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/**
 * On a 401 the token is stale/invalid — clear it and bounce to /login.
 * Services can call this in their error path; the AppLayout also guards routes.
 */
export function handleUnauthorized(): void {
  clearBearerToken()
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}
