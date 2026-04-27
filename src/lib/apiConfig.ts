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

/** Bearer token for API calls. Set `VITE_API_BEARER_TOKEN` in `.env.local`. */
export function getBearerToken(): string {
  const t = import.meta.env.VITE_API_BEARER_TOKEN
  return typeof t === 'string' ? t.trim() : ''
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
