import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchUnits } from '../../services/unitMasterApi'
import type { UnitMaster } from '../../types/unitMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type Props = { onClose: () => void }

export function UnitListModal({ onClose }: Props) {
  const [rows, setRows] = useState<UnitMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchUnits()
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load units')
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
    return rows.filter((row) => {
      if (activeFilter === 'active' && !row.is_active) return false
      if (activeFilter === 'inactive' && row.is_active) return false
      if (!q) return true
      return row.unit_name.toLowerCase().includes(q)
    })
  }, [rows, search, activeFilter])

  if (loading) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loading}>Loading units…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div
        className={styles.overlayFullscreen}
        style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}
      >
        <div className={`${styles.banner} ${styles.bannerError}`} style={{ maxWidth: 480 }}>
          {err}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>
            Retry
          </button>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onClose}>
          Close
        </button>
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
          <h2>Unit List</h2>
          <p>{filtered.length} of {rows.length} units</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="ul-search">Search</label>
            <input
              id="ul-search"
              type="text"
              placeholder="Unit name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="ul-status">Status</label>
            <select
              id="ul-status"
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> units
          </span>
          {(search || activeFilter !== 'all') ? (
            <button
              type="button"
              className={styles.resetLink}
              onClick={() => {
                setSearch('')
                setActiveFilter('all')
              }}
            >
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        <div className={styles.fsTableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.fsTable}>
              <thead>
                <tr>
                  <th>Unit Name</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ width: 130 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className={styles.emptyRow}>
                    <td colSpan={3}>No units found.</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.unit_name} className={styles.fsInvoiceRow}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--medical-mid)', fontSize: '0.88rem' }}>
                          {row.unit_name}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${row.is_active ? styles.badgeOtc : styles.badgeOff}`}>
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {new Date(row.created_at).toLocaleDateString('en-IN')}
                      </td>
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
