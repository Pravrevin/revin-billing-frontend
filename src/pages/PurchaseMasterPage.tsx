import { useCallback, useEffect, useMemo, useState } from 'react'
import { PurchaseEntryModal } from '../components/purchase/PurchaseEntryModal'
import { fetchAllPurchases, fetchPurchaseById } from '../services/purchaseApi'
import type { Purchase, PurchaseItem } from '../types/purchase'
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

// ── helpers ────────────────────────────────────────────────────────────────────

function fmt(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—'
  return String(v).trim() || '—'
}

function fmtAmt(v: string | number | null | undefined): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return '—'
  return v.slice(0, 10)
}

function statusBadgeClass(status: string | null | undefined): string {
  const st = (status ?? '').toLowerCase()
  if (st === 'paid') return styles.badgePaid
  if (st === 'unpaid') return styles.badgeUnpaid
  if (st === 'partial') return styles.badgePartial
  return styles.badge
}

function purchaseItems(p: Purchase): PurchaseItem[] {
  const raw = p.items ?? p.purchase_items
  return Array.isArray(raw) ? raw : []
}

// ── Invoice detail (full screen — same visual language as distributor Bills) ─

function PurchaseDetailFullscreen({ purchase: initial, onClose }: { purchase: Purchase; onClose: () => void }) {
  const [purchase, setPurchase] = useState(initial)
  const [itemSearch, setItemSearch] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [detailErr, setDetailErr] = useState<string | null>(null)

  useEffect(() => {
    setPurchase(initial)
    setItemSearch('')
    setBatchFilter('')
    setDetailErr(null)
  }, [initial])

  useEffect(() => {
    const existing = purchaseItems(initial)
    if (existing.length > 0) return

    let cancelled = false
    setLoadingDetail(true)
    setDetailErr(null)
    void fetchPurchaseById(initial.id)
      .then((full) => {
        if (!cancelled) setPurchase(full)
      })
      .catch((e) => {
        if (!cancelled) {
          setDetailErr(e instanceof Error ? e.message : 'Could not load line items')
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })
    return () => {
      cancelled = true
    }
  }, [initial])

  const p = purchase
  const items: PurchaseItem[] = useMemo(() => purchaseItems(p), [p])

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (batchFilter && !(it.batch_no ?? '').toLowerCase().includes(batchFilter.toLowerCase())) return false
      if (itemSearch) {
        const q = itemSearch.toLowerCase()
        const hay = [
          it.item_name,
          it.batch_no,
          String(it.mrp ?? ''),
          String(it.total ?? ''),
          it.expiry_date,
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, batchFilter, itemSearch])

  const anyItemFilter = itemSearch || batchFilter

  const metaFields = [
    { label: 'Invoice No', value: fmt(p.invoice_no) },
    { label: 'Invoice Date', value: fmtDate(p.invoice_date) },
    { label: 'Entry Date', value: fmtDate(p.entry_date) },
    { label: 'Due Date', value: fmtDate(p.due_date) },
    { label: 'Supplier', value: fmt(p.supplier_name) },
    { label: 'Total Amount', value: fmtAmt(p.total_amount) },
    { label: 'Discount', value: fmtAmt(p.discount) },
    { label: 'Tax Amount', value: fmtAmt(p.tax_amount) },
    { label: 'Net Amount', value: fmtAmt(p.net_amount) },
    { label: 'Payment Mode', value: fmt(p.payment_mode_name) },
    { label: 'Payment Status', value: fmt(p.payment_status) },
    { label: 'Created At', value: fmtDate(p.created_at) },
    { label: 'Updated At', value: fmtDate(p.updated_at) },
  ]

  return (
    <div className={styles.overlayFullscreen} role="dialog" aria-modal="true" aria-labelledby="purchase-fs-title">
      <header className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>
          ← Back to purchases
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2 id="purchase-fs-title">{fmt(p.invoice_no)} — {fmt(p.supplier_name)}</h2>
          <p>
            ID {p.id}
            {p.invoice_date ? ` · ${fmtDate(p.invoice_date)}` : null} · Net {fmtAmt(p.net_amount)} ·{' '}
            {p.payment_status ?? '—'}
          </p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      <div className={styles.fsBody}>
        {detailErr ? <div className={`${styles.banner} ${styles.bannerError}`}>{detailErr}</div> : null}

        <div className={styles.fsKvSection}>
          <div className={styles.fsKvSectionHead}>Invoice summary</div>
          <div className={styles.fsKvGrid}>
            {metaFields.map(({ label, value }) => (
              <div key={label} className={styles.fsKv}>
                <div className={styles.fsKvLabel}>{label}</div>
                <div className={styles.fsKvValue}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <h3 className={styles.fsSectionTitle}>Line items ({items.length})</h3>

        {loadingDetail ? (
          <div className={styles.loading} style={{ padding: '1.5rem 0' }}>
            Loading line items…
          </div>
        ) : (
          <>
            <div className={`${styles.filterCard} ${styles.pmFilterCard}`} style={{ marginBottom: '0.85rem' }}>
              <div className={styles.filterGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className={styles.field}>
                  <label htmlFor="pm-fs-item-search">Search items</label>
                  <input
                    id="pm-fs-item-search"
                    className={styles.searchInput}
                    placeholder="Name, batch, amount…"
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="pm-fs-batch">Batch No</label>
                  <input
                    id="pm-fs-batch"
                    className={styles.searchInput}
                    placeholder="Filter batch…"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className={styles.filterMeta}>
                <span className={styles.chip}>
                  Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items
                </span>
                {anyItemFilter ? (
                  <button
                    type="button"
                    className={styles.resetLink}
                    onClick={() => {
                      setItemSearch('')
                      setBatchFilter('')
                    }}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>

            {items.length === 0 && !loadingDetail ? (
              <p className={styles.billsMuted}>No line items on this purchase.</p>
            ) : (
              <div className={styles.fsTableWrap}>
                <div className={styles.tableScroll}>
                  <table className={styles.fsTable}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item Name</th>
                        <th>Batch No</th>
                        <th>Qty</th>
                        <th>Free Qty</th>
                        <th>Purchase Rate</th>
                        <th>MRP</th>
                        <th>Sale Rate</th>
                        <th>Discount %</th>
                        <th>GST %</th>
                        <th>Tax Amount</th>
                        <th>Expiry Date</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td colSpan={13} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            No items match filters.
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((it, idx) => (
                          <tr key={it.id}>
                            <td>{idx + 1}</td>
                            <td>
                              <strong>{fmt(it.item_name)}</strong>
                            </td>
                            <td>{fmt(it.batch_no)}</td>
                            <td className={styles.amtCell}>{fmt(it.quantity)}</td>
                            <td className={styles.amtCell}>{fmt(it.free_quantity)}</td>
                            <td className={styles.amtCell}>{fmtAmt(it.purchase_rate)}</td>
                            <td className={styles.amtCell}>{fmtAmt(it.mrp)}</td>
                            <td className={styles.amtCell}>{fmtAmt(it.sale_rate)}</td>
                            <td className={styles.amtCell}>{fmt(it.discount)}</td>
                            <td className={styles.amtCell}>{fmt(it.gst_percent)}</td>
                            <td className={styles.amtCell}>{fmtAmt(it.tax_amount)}</td>
                            <td>{fmtDate(it.expiry_date)}</td>
                            <td className={styles.amtCell}>
                              <strong>{fmtAmt(it.total)}</strong>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Purchase Master Page ───────────────────────────────────────────────────────

export function PurchaseMasterPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Purchase | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useBodyScrollLock(Boolean(selected))

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modeFilter, setModeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchAllPurchases()
      setPurchases(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load purchases')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, dateFrom, dateTo, modeFilter, statusFilter, pageSize])

  const paymentModes = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const p of purchases) {
      const m = p.payment_mode_name ?? ''
      if (m && !seen.has(m)) {
        seen.add(m)
        out.push(m)
      }
    }
    return out.sort()
  }, [purchases])

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      const d = p.invoice_date ?? p.entry_date ?? ''
      if (dateFrom && d && d.slice(0, 10) < dateFrom) return false
      if (dateTo && d && d.slice(0, 10) > dateTo) return false
      if (modeFilter && (p.payment_mode_name ?? '') !== modeFilter) return false
      if (statusFilter && (p.payment_status ?? '') !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const hay = [
          p.invoice_no,
          p.supplier_name,
          p.payment_status,
          p.payment_mode_name,
          String(p.net_amount ?? ''),
          String(p.total_amount ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [purchases, search, dateFrom, dateTo, modeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const resetFilters = () => {
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setModeFilter('')
    setStatusFilter('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>Purchase Master</h1>
          <p>All purchase invoices — click <strong>View</strong> to open a full-screen invoice detail.</p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => setShowCreate(true)}
          >
            + New Purchase
          </button>
        </div>
      </div>

      {error ? (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {error}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className={`${styles.filterCard} ${styles.pmFilterCard}`}>
        <div className={styles.filterGrid}>
          <div className={`${styles.field} ${styles.pmSearchField}`}>
            <label htmlFor="pm-search" className={styles.pmSearchLabel}>
              Search
            </label>
            <input
              id="pm-search"
              className={`${styles.searchInput} ${styles.pmSearchInput}`}
              placeholder="Invoice no, supplier, status…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pm-date-from">Invoice Date From</label>
            <input
              id="pm-date-from"
              type="date"
              className={styles.searchInput}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pm-date-to">Invoice Date To</label>
            <input
              id="pm-date-to"
              type="date"
              className={styles.searchInput}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="pm-mode">Payment Mode</label>
            <select
              id="pm-mode"
              className={styles.select}
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="">All modes</option>
              {paymentModes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="pm-status">Payment Status</label>
            <select
              id="pm-status"
              className={styles.select}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>

        <div className={styles.filterMeta}>
          <span className={styles.chip}>
            Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> filtered (
            {purchases.length} loaded)
          </span>
          <button type="button" className={styles.resetLink} onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      <div className={`${styles.tableWrap} ${styles.pmTableWrap}`}>
        {loading ? (
          <div className={styles.loading}>Loading purchases…</div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${styles.pmTable}`}>
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Invoice Date</th>
                    <th>Supplier</th>
                    <th>Total</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Net Amount</th>
                    <th>Due Date</th>
                    <th>Payment Mode</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        No purchases match these filters.
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{fmt(p.invoice_no)}</strong>
                        </td>
                        <td>{fmtDate(p.invoice_date)}</td>
                        <td>{fmt(p.supplier_name)}</td>
                        <td className={styles.amtCell}>{fmtAmt(p.total_amount)}</td>
                        <td className={styles.amtCell}>{fmtAmt(p.discount)}</td>
                        <td className={styles.amtCell}>{fmtAmt(p.tax_amount)}</td>
                        <td className={styles.amtCell}>
                          <strong>{fmtAmt(p.net_amount)}</strong>
                        </td>
                        <td>{fmtDate(p.due_date)}</td>
                        <td>{fmt(p.payment_mode_name)}</td>
                        <td>
                          <span className={statusBadgeClass(p.payment_status)}>{p.payment_status ?? '—'}</span>
                        </td>
                        <td>
                          <button type="button" className={styles.linkBtn} onClick={() => setSelected(p)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.pagination}>
              <div className={styles.field} style={{ maxWidth: 120 }}>
                <label htmlFor="pm-pagesize">Rows / page</label>
                <select
                  id="pm-pagesize"
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
                  onClick={() => setPage((pg) => Math.max(1, pg - 1))}
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
                  onClick={() => setPage((pg) => Math.min(totalPages, pg + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected ? <PurchaseDetailFullscreen purchase={selected} onClose={() => setSelected(null)} /> : null}

      {showCreate ? (
        <PurchaseEntryModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setPurchases((prev) => [p, ...prev])
            setShowCreate(false)
          }}
        />
      ) : null}
    </div>
  )
}
