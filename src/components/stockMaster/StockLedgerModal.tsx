import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchStockLedger } from '../../services/stockMasterApi'
import type { StockLedgerEntry } from '../../types/stockMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type Props = { onClose: () => void }

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}

function fmtDateTime(v: string): string {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v.slice(0, 16).replace('T', ' ')
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Human label + tone for a movement source. */
function sourceLabel(ref?: string | null): { label: string; bg: string; color: string } {
  switch (ref) {
    case 'purchase':       return { label: 'Purchase', bg: '#ecfdf5', color: '#15803d' }
    case 'sale':           return { label: 'Sale', bg: '#eff6ff', color: '#1d4ed8' }
    case 'sale-reversal':  return { label: 'Sale Reversal', bg: '#fef9c3', color: '#a16207' }
    case 'return':         return { label: 'Return', bg: '#faf5ff', color: '#7c3aed' }
    case 'expired':        return { label: 'Expired', bg: '#fef2f2', color: '#b91c1c' }
    case 'adjustment':     return { label: 'Adjustment', bg: '#f1f5f9', color: '#475569' }
    default:               return { label: ref || '—', bg: '#f1f5f9', color: '#475569' }
  }
}

export function StockLedgerModal({ onClose }: Props) {
  const [rows, setRows] = useState<StockLedgerEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [moveFilter, setMoveFilter] = useState<'all' | 'IN' | 'OUT'>('all')
  const [sourceFilter, setSourceFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchStockLedger()
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load stock ledger')
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
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const sources = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) if (r.reference_type) set.add(r.reference_type)
    return Array.from(set).sort()
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (moveFilter !== 'all' && r.movement_type !== moveFilter) return false
      if (sourceFilter && r.reference_type !== sourceFilter) return false
      if (q) {
        const hay = [r.item_name, r.batch_no, String(r.item_id), r.reference_type, String(r.reference_id)]
          .filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, search, moveFilter, sourceFilter])

  const totalIn  = filtered.filter((r) => r.movement_type === 'IN').reduce((s, r) => s + num(r.quantity), 0)
  const totalOut = filtered.filter((r) => r.movement_type === 'OUT').reduce((s, r) => s + num(r.quantity), 0)

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>📜 Stock Ledger</h2>
          <p>Every inventory movement — purchases in, sales out, returns &amp; adjustments</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="sl-search">Search</label>
            <input
              id="sl-search"
              type="text"
              placeholder="Item name, batch, source, ref id…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="sl-move">Movement</label>
            <select id="sl-move" className={styles.select} value={moveFilter} onChange={(e) => setMoveFilter(e.target.value as typeof moveFilter)}>
              <option value="all">All</option>
              <option value="IN">IN (received)</option>
              <option value="OUT">OUT (issued)</option>
            </select>
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="sl-source">Source</label>
            <select id="sl-source" className={styles.select} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
              <option value="">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{sourceLabel(s).label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> · IN <strong>{totalIn}</strong> · OUT <strong>{totalOut}</strong>
          </span>
          {(search || moveFilter !== 'all' || sourceFilter) ? (
            <button type="button" className={styles.resetLink} onClick={() => { setSearch(''); setMoveFilter('all'); setSourceFilter('') }}>
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {loading ? (
          <div className={styles.loading}>Loading stock ledger…</div>
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
                    <th>Date / Time</th>
                    <th>Item / Product</th>
                    <th>Batch</th>
                    <th>Movement</th>
                    <th>Qty</th>
                    <th>Source</th>
                    <th>Ref #</th>
                    <th>Rate / MRP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={8}>No stock movements yet. Make a purchase or a sale to see entries here.</td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isIn = r.movement_type === 'IN'
                      const src = sourceLabel(r.reference_type)
                      return (
                        <tr key={r.id}>
                          <td style={{ fontSize: '0.82rem' }}>{fmtDateTime(r.created_at)}</td>
                          <td className={styles.nameCell}>
                            <div className={styles.nameMain}>{r.item_name?.trim() || `Item #${r.item_id}`}</div>
                            <div className={styles.nameSub}>Item ID: {r.item_id}</div>
                          </td>
                          <td>{r.batch_no || '—'}</td>
                          <td>
                            <span
                              className={styles.badge}
                              style={{ background: isIn ? '#dcfce7' : '#fee2e2', color: isIn ? '#15803d' : '#b91c1c' }}
                            >
                              {isIn ? '▲ IN' : '▼ OUT'}
                            </span>
                          </td>
                          <td className={styles.amtCell} style={{ fontWeight: 700, color: isIn ? '#15803d' : '#b91c1c' }}>
                            {isIn ? '+' : '−'}{num(r.quantity)}
                            {num(r.free_quantity) > 0 ? (
                              <div className={styles.nameSub}>+{num(r.free_quantity)} free</div>
                            ) : null}
                          </td>
                          <td>
                            <span className={styles.badge} style={{ background: src.bg, color: src.color }}>{src.label}</span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.reference_id ?? '—'}</td>
                          <td className={styles.amtCell} style={{ fontSize: '0.82rem' }}>
                            {r.purchase_rate ? `₹${r.purchase_rate}` : r.mrp ? `MRP ₹${r.mrp}` : '—'}
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
    </div>
  )
}
