import { apiUrl, getBearerToken } from '../lib/apiConfig'

export type AssistantSource = { kind: string; text: string; score: number }
export type AssistantAnswer = {
  answer: string
  sources: AssistantSource[]
  context_used: number
  indexed: boolean
}
export type AssistantStatus = { indexed: boolean; documents: number; built_at: string | null }

function authHeaders(json = true): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json' }
  if (json) h['Content-Type'] = 'application/json'
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function askAssistant(question: string): Promise<AssistantAnswer> {
  const res = await fetch(apiUrl('/api/v1/assistant/ask'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ question }),
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Ask failed (${res.status}): ${detail}`)
  }
  return res.json() as Promise<AssistantAnswer>
}

export async function reindexAssistant(): Promise<{ indexed: boolean; documents: number; built_at: string }> {
  const res = await fetch(apiUrl('/api/v1/assistant/reindex'), { method: 'POST', headers: authHeaders(false) })
  if (!res.ok) {
    const detail = await res.text().catch(() => res.statusText)
    throw new Error(`Reindex failed (${res.status}): ${detail}`)
  }
  return res.json()
}

export async function assistantStatus(): Promise<AssistantStatus> {
  const res = await fetch(apiUrl('/api/v1/assistant/status'), { headers: authHeaders(false) })
  if (!res.ok) throw new Error(`Status failed (${res.status})`)
  return res.json() as Promise<AssistantStatus>
}
