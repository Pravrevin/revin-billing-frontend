import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CreateStockMasterModal } from '../components/stockMaster/CreateStockMasterModal'
import { StockMasterEditModal } from '../components/stockMaster/StockMasterEditModal'
import { getBearerToken } from '../lib/apiConfig'
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

function uniqSortedStr(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
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

  const rackLocations = useMemo(
    () => uniqSortedStr(rows.map((r) => r.rack_location)),
    [rows],
  )

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

  const hasToken = Boolean(getBearerToken())

  return (
    <div className={styles.page}>
      {!hasToken ? (
        <div className={`${styles.banner} ${styles.bannerHint}`}>
          Add your access token in <code>.env.local</code> as <code>VITE_API_BEARER_TOKEN</code> so
          this screen can load live stock (see <code>.env.example</code>).
        </div>
      ) : null}

      {error ? (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {error}{' '}
          <button type="button" className={styles.resetLink} onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>Stock Master</h1>
          <p>
            Batch-level inventory: quantities, MRP and rates, warehouse and rack, and expiry. Filter
            the grid to find batches quickly, then open a row to review details or update the line.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>
            + Create stock line
          </button>
          <button
            type="button"
            className={styles.btnMuted}
            onClick={() => fileRef.current?.click()}
          >
            Bulk import
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

      <div className={`${styles.filterCard} ${styles.pmFilterCard}`}>
        <div className={styles.filterGrid}>
          <div className={`${styles.field} ${styles.pmSearchField}`}>
            <label htmlFor="sm-search" className={styles.pmSearchLabel}>
              Search stock
            </label>
            <input
              id="sm-search"
              className={`${styles.searchInput} ${styles.pmSearchInput}`}
              placeholder="Batch, rack, item, stock id, MRP, rates, quantity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-stock-id">Stock ID</label>
            <input
              id="sm-stock-id"
              className={styles.searchInput}
              inputMode="numeric"
              placeholder="Exact id"
              value={stockId}
              onChange={(e) => setStockId(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-item-f">Item (product)</label>
            <select
              id="sm-item-f"
              className={styles.select}
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">All items</option>
              {itemIds.map((id) => {
                const name = itemIdLabels.get(id)
                return (
                  <option key={id} value={String(id)}>
                    {name ? `${name} (#${id})` : `Item #${id}`}
                  </option>
                )
              })}
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
              <option value="">All warehouses</option>
              {warehouseIds.map((w) => (
                <option key={w} value={String(w)}>
                  Warehouse {w}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-rack-f">Rack</label>
            <select
              id="sm-rack-f"
              className={styles.select}
              value={rackLocation}
              onChange={(e) => setRackLocation(e.target.value)}
            >
              <option value="">All racks</option>
              {rackLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-batch-f">Batch contains</label>
            <input
              id="sm-batch-f"
              className={styles.searchInput}
              placeholder="Part of batch number"
              value={batchContains}
              onChange={(e) => setBatchContains(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-exp-f">Expiry window</label>
            <select
              id="sm-exp-f"
              className={styles.select}
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value as typeof expiryFilter)}
            >
              <option value="all">Any expiry</option>
              <option value="90">Due within 90 days</option>
              <option value="180">Due within 180 days</option>
              <option value="expired">Already expired</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-free-f">Free quantity</label>
            <select
              id="sm-free-f"
              className={styles.select}
              value={freeQtyFilter}
              onChange={(e) => setFreeQtyFilter(e.target.value as typeof freeQtyFilter)}
            >
              <option value="all">All lines</option>
              <option value="with">With free stock</option>
              <option value="without">No free stock</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-mrp-min">MRP min</label>
            <input
              id="sm-mrp-min"
              className={styles.searchInput}
              inputMode="decimal"
              placeholder="₹"
              value={mrpMin}
              onChange={(e) => setMrpMin(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-mrp-max">MRP max</label>
            <input
              id="sm-mrp-max"
              className={styles.searchInput}
              inputMode="decimal"
              placeholder="₹"
              value={mrpMax}
              onChange={(e) => setMrpMax(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-qty-min">Qty min</label>
            <input
              id="sm-qty-min"
              className={styles.searchInput}
              inputMode="decimal"
              value={qtyMin}
              onChange={(e) => setQtyMin(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-qty-max">Qty max</label>
            <input
              id="sm-qty-max"
              className={styles.searchInput}
              inputMode="decimal"
              value={qtyMax}
              onChange={(e) => setQtyMax(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-sale-min">Sale rate min</label>
            <input
              id="sm-sale-min"
              className={styles.searchInput}
              inputMode="decimal"
              placeholder="₹"
              value={saleRateMin}
              onChange={(e) => setSaleRateMin(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="sm-pur-max">Purchase rate max</label>
            <input
              id="sm-pur-max"
              className={styles.searchInput}
              inputMode="decimal"
              placeholder="₹"
              value={purchaseRateMax}
              onChange={(e) => setPurchaseRateMax(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.filterMeta}>
          <span className={styles.chip}>
            Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> filtered
            ({rows.length} loaded)
          </span>
          <button type="button" className={styles.resetLink} onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      <div className={`${styles.tableWrap} ${styles.pmTableWrap}`}>
        {loading ? (
          <div className={styles.loading}>Loading stock master…</div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${styles.pmTable}`}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th>MRP</th>
                    <th>Qty</th>
                    <th>WH</th>
                    <th>Rack</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {!pageItems.length ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        No stock lines match these filters.
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((row) => {
                    const d = daysUntil(row.expiry_date)
                    return (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.id}</strong>
                        </td>
                        <td className={styles.nameCell}>
                          <div className={styles.nameMain}>
                            {row.item_name?.trim() || `Item #${row.item_id}`}
                          </div>
                          <div className={styles.nameSub}>#{row.item_id}</div>
                        </td>
                        <td className={styles.nameCell}>
                          <div className={styles.nameMain}>{row.batch_no}</div>
                          <div className={styles.nameSub}>Pur ₹{row.purchase_rate}</div>
                        </td>
                        <td>
                          {row.expiry_date?.slice(0, 10)}
                          {d <= 90 && d >= 0 ? (
                            <div className={styles.nameSub} style={{ color: '#c2410c' }}>
                              {d}d left
                            </div>
                          ) : null}
                          {d < 0 ? (
                            <span className={`${styles.badge} ${styles.badgeOff}`}>Expired</span>
                          ) : null}
                        </td>
                        <td>₹{row.mrp}</td>
                        <td>
                          {row.quantity}
                          <div className={styles.nameSub}>+{row.free_quantity} free</div>
                        </td>
                        <td>{row.warehouse_id}</td>
                        <td>{row.rack_location}</td>
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
                  })}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <div className={styles.field} style={{ maxWidth: 120 }}>
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
                  Page {safePage} / {totalPages}
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
