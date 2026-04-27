import { useCallback, useEffect, useMemo, useState } from 'react'
import { createSubCategory, fetchCategories, fetchSubCategories, updateSubCategory } from '../services/categoryMasterApi'
import type { CategoryMaster, SubCategoryMaster } from '../types/categoryMaster'
import styles from './ProductMasterPage.module.css'

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [locked])
}

// ── Create Modal ──────────────────────────────────────────────────────────────

function CreateSubCategoryModal({ categories, onClose, onCreated }: { categories: CategoryMaster[]; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Sub-category name is required.'); return }
    if (!categoryId) { setError('Please select a parent category.'); return }
    setSaving(true); setError(null)
    try {
      await createSubCategory({ sub_category_name: name.trim(), category_id: Number(categoryId), description: description.trim() || undefined, is_active: isActive })
      onCreated(); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="create-sub-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="create-sub-title">Add Sub-Category</h2>
            <p>Code is auto-generated (SUB0001, SUB0002…)</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}
            <div className={styles.formSection}>
              <div className={styles.field}>
                <label htmlFor="sub-category-select">Parent Category *</label>
                <select id="sub-category-select" className={styles.select} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))} required>
                  <option value="">Select category…</option>
                  {categories.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{c.category_name} ({c.category_code})</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="sub-name">Sub-Category Name *</label>
                <input id="sub-name" className={styles.searchInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fever & Pain" required autoFocus />
              </div>
              <div className={styles.field}>
                <label htmlFor="sub-desc">Description</label>
                <textarea id="sub-desc" className={styles.searchInput} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={3} />
              </div>
              <div className={styles.field}>
                <label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
              </div>
            </div>
          </div>
          <div className={styles.modalFoot}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Create Sub-Category'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditSubCategoryModal({ item, categories, onClose, onSaved }: { item: SubCategoryMaster; categories: CategoryMaster[]; onClose: () => void; onSaved: (next: SubCategoryMaster) => void }) {
  const [name, setName] = useState(item.sub_category_name)
  const [categoryId, setCategoryId] = useState<number>(item.category_id)
  const [description, setDescription] = useState(item.description ?? '')
  const [isActive, setIsActive] = useState(item.is_active)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Sub-category name is required.'); return }
    setSaving(true); setError(null)
    try {
      const updated = await updateSubCategory(item.id, { sub_category_name: name.trim(), category_id: categoryId, description: description.trim() || undefined, is_active: isActive })
      onSaved(updated); onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="edit-sub-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="edit-sub-title">Edit Sub-Category</h2>
            <p>Code: {item.sub_category_code}</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}
            <div className={styles.formSection}>
              <div className={styles.field}>
                <label htmlFor="edit-sub-cat">Parent Category *</label>
                <select id="edit-sub-cat" className={styles.select} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.category_name} ({c.category_code})</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-sub-name">Sub-Category Name *</label>
                <input id="edit-sub-name" className={styles.searchInput} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-sub-desc">Description</label>
                <textarea id="edit-sub-desc" className={styles.searchInput} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className={styles.field}>
                <label><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active</label>
              </div>
            </div>
          </div>
          <div className={styles.modalFoot}>
            <button type="button" className={styles.btnGhost} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SubCategoryMasterPage() {
  const [items, setItems] = useState<SubCategoryMaster[]>([])
  const [categories, setCategories] = useState<CategoryMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [edit, setEdit] = useState<SubCategoryMaster | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useBodyScrollLock(Boolean(edit || createOpen))

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [subs, cats] = await Promise.all([fetchSubCategories(), fetchCategories()])
      setItems(subs); setCategories(cats)
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 4200) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (categoryFilter && i.category_id !== categoryFilter) return false
      if (activeFilter === 'active' && !i.is_active) return false
      if (activeFilter === 'inactive' && i.is_active) return false
      if (!q) return true
      return [i.sub_category_name, i.sub_category_code, i.category_name, i.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [items, search, categoryFilter, activeFilter])

  return (
    <div className={styles.page}>
      {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error} <button type="button" className={styles.resetLink} onClick={load}>Retry</button></div>}

      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>Sub-Category Master</h1>
          <p>Manage sub-categories linked to parent categories. Codes are auto-generated.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Add Sub-Category</button>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.field}>
            <label htmlFor="sub-search">Search</label>
            <input id="sub-search" className={styles.searchInput} placeholder="Name, code, description…" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
          </div>
          <div className={styles.field}>
            <label htmlFor="sub-cat-filter">Category</label>
            <select id="sub-cat-filter" className={styles.select} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}>
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="sub-active">Status</label>
            <select id="sub-active" className={styles.select} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className={styles.filterMeta}>
          <span className={styles.chip}>Showing <strong>{filtered.length}</strong> of <strong>{items.length}</strong></span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading ? <div className={styles.loading}>Loading sub-categories…</div> : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Sub-Category Name</th>
                  <th>Parent Category</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sub-categories found.</td></tr>
                ) : filtered.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.sub_category_code}</strong></td>
                    <td className={styles.nameCell}><div className={styles.nameMain}>{row.sub_category_name}</div></td>
                    <td>{row.category_name ?? '—'}</td>
                    <td>{row.description ?? '—'}</td>
                    <td>
                      {row.is_active
                        ? <span className={`${styles.badge} ${styles.badgeOtc}`}>Active</span>
                        : <span className={`${styles.badge} ${styles.badgeOff}`}>Inactive</span>}
                    </td>
                    <td>{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button type="button" className={`${styles.linkBtn} ${styles.linkBtnWarn}`} onClick={() => setEdit(row)}>Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && <EditSubCategoryModal item={edit} categories={categories} onClose={() => setEdit(null)} onSaved={(next) => { setItems((prev) => prev.map((x) => (x.id === next.id ? next : x))); showToast('Sub-category updated.') }} />}
      {createOpen && <CreateSubCategoryModal categories={categories} onClose={() => setCreateOpen(false)} onCreated={() => { showToast('Sub-category created.'); void load() }} />}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
