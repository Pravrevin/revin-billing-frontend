import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { ItemMaster, ItemMasterPatchFields } from '../types/itemMaster'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

export async function fetchItemMasters(): Promise<ItemMaster[]> {
  const res = await fetch(apiUrl('/api/v1/item-master/'), {
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Failed to load items (${res.status})`)
  }
  const data: unknown = await res.json()
  if (!Array.isArray(data)) {
    throw new Error('Unexpected API response: expected an array')
  }
  return data as ItemMaster[]
}

/**
 * PATCH: `item_id` is always set last (mandatory). Pass any subset of editable fields;
 * the body is `{ ...fields, item_id: id }` so you can send one field or many.
 */
export async function updateItemMaster(
  id: number,
  fields: Partial<ItemMasterPatchFields>,
): Promise<ItemMaster> {
  // No trailing slash — avoids a 307 redirect that strips auth on the cross-origin hop.
  const url = apiUrl(`/api/v1/item-master/${id}`)
  const body = { ...fields, item_id: id }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Update failed (${res.status})`)
  }
  return res.json() as Promise<ItemMaster>
}

export async function createItemMaster(body: Record<string, unknown>): Promise<ItemMaster> {
  const res = await fetch(apiUrl('/api/v1/item-master/'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Create failed (${res.status})`)
  }
  return res.json() as Promise<ItemMaster>
}
