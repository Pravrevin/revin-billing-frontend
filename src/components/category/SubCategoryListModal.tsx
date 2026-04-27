import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCategories, fetchSubCategories } from '../../services/categoryMasterApi'
import type { CategoryMaster, SubCategoryMaster } from '../../types/categoryMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type Props = { onClose: () => void }

export function SubCategoryListModal({ onClose }: Props) {
  const [rows, setRows] = useState<SubCategoryMaster[]>([])
  const [categories, setCategories] = useState<CategoryMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [subCategories, parentCategories] = await Promise.all([fetchSubCategories(), fetchCategories()])
      setRows(subCategories)
      setCategories(parentCategories)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load sub-categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (categoryFilter && r.category_id !== categoryFilter) return false
      if (activeFilter === 'active' && !r.is_active) return false
      if (activeFilter === 'inactive' && r.is_active) return false
      if (!q) return true
      return [r.sub_category_name, r.category_name, r.description].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [rows, search, categoryFilter, activeFilter])

  if (loading) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loading}>Loading sub-categories…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className={`${styles.banner} ${styles.bannerError}`} style={{ maxWidth: 480 }}>
          {err}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>Retry</button>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onClose}>Close</button>
      </div>
    )
  }

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>
          ← Back
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2>Sub-Category List</h2>
          <p>{filtered.length} of {rows.length} sub-categories</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="scl-search">Search</label>
            <input
              id="scl-search"
              type="text"
              placeholder="Sub-category, parent category, description…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="scl-category">Category</label>
            <select id="scl-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="scl-status">Status</label>
            <select id="scl-status" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> sub-categories
          </span>
          {(search || activeFilter !== 'all' || categoryFilter !== '') && (
            <button
              type="button"
              className={styles.resetLink}
              onClick={() => {
                setSearch('')
                setCategoryFilter('')
                setActiveFilter('all')
              }}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div className={styles.fsTableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.fsTable}>
              <thead>
                <tr>
                  <th>Sub-Category Name</th>
                  <th>Parent Category</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 130 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className={styles.emptyRow}>
                    <td colSpan={4}>No sub-categories found.</td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className={styles.fsInvoiceRow}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--medical-mid)', fontSize: '0.88rem' }}>
                          {r.sub_category_name}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{r.category_name ?? '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${r.is_active ? styles.badgeOtc : styles.badgeOff}`}>
                          {r.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
