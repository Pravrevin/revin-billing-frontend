import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPurchasesByPartyId } from '../../services/purchaseApi'
import type { Purchase, PurchaseItem } from '../../types/purchase'
import styles from '../../pages/ProductMasterPage.module.css'

// ── helpers ────────────────────────────────────────────────────────────────────

function fmt(v: string | number | null | undefined, prefix = ''): string {
  if (v == null || v === '') return '—'
  const s = String(v).trim()
  return s ? `${prefix}${s}` : '—'
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

// ── Invoice List View ──────────────────────────────────────────────────────────

type InvoiceListProps = {
  partyName: string
  purchases: Purchase[]
  onSelect: (p: Purchase) => void
  onClose: () => void
}

function InvoiceListView({ partyName, purchases, onSelect, onClose }: InvoiceListProps) {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [search, setSearch]     = useState('')

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      const d = p.invoice_date ?? p.entry_date ?? ''
      if (dateFrom && d && d.slice(0, 10) < dateFrom) return false
      if (dateTo   && d && d.slice(0, 10) > dateTo)   return false
      if (search) {
        const q = search.toLowerCase()
        const haystack = [
          p.invoice_no, p.supplier_name, String(p.net_amount ?? ''),
        ].join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [purchases, dateFrom, dateTo, search])

  const resetFilters = () => { setDateFrom(''); setDateTo(''); setSearch('') }

  const anyFilter = dateFrom || dateTo || search

  return (
    <div className={styles.overlayFullscreen}>
      {/* header */}
      <div className={styles.fsHeader}>
        <div className={styles.fsHeaderTitle}>
          <h2>Purchase Bills — {partyName}</h2>
          <p>{filtered.length} of {purchases.length} invoices</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      {/* filters */}
      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="fs-search">Search</label>
            <input
              id="fs-search"
              type="text"
              placeholder="Invoice no, supplier…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.fsFilterField}>
            <label htmlFor="fs-date-from">Invoice Date From</label>
            <input id="fs-date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          <div className={styles.fsFilterField}>
            <label htmlFor="fs-date-to">Invoice Date To</label>
            <input id="fs-date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>

        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{purchases.length}</strong> invoices
          </span>
          {anyFilter
            ? <button type="button" className={styles.resetLink} onClick={resetFilters}>Reset filters</button>
            : null}
        </div>
      </div>

      {/* table */}
      <div className={styles.fsBody}>
        <div className={styles.fsTableWrap}>
          <div className={styles.tableScroll}>
            <table className={styles.fsTable}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Invoice Date</th>
                  <th>Entry Date</th>
                  <th>Due Date</th>
                  <th>Supplier</th>
                  <th>Net Amount</th>
                  <th>Disc %</th>
                  <th>Disc Amount</th>
                  <th>Tax %</th>
                  <th>Tax Amount</th>
                  <th>Created At</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className={styles.emptyRow}>
                    <td colSpan={12}>No invoices match the current filters.</td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <button
                          type="button"
                          className={styles.linkBtn}
                          onClick={() => onSelect(p)}
                          title="Click to view items"
                        >
                          {fmt(p.invoice_no)}
                        </button>
                      </td>
                      <td>{fmtDate(p.invoice_date)}</td>
                      <td>{fmtDate(p.entry_date)}</td>
                      <td>{fmtDate(p.due_date)}</td>
                      <td>{fmt(p.supplier_name)}</td>
                      <td className={styles.amtCell}><strong>{fmtAmt(p.net_amount)}</strong></td>
                      <td className={styles.amtCell}>{fmt(p.discount_percentage)}</td>
                      <td className={styles.amtCell}>{fmtAmt(p.discount_amount)}</td>
                      <td className={styles.amtCell}>{fmt(p.tax_percentage)}</td>
                      <td className={styles.amtCell}>{fmtAmt(p.tax_amount)}</td>
                      <td>{fmtDate(p.created_at)}</td>
                      <td className={styles.amtCell}><strong>{fmtAmt(p.total_amount)}</strong></td>
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

// ── Invoice Detail View ────────────────────────────────────────────────────────

type InvoiceDetailProps = {
  purchase: Purchase
  partyName: string
  onBack: () => void
  onClose: () => void
}

function InvoiceDetailView({ purchase: p, partyName, onBack, onClose }: InvoiceDetailProps) {
  const [batchFilter, setBatchFilter] = useState('')
  const [itemSearch, setItemSearch]   = useState('')

  const items: PurchaseItem[] = useMemo(() => p.items ?? p.purchase_items ?? [], [p.items, p.purchase_items])

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (batchFilter && !(it.batch_no ?? '').toLowerCase().includes(batchFilter.toLowerCase())) return false
      if (itemSearch) {
        const q = itemSearch.toLowerCase()
        const hay = [
          it.item_name, it.batch_no, String(it.mrp ?? ''),
          String(it.total ?? ''), it.expiry_date,
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, batchFilter, itemSearch])

  const anyItemFilter = batchFilter || itemSearch

  const resetItemFilters = () => { setBatchFilter(''); setItemSearch('') }

  const metaFields: { label: string; value: string }[] = [
    { label: 'Invoice No',      value: fmt(p.invoice_no) },
    { label: 'Invoice Date',    value: fmtDate(p.invoice_date) },
    { label: 'Entry Date',      value: fmtDate(p.entry_date) },
    { label: 'Due Date',        value: fmtDate(p.due_date) },
    { label: 'Supplier',        value: fmt(p.supplier_name) },
    { label: 'Total Amount',    value: fmtAmt(p.total_amount) },
    { label: 'Disc %',          value: fmt(p.discount_percentage) },
    { label: 'Disc Amount',     value: fmtAmt(p.discount_amount) },
    { label: 'Tax %',           value: fmt(p.tax_percentage) },
    { label: 'Tax Amount',      value: fmtAmt(p.tax_amount) },
    { label: 'Net Amount',      value: fmtAmt(p.net_amount) },
    { label: 'Created At',      value: fmtDate(p.created_at) },
    { label: 'Updated At',      value: fmtDate(p.updated_at) },
  ]

  return (
    <div className={styles.overlayFullscreen}>
      {/* header */}
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onBack}>
          ← Back to invoices
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2>{fmt(p.invoice_no)} — {partyName}</h2>
          <p>Invoice date {fmtDate(p.invoice_date)} · Net {fmtAmt(p.net_amount)}</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsBody}>
        {/* invoice metadata */}
        <div className={styles.fsKvSection}>
          <div className={styles.fsKvSectionHead}>Invoice Summary</div>
          <div className={styles.fsKvGrid}>
            {metaFields.map(({ label, value }) => (
              <div key={label} className={styles.fsKv}>
                <div className={styles.fsKvLabel}>{label}</div>
                <div className={styles.fsKvValue}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* items section */}
        <h3 className={styles.fsSectionTitle}>Line Items ({items.length})</h3>

        {/* item filters */}
        <div className={`${styles.filterCard}`} style={{ marginBottom: '0.85rem' }}>
          <div className={styles.fsFilterRow}>
            <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
              <label htmlFor="item-search">Search items</label>
              <input
                id="item-search"
                type="text"
                placeholder="Item name, expiry, amount…"
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className={styles.fsFilterField}>
              <label htmlFor="item-batch">Batch No</label>
              <input
                id="item-batch"
                type="text"
                placeholder="Filter by batch…"
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <div className={styles.fsFilterMeta}>
            <span className={styles.chip}>
              Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> items
            </span>
            {anyItemFilter
              ? <button type="button" className={styles.resetLink} onClick={resetItemFilters}>Reset</button>
              : null}
          </div>
        </div>

        {/* items table */}
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
                  <tr className={styles.emptyRow}>
                    <td colSpan={13}>No items match the current filters.</td>
                  </tr>
                ) : (
                  filteredItems.map((it, idx) => (
                    <tr key={it.id}>
                      <td>{idx + 1}</td>
                      <td><strong>{fmt(it.item_name)}</strong></td>
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
                      <td className={styles.amtCell}><strong>{fmtAmt(it.total)}</strong></td>
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

// ── Root component ─────────────────────────────────────────────────────────────

type Props = {
  partyId: number
  partyName: string
  onClose: () => void
}

export function DistributorBillsModal({ partyId, partyName, onClose }: Props) {
  const [loading, setLoading]     = useState(true)
  const [err, setErr]             = useState<string | null>(null)
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [selected, setSelected]   = useState<Purchase | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchPurchasesByPartyId(partyId)
      setPurchases(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load purchases')
    } finally {
      setLoading(false)
    }
  }, [partyId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  if (loading) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loading}>Loading purchases…</div>
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

  if (selected) {
    return (
      <InvoiceDetailView
        purchase={selected}
        partyName={partyName}
        onBack={() => setSelected(null)}
        onClose={onClose}
      />
    )
  }

  return (
    <InvoiceListView
      partyName={partyName}
      purchases={purchases}
      onSelect={setSelected}
      onClose={onClose}
    />
  )
}
