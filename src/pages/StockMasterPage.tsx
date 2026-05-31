import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CreateStockMasterModal } from '../components/stockMaster/CreateStockMasterModal'
import { StockMasterEditModal } from '../components/stockMaster/StockMasterEditModal'
import { fetchStockMasters } from '../services/stockMasterApi'
import type { StockMaster } from '../types/stockMaster'
import styles from './ProductMasterPage.module.css'

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [locked])
}

function uniqSortedNums(ids: number[]): number[] {
  return [...new Set(ids)].sort((a, b) => a - b)
}

function parseOptFloat(s: string): number | null {
  const t = s.trim()
  if (!t) return null
  const n = Number.parseFloat(t)
  return Number.isNaN(n) ? null : n
}

function daysUntil(dateStr: string): number {
  const t = new Date(dateStr.slice(0, 10)).getTime()
  if (Number.isNaN(t)) return Infinity
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((t - now.getTime()) / 86400000)
}

function StockDetailModal({
  row,
  onClose,
  onEdit,
}: {
  row: StockMaster
  onClose: () => void
  onEdit: () => void
}) {
  const kv = (label: string, value: ReactNode) => (
    <div className={styles.kv}>
      <span>{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  )

  const dLeft = daysUntil(row.expiry_date)

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-detail-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="sm-detail-title">{row.batch_no}</h2>
            <p>
              {row.item_name?.trim() ? (
                <>
                  <span style={{ fontWeight: 600 }}>{row.item_name.trim()}</span>
                  {' · '}
                </>
              ) : null}
              Stock {row.id} · WH {row.warehouse_id}
              {dLeft <= 90 && dLeft >= 0 ? (
                <span className={styles.badgeH} style={{ marginLeft: '0.5rem' }}>
                  Expires in {dLeft}d
                </span>
              ) : null}
            </p>
          </div>
          <div className={styles.headActions}>
            <button type="button" className={styles.btnPrimarySm} onClick={onEdit}>
              Edit
            </button>
            <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailSections}>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Batch</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Stock id', row.id)}
                  {kv('Product', row.item_name?.trim() || '—')}
                  {kv('Batch number', row.batch_no)}
                  {kv('Manufacture date', row.manufacture_date?.slice(0, 10))}
                  {kv('Expiry date', row.expiry_date?.slice(0, 10))}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Rates & quantity</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('MRP', row.mrp)}
                  {kv('Purchase rate', row.purchase_rate)}
                  {kv('Sale rate', row.sale_rate)}
                  {kv('Quantity', row.quantity)}
                  {kv('Free quantity', row.free_quantity)}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Location</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Warehouse', row.warehouse_id)}
                  {kv('Rack', row.rack_location)}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Additional details</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv(
                    'Supplier, invoice, etc.',
                    row.extra_data != null ? JSON.stringify(row.extra_data) : '—',
                  )}
                  {kv('Created', new Date(row.created_at).toLocaleString())}
                  {kv('Updated', new Date(row.updated_at).toLocaleString())}
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function StockMasterPage() {
  const [rows, setRows] = useState<StockMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [itemId, setItemId] = useState('')
  const [rackLocation, setRackLocation] = useState('')
  const [batchContains, setBatchContains] = useState('')
  const [stockId, setStockId] = useState('')
  const [mrpMin, setMrpMin] = useState('')
  const [mrpMax, setMrpMax] = useState('')
  const [qtyMin, setQtyMin] = useState('')
  const [qtyMax, setQtyMax] = useState('')
  const [saleRateMin, setSaleRateMin] = useState('')
  const [purchaseRateMax, setPurchaseRateMax] = useState('')
  const [freeQtyFilter, setFreeQtyFilter] = useState<'all' | 'with' | 'without'>('all')
  const [expiryFilter, setExpiryFilter] = useState<'all' | '90' | '180' | 'expired'>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<StockMaster | null>(null)
  const [edit, setEdit] = useState<StockMaster | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useBodyScrollLock(Boolean(detail || edit || createOpen))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchStockMasters()
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load stock')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [
    search,
    warehouseId,
    itemId,
    rackLocation,
    batchContains,
    stockId,
    mrpMin,
    mrpMax,
    qtyMin,
    qtyMax,
    saleRateMin,
    purchaseRateMax,
    freeQtyFilter,
    expiryFilter,
    pageSize,
  ])

  const warehouseIds = useMemo(
    () => uniqSortedNums(rows.map((r) => r.warehouse_id)),
    [rows],
  )

  const itemIds = useMemo(() => uniqSortedNums(rows.map((r) => r.item_id)), [rows])

  const itemIdLabels = useMemo(() => {
    const map = new Map<number, string>()
    for (const r of rows) {
      const name = r.item_name?.trim()
      if (name && !map.has(r.item_id)) map.set(r.item_id, name)
    }
    return map
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const mMin = parseOptFloat(mrpMin)
    const mMax = parseOptFloat(mrpMax)
    const qMinN = parseOptFloat(qtyMin)
    const qMaxN = parseOptFloat(qtyMax)
    const srMin = parseOptFloat(saleRateMin)
    const prMax = parseOptFloat(purchaseRateMax)
    const batchQ = batchContains.trim().toLowerCase()
    const sid = stockId.trim()

    return rows.filter((r) => {
      if (warehouseId && String(r.warehouse_id) !== warehouseId) return false
      if (itemId && String(r.item_id) !== itemId) return false
      if (rackLocation && r.rack_location !== rackLocation) return false
      if (batchQ && !r.batch_no.toLowerCase().includes(batchQ)) return false
      if (sid && String(r.id) !== sid) return false

      const mrpN = Number.parseFloat(r.mrp)
      if (mMin != null && !Number.isNaN(mrpN) && mrpN < mMin) return false
      if (mMax != null && !Number.isNaN(mrpN) && mrpN > mMax) return false

      const qtyN = Number.parseFloat(r.quantity)
      if (qMinN != null && !Number.isNaN(qtyN) && qtyN < qMinN) return false
      if (qMaxN != null && !Number.isNaN(qtyN) && qtyN > qMaxN) return false

      const saleN = Number.parseFloat(r.sale_rate)
      if (srMin != null && !Number.isNaN(saleN) && saleN < srMin) return false

      const purN = Number.parseFloat(r.purchase_rate)
      if (prMax != null && !Number.isNaN(purN) && purN > prMax) return false

      const freeN = Number.parseFloat(r.free_quantity) || 0
      if (freeQtyFilter === 'with' && freeN <= 0) return false
      if (freeQtyFilter === 'without' && freeN > 0) return false

      const d = daysUntil(r.expiry_date)
      if (expiryFilter === '90' && (d > 90 || d < 0)) return false
      if (expiryFilter === '180' && (d > 180 || d < 0)) return false
      if (expiryFilter === 'expired' && d >= 0) return false

      if (!q) return true
      const hay = [
        r.batch_no,
        r.rack_location,
        String(r.item_id),
        String(r.id),
        r.item_name ?? '',
        r.mrp,
        r.sale_rate,
        r.purchase_rate,
        r.quantity,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [
    rows,
    search,
    warehouseId,
    itemId,
    rackLocation,
    batchContains,
    stockId,
    mrpMin,
    mrpMax,
    qtyMin,
    qtyMax,
    saleRateMin,
    purchaseRateMax,
    freeQtyFilter,
    expiryFilter,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 4200)
  }

  const resetFilters = () => {
    setSearch('')
    setWarehouseId('')
    setItemId('')
    setRackLocation('')
    setBatchContains('')
    setStockId('')
    setMrpMin('')
    setMrpMax('')
    setQtyMin('')
    setQtyMax('')
    setSaleRateMin('')
    setPurchaseRateMax('')
    setFreeQtyFilter('all')
    setExpiryFilter('all')
  }

  const mergeRow = (next: StockMaster) => {
    setRows((prev) => prev.map((x) => (x.id === next.id ? next : x)))
  }

  return (
    <div className={styles.page}>
      {error ? (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {error}{' '}
          <button type="button" className={styles.resetLink} onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      {/* ── Page header ── */}
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>📦 Stock List</h1>
          <p>Batch-level inventory — quantities, MRP, rates, warehouse &amp; expiry.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>
            + Add Stock Line
          </button>
          <button
            type="button"
            className={styles.btnMuted}
            onClick={() => fileRef.current?.click()}
          >
            Bulk Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className={styles.hiddenFile}
            tabIndex={-1}
            onChange={() => {
              showToast('Bulk import will be available once your import flow is connected.')
              if (fileRef.current) fileRef.current.value = ''
            }}
          />
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={`${styles.filterCard} ${styles.pmFilterCard}`}>
        <div className={styles.filterGrid}>
          {/* Search — spans 2 cols */}
          <div className={`${styles.field} ${styles.pmSearchField}`}>
            <label htmlFor="sm-search" className={styles.pmSearchLabel}>
              Search Stock
            </label>
            <input
              id="sm-search"
              className={`${styles.searchInput} ${styles.pmSearchInput}`}
              placeholder="Item name, batch no, rack location, stock ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="sm-item-f">Item</label>
            <select
              id="sm-item-f"
              className={styles.select}
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">All Items</option>
              {itemIds.map((id) => {
                const name = itemIdLabels.get(id)
                return (
                  <option key={id} value={String(id)}>
                    {name ? `${name}` : `Item #${id}`}
                  </option>
                )
              })}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="sm-exp-f">Expiry</label>
            <select
              id="sm-exp-f"
              className={styles.select}
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value as typeof expiryFilter)}
            >
              <option value="all">Any Expiry</option>
              <option value="90">Within 90 Days</option>
              <option value="180">Within 180 Days</option>
              <option value="expired">Already Expired</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="sm-wh-f">Warehouse</label>
            <select
              id="sm-wh-f"
              className={styles.select}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            >
              <option value="">All Warehouses</option>
              {warehouseIds.map((w) => (
                <option key={w} value={String(w)}>
                  Warehouse {w}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="sm-free-f">Free Qty</label>
            <select
              id="sm-free-f"
              className={styles.select}
              value={freeQtyFilter}
              onChange={(e) => setFreeQtyFilter(e.target.value as typeof freeQtyFilter)}
            >
              <option value="all">All Lines</option>
              <option value="with">With Free Stock</option>
              <option value="without">No Free Stock</option>
            </select>
          </div>
        </div>

        <div className={styles.filterMeta}>
          <span className={styles.chip}>
            Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> results
            {filtered.length !== rows.length ? ` (${rows.length} total)` : ''}
          </span>
          <button type="button" className={styles.resetLink} onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={`${styles.tableWrap} ${styles.pmTableWrap}`}>
        {loading ? (
          <div className={styles.loading}>Loading stock…</div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${styles.pmTable}`}>
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>ID</th>
                    <th>Item / Product</th>
                    <th>Batch No</th>
                    <th>Expiry</th>
                    <th style={{ width: 90 }}>MRP</th>
                    <th style={{ width: 90 }}>Sale Rate</th>
                    <th style={{ width: 90 }}>Purchase Rate</th>
                    <th style={{ width: 90 }}>Qty</th>
                    <th style={{ width: 80 }}>Warehouse</th>
                    <th style={{ width: 100 }}>Rack</th>
                    <th style={{ width: 90 }} aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {!pageItems.length ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={11}>
                        {rows.length === 0 ? 'No stock entries found.' : 'No stock lines match these filters.'}
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((row) => {
                      const d = daysUntil(row.expiry_date)
                      return (
                        <tr key={row.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            #{row.id}
                          </td>
                          <td className={styles.nameCell}>
                            <div className={styles.nameMain}>
                              {row.item_name?.trim() || `Item #${row.item_id}`}
                            </div>
                            <div className={styles.nameSub}>Item ID: {row.item_id}</div>
                          </td>
                          <td>
                            <div className={styles.nameMain}>{row.batch_no || '—'}</div>
                          </td>
                          <td>
                            {row.expiry_date?.slice(0, 10) || '—'}
                            {d <= 90 && d >= 0 ? (
                              <div className={styles.nameSub} style={{ color: '#c2410c' }}>
                                {d}d left
                              </div>
                            ) : null}
                            {d < 0 ? (
                              <span className={`${styles.badge} ${styles.badgeOff}`} style={{ marginTop: '0.15rem', display: 'inline-flex' }}>
                                Expired
                              </span>
                            ) : null}
                          </td>
                          <td className={styles.amtCell}>
                            {row.mrp ? `₹${row.mrp}` : '—'}
                          </td>
                          <td className={styles.amtCell}>
                            {row.sale_rate ? `₹${row.sale_rate}` : '—'}
                          </td>
                          <td className={styles.amtCell}>
                            {row.purchase_rate ? `₹${row.purchase_rate}` : '—'}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>{row.quantity ?? '—'}</span>
                            {Number(row.free_quantity) > 0 ? (
                              <div className={styles.nameSub}>+{row.free_quantity} free</div>
                            ) : null}
                          </td>
                          <td>{row.warehouse_id ?? '—'}</td>
                          <td>{row.rack_location || '—'}</td>
                          <td>
                            <div className={styles.rowActions}>
                              <button
                                type="button"
                                className={styles.linkBtn}
                                onClick={() => setDetail(row)}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                className={`${styles.linkBtn} ${styles.linkBtnWarn}`}
                                onClick={() => setEdit(row)}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className={styles.pagination}>
              <div className={styles.field} style={{ maxWidth: 130 }}>
                <label htmlFor="sm-pagesize">Rows / page</label>
                <select
                  id="sm-pagesize"
                  className={styles.pageSize}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <div className={styles.pageBtns}>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span style={{ padding: '0 0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  Page {safePage} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detail ? (
        <StockDetailModal
          row={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEdit(detail)
            setDetail(null)
          }}
        />
      ) : null}

      {edit ? (
        <StockMasterEditModal
          key={edit.id}
          row={edit}
          warehouseIds={warehouseIds}
          onClose={() => setEdit(null)}
          onSaved={(next) => {
            mergeRow(next)
            showToast('Stock line updated.')
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateStockMasterModal
          warehouseIds={warehouseIds}
          itemIds={itemIds}
          itemIdLabels={itemIdLabels}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            showToast('Stock line created.')
            void load()
          }}
        />
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  )
}
