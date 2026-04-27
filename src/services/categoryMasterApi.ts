import { apiUrl, getBearerToken } from '../lib/apiConfig'
import type { CategoryMaster, SubCategoryMaster } from '../types/categoryMaster'

function authHeaders(): HeadersInit {
  const token = getBearerToken()
  const h: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

// ── Category ──────────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<CategoryMaster[]> {
  const res = await fetch(apiUrl('/api/v1/category-master/'), { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed to load categories (${res.status})`)
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected response')
  return data as CategoryMaster[]
}

export async function createCategory(body: { category_name: string; description?: string; is_active?: boolean }): Promise<CategoryMaster> {
  const res = await fetch(apiUrl('/api/v1/category-master/'), {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(t || `Create failed (${res.status})`) }
  return res.json() as Promise<CategoryMaster>
}

export async function updateCategory(id: number, body: Partial<{ category_name: string; description: string; is_active: boolean }>): Promise<CategoryMaster> {
  const res = await fetch(apiUrl(`/api/v1/category-master/${id}/`), {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(t || `Update failed (${res.status})`) }
  return res.json() as Promise<CategoryMaster>
}

// ── Sub-Category ──────────────────────────────────────────────────────────────

export async function fetchSubCategories(categoryId?: number): Promise<SubCategoryMaster[]> {
  const qs = categoryId ? `?category_id=${categoryId}` : ''
  const res = await fetch(apiUrl(`/api/v1/category-master/sub-category/all${qs}`), { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed to load sub-categories (${res.status})`)
  const data: unknown = await res.json()
  if (!Array.isArray(data)) throw new Error('Unexpected response')
  return data as SubCategoryMaster[]
}

export async function createSubCategory(body: { sub_category_name: string; category_id: number; description?: string; is_active?: boolean }): Promise<SubCategoryMaster> {
  const res = await fetch(apiUrl('/api/v1/category-master/sub-category'), {
    method: 'POST', headers: authHeaders(), body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(t || `Create failed (${res.status})`) }
  return res.json() as Promise<SubCategoryMaster>
}

export async function updateSubCategory(id: number, body: Partial<{ sub_category_name: string; category_id: number; description: string; is_active: boolean }>): Promise<SubCategoryMaster> {
  const res = await fetch(apiUrl(`/api/v1/category-master/sub-category/${id}/`), {
    method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(t || `Update failed (${res.status})`) }
  return res.json() as Promise<SubCategoryMaster>
}
