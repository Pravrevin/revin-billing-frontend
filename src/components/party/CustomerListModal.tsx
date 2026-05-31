import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import type { PartyMaster } from '../../types/partyMaster'
import { QuickAddCustomerModal } from './QuickAddCustomerModal'
import styles from '../../pages/ProductMasterPage.module.css'

function fmt(v: unknown): string {
  if (v == null || v === '') return '—'
  return String(v).trim() || '—'
}

type Props = { onClose: () => void }

export function CustomerListModal({ onClose }: Props) {
  const [rows, setRows] = useState<PartyMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchPartyMasters('Customer')
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load customers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !showAdd) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, showAdd])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(q)))
  }, [rows, search])

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>👥 Customers</h2>
          <p>{filtered.length} of {rows.length} customers</p>
        </div>
        <button
          type="button"
          className={styles.btnPrimary}
          style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', marginRight: '0.5rem' }}
          onClick={() => setShowAdd(true)}
        >
          + Add Customer
        </button>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="cl-search">Search</label>
            <input
              id="cl-search"
              type="text"
              placeholder="Name, mobile, city, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> customers</span>
          {search ? <button type="button" className={styles.resetLink} onClick={() => setSearch('')}>Reset</button> : null}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {loading ? (
          <div className={styles.loading}>Loading customers…</div>
        ) : err ? (
          <div className={`${styles.banner} ${styles.bannerError}`}>
            {err}{' '}
            <button type="button" className={styles.resetLink} onClick={() => void load()}>Retry</button>
          </div>
        ) : (
          <div className={styles.fsTableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.fsTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>GSTIN</th>
                    <th style={{ width: 90 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={6}>No customers yet. Click “+ Add Customer”.</td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isActive = typeof r.is_active === 'boolean' ? r.is_active : true
                      return (
                        <tr key={r.id}>
                          <td><strong>{fmt(r.party_name)}</strong></td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(r.mobile)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(r.email)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(r.city)}</td>
                          <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{fmt(r.gstin)}</td>
                          <td>
                            <span className={`${styles.badge} ${isActive ? styles.badgeOtc : styles.badgeOff}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAdd ? (
        <QuickAddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); void load() }}
        />
      ) : null}
    </div>
  )
}
