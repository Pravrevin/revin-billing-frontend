import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchItemMasters } from '../services/itemMasterApi'
import { fetchStockMasters } from '../services/stockMasterApi'
import type { ItemMaster } from '../types/itemMaster'
import styles from './ProductMasterPage.module.css'

// ── Types ───────────────────────────────────────────────────────────────────

type LowStockRow = {
  item_id: number
  item_name: string
  current_qty: number
  reorder_level: number
  min_stock_level: number
  threshold: number
  shortfall: number
  status: 'out' | 'low'
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}

/**
 * Low stock = total on-hand quantity (summed across all batches in stock_master)
 * at or below the item's reorder level (falls back to minimum stock level).
 * Items with no configured threshold are only flagged when fully out of stock.
 */
function buildLowStock(items: ItemMaster[], qtyByItem: Map<number, number>): LowStockRow[] {
  const out: LowStockRow[] = []
  for (const item of items) {
    if (item.is_active === false) continue
    const currentQty = qtyByItem.get(item.id) ?? 0
    const reorder = num(item.reorder_level)
    const minLevel = num(item.min_stock_level)
    const threshold = reorder > 0 ? reorder : minLevel

    const isOut = currentQty <= 0
    const isLow = threshold > 0 && currentQty <= threshold

    if (!isOut && !isLow) continue
    if (isOut && threshold <= 0 && !qtyByItem.has(item.id)) continue

    out.push({
      item_id: item.id,
      item_name: item.item_name?.trim() || `Item #${item.id}`,
      current_qty: currentQty,
      reorder_level: reorder,
      min_stock_level: minLevel,
      threshold,
      shortfall: threshold > 0 ? Math.max(0, threshold - currentQty) : 0,
      status: isOut ? 'out' : 'low',
    })
  }
  return out.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'out' ? -1 : 1
    return b.shortfall - a.shortfall
  })
}

// ── Page (full-screen overlay — same UI frame as Stock List) ──────────────────

export function LowStockAlertPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<ItemMaster[]>([])
  const [qtyByItem, setQtyByItem] = useState<Map<number, number>>(new Map())
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'out' | 'low'>('all')

  const close = useCallback(() => navigate('/app/dashboard'), [navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [itemRows, stockRows] = await Promise.all([fetchItemMasters(), fetchStockMasters()])
      const map = new Map<number, number>()
      for (const s of stockRows) {
        map.set(s.item_id, (map.get(s.item_id) ?? 0) + num(s.quantity))
      }
      setItems(itemRows)
      setQtyByItem(map)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load low-stock data')
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
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const lowStock = useMemo(() => buildLowStock(items, qtyByItem), [items, qtyByItem])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return lowStock.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (q && !r.item_name.toLowerCase().includes(q) && String(r.item_id) !== q) return false
      return true
    })
  }, [lowStock, search, statusFilter])

  const outCount = lowStock.filter((r) => r.status === 'out').length
  const lowCount = lowStock.length - outCount

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={close}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>⚠️ Low Stock Alert</h2>
          <p>Items at or below their reorder / minimum level — refill these soon</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={close} aria-label="Close">×</button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="ls-search">Search</label>
            <input
              id="ls-search"
              type="text"
              placeholder="Item name or item ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
          <div className={styles.fsFilterField}>
            <label htmlFor="ls-status">Status</label>
            <select id="ls-status" className={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All alerts</option>
              <option value="out">Out of stock</option>
              <option value="low">Low stock</option>
            </select>
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            <strong>{outCount}</strong> out of stock · <strong>{lowCount}</strong> low · showing <strong>{filtered.length}</strong>
          </span>
          {(search || statusFilter !== 'all') ? (
            <button type="button" className={styles.resetLink} onClick={() => { setSearch(''); setStatusFilter('all') }}>
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
        {loading ? (
          <div className={styles.loading}>Loading low-stock items…</div>
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
                    <th>Current Qty</th>
                    <th>Reorder Level</th>
                    <th>Min Level</th>
                    <th>Shortfall</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={6}>
                        {lowStock.length === 0
                          ? '🎉 No low-stock items — everything is above its reorder level.'
                          : 'No items match these filters.'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => (
                      <tr key={r.item_id}>
                        <td className={styles.nameCell}>
                          <div className={styles.nameMain}>{r.item_name}</div>
                          <div className={styles.nameSub}>Item ID: {r.item_id}</div>
                        </td>
                        <td className={styles.amtCell}>
                          <span style={{ fontWeight: 700, color: r.status === 'out' ? '#b91c1c' : '#c2410c' }}>{r.current_qty}</span>
                        </td>
                        <td className={styles.amtCell}>{r.reorder_level || '—'}</td>
                        <td className={styles.amtCell}>{r.min_stock_level || '—'}</td>
                        <td className={styles.amtCell}>{r.shortfall > 0 ? r.shortfall : '—'}</td>
                        <td>
                          {r.status === 'out' ? (
                            <span className={`${styles.badge} ${styles.badgeOff}`}>Out of stock</span>
                          ) : (
                            <span className={styles.badgeH}>Low stock</span>
                          )}
                        </td>
                      </tr>
                    ))
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
