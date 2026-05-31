import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchStockExpiry } from '../../services/stockMasterApi'
import type { StockExpiryRow } from '../../types/stockMaster'
import styles from '../../pages/ProductMasterPage.module.css'

export type ExpiryMode = 'all' | 'near' | 'expired'

type Props = { mode: ExpiryMode; onClose: () => void }

const TITLES: Record<ExpiryMode, { title: string; sub: string }> = {
  all:     { title: '💊 Expiry Medicines', sub: 'All batches with an expiry date — soonest first' },
  near:    { title: '⚠️ Near Expiry (30 Days)', sub: 'Batches expiring within 30 days — sell or return soon' },
  expired: { title: '🚫 Expired Stock', sub: 'Batches already past their expiry date — remove / write off' },
}

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}

function expiryCell(days: number | null | undefined): { label: string; color: string } {
  if (days == null) return { label: '—', color: 'var(--text-muted)' }
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, color: '#b91c1c' }
  if (days === 0) return { label: 'Expires today', color: '#b91c1c' }
  if (days <= 30) return { label: `${days}d left`, color: '#c2410c' }
  return { label: `${days}d left`, color: 'var(--text-muted)' }
}

function statusBadge(status: string): { label: string; bg: string; color: string } {
  if (status === 'expired') return { label: 'Expired', bg: '#fee2e2', color: '#b91c1c' }
  if (status === 'near') return { label: 'Near Expiry', bg: '#ffedd5', color: '#c2410c' }
  return { label: 'OK', bg: '#dcfce7', color: '#15803d' }
}

export function ExpiryManagementModal({ mode, onClose }: Props) {
  const [rows, setRows] = useState<StockExpiryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [maxDays, setMaxDays] = useState('') // "time left ≤ N days"

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchStockExpiry(mode, 30)
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load expiry data')
    } finally {
      setLoading(false)
    }
  }, [mode])

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const capTxt = maxDays.trim()
    const cap = capTxt === '' ? null : Number.parseInt(capTxt, 10)
    const hasCap = cap != null && !Number.isNaN(cap)
    return rows.filter((r) => {
      if (q && ![r.item_name, r.batch_no, String(r.item_id)].filter(Boolean).join(' ').toLowerCase().includes(q)) {
        return false
      }
      // "Time left ≤ N days" — show batches expiring within N days (includes already expired)
      if (hasCap && (r.days_to_expiry == null || r.days_to_expiry > (cap as number))) return false
      return true
    })
  }, [rows, search, maxDays])

  const meta = TITLES[mode]
  const totalQty = filtered.reduce((s, r) => s + num(r.quantity), 0)

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>{meta.title}</h2>
          <p>{meta.sub}</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="ex-search">Search</label>
            <input
              id="ex-search"
              type="text"
              placeholder="Item name, batch, item ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="ex-days">Time left ≤ (days)</label>
            <input
              id="ex-days"
              type="number"
              min={0}
              placeholder="e.g. 90"
              value={maxDays}
              onChange={(e) => setMaxDays(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            <strong>{filtered.length}</strong> batches · total qty <strong>{totalQty}</strong>
            {maxDays.trim() ? <> · expiring within <strong>{maxDays.trim()}</strong> days</> : null}
          </span>
          {(search || maxDays.trim()) ? (
            <button type="button" className={styles.resetLink} onClick={() => { setSearch(''); setMaxDays('') }}>Reset</button>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {loading ? (
          <div className={styles.loading}>Loading…</div>
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
                    <th>Item / Product</th>
                    <th>Batch</th>
                    <th>Expiry Date</th>
                    <th>Time Left</th>
                    <th>Qty</th>
                    <th>MRP</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={7}>
                        {mode === 'expired'
                          ? '🎉 No expired stock.'
                          : mode === 'near'
                            ? '🎉 Nothing expiring in the next 30 days.'
                            : 'No batches with an expiry date yet. Set expiry on batches during Purchase Entry.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const exp = expiryCell(r.days_to_expiry)
                      const sb = statusBadge(r.status)
                      return (
                        <tr key={r.id}>
                          <td className={styles.nameCell}>
                            <div className={styles.nameMain}>{r.item_name?.trim() || `Item #${r.item_id}`}</div>
                            <div className={styles.nameSub}>Item ID: {r.item_id}</div>
                          </td>
                          <td>{r.batch_no || '—'}</td>
                          <td>{r.expiry_date ? String(r.expiry_date).slice(0, 10) : '—'}</td>
                          <td style={{ fontWeight: 600, color: exp.color }}>{exp.label}</td>
                          <td className={styles.amtCell} style={{ fontWeight: 700 }}>{num(r.quantity)}</td>
                          <td className={styles.amtCell}>{r.mrp ? `₹${r.mrp}` : '—'}</td>
                          <td>
                            <span className={styles.badge} style={{ background: sb.bg, color: sb.color }}>{sb.label}</span>
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
