import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchCategories, updateCategory } from '../services/categoryMasterApi'
import type { CategoryMaster } from '../types/categoryMaster'
import { AddCategoryModal } from '../components/category/AddCategoryModal'
import styles from './ProductMasterPage.module.css'

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [locked])
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditCategoryModal({ item, onClose, onSaved }: { item: CategoryMaster; onClose: () => void; onSaved: (next: CategoryMaster) => void }) {
  const [name, setName] = useState(item.category_name)
  const [description, setDescription] = useState(item.description ?? '')
  const [isActive, setIsActive] = useState(item.is_active)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Category name is required.'); return }
    setSaving(true); setError(null)
    try {
      const updated = await updateCategory(item.id, { category_name: name.trim(), description: description.trim() || undefined, is_active: isActive })
      onSaved(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="edit-cat-title" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="edit-cat-title">Edit Category</h2>
            <p>Code: {item.category_code}</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error}</div>}
            <div className={styles.formSection}>
              <div className={styles.field}>
                <label htmlFor="edit-cat-name">Category Name *</label>
                <input id="edit-cat-name" className={styles.searchInput} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-cat-desc">Description</label>
                <textarea id="edit-cat-desc" className={styles.searchInput} value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>
              <div className={styles.field}>
                <label>
                  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
                </label>
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

export function CategoryMasterPage() {
  const location = useLocation()
  const [items, setItems] = useState<CategoryMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [edit, setEdit] = useState<CategoryMaster | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const isUpdateView = location.pathname.endsWith('/update')

  useBodyScrollLock(Boolean(edit || createOpen))

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setItems(await fetchCategories()) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load categories') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(null), 4200) }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (activeFilter === 'active' && !i.is_active) return false
      if (activeFilter === 'inactive' && i.is_active) return false
      if (!q) return true
      return i.category_name.toLowerCase().includes(q)
    })
  }, [items, search, activeFilter])

  return (
    <div className={styles.page}>
      {error && <div className={`${styles.banner} ${styles.bannerError}`}>{error} <button type="button" className={styles.resetLink} onClick={load}>Retry</button></div>}

      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>Category Master</h1>
          <p>Manage item categories. Codes are auto-generated.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>+ Add Category</button>
        </div>
      </div>

      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.field}>
            <label htmlFor="cat-search">Search</label>
            <input id="cat-search" className={styles.searchInput} placeholder="Category name…" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" />
          </div>
          <div className={styles.field}>
            <label htmlFor="cat-active">Status</label>
            <select id="cat-active" className={styles.select} value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
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
        {loading ? <div className={styles.loading}>Loading categories…</div> : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category Name</th>
                  <th>Status</th>
                  <th>Created</th>
                  {isUpdateView ? <th aria-label="Actions" /> : null}
                </tr>
              </thead>
              <tbody>
                {!filtered.length ? (
                  <tr><td colSpan={isUpdateView ? 4 : 3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No categories found.</td></tr>
                ) : filtered.map((row) => (
                  <tr key={`${row.category_name}-${row.created_at}`}>
                    <td className={styles.nameCell}><div className={styles.nameMain}>{row.category_name}</div></td>
                    <td>
                      {row.is_active
                        ? <span className={`${styles.badge} ${styles.badgeOtc}`}>Active</span>
                        : <span className={`${styles.badge} ${styles.badgeOff}`}>Inactive</span>}
                    </td>
                    <td>{new Date(row.created_at).toLocaleDateString('en-IN')}</td>
                    {isUpdateView ? (
                      <td>
                        <div className={styles.rowActions}>
                          <button type="button" className={`${styles.linkBtn} ${styles.linkBtnWarn}`} onClick={() => setEdit(row)}>Edit</button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edit && <EditCategoryModal item={edit} onClose={() => setEdit(null)} onSaved={(next) => { setItems((prev) => prev.map((x) => (x.id === next.id ? next : x))); showToast('Category updated.') }} />}
      {createOpen && <AddCategoryModal onClose={() => setCreateOpen(false)} onCreated={() => { showToast('Category created.'); void load() }} />}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  )
}
