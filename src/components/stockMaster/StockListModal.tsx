import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchStockMasters } from '../../services/stockMasterApi'
import type { StockMaster } from '../../types/stockMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type Props = { onClose: () => void }

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value).trim() || '—'
}

function fmtDate(v: unknown): string {
  if (!v) return '—'
  return String(v).slice(0, 10)
}

function daysUntil(dateStr: string | null | undefined): number {
  if (!dateStr) return Infinity
  const t = new Date(String(dateStr).slice(0, 10)).getTime()
  if (Number.isNaN(t)) return Infinity
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((t - now.getTime()) / 86400000)
}

// ── Side detail panel (same visual language as the Item List detail) ──────────

function StockDetail({ row, onClose }: { row: StockMaster; onClose: () => void }) {
  const sections: { title: string; fields: { label: string; value: string }[] }[] = [
    {
      title: 'Batch',
      fields: [
        { label: 'Stock ID', value: fmt(row.id) },
        { label: 'Product', value: fmt(row.item_name) },
        { label: 'Item ID', value: fmt(row.item_id) },
        { label: 'Batch No', value: fmt(row.batch_no) },
        { label: 'Manufacture Date', value: fmtDate(row.manufacture_date) },
        { label: 'Expiry Date', value: fmtDate(row.expiry_date) },
      ],
    },
    {
      title: 'Rates & Quantity',
      fields: [
        { label: 'MRP', value: fmt(row.mrp) },
        { label: 'Purchase Rate', value: fmt(row.purchase_rate) },
        { label: 'Sale Rate', value: fmt(row.sale_rate) },
        { label: 'Quantity', value: fmt(row.quantity) },
        { label: 'Free Quantity', value: fmt(row.free_quantity) },
      ],
    },
    {
      title: 'Location',
      fields: [
        { label: 'Warehouse', value: fmt(row.warehouse_id) },
        { label: 'Rack', value: fmt(row.rack_location) },
      ],
    },
    {
      title: 'System',
      fields: [
        { label: 'Extra Data', value: row.extra_data != null ? JSON.stringify(row.extra_data) : '—' },
        { label: 'Created At', value: fmtDate(row.created_at) },
        { label: 'Updated At', value: fmtDate(row.updated_at) },
      ],
    },
  ]

  return (
    <div
      style={{
        width: 360,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        background: '#fff',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border)',
          background: '#f8fafc',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--medical-deep)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fmt(row.item_name) !== '—' ? fmt(row.item_name) : `Item #${row.item_id}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            Stock {row.id} · Batch {fmt(row.batch_no)}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close detail"
          style={{
            background: '#f1f5f9',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '2rem',
            height: '2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '0.75rem 1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--medical-teal)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.85rem',
                background: '#f1f5f9',
                borderBottom: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--medical-deep)',
              }}
            >
              {section.title}
            </div>
            <div style={{ padding: '0.6rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {section.fields.map((field) => (
                <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{field.label}</span>
                  <span
                    style={{
                      color: field.value === '—' ? 'var(--text-muted)' : 'var(--text-strong)',
                      fontWeight: field.value === '—' ? 400 : 600,
                      textAlign: 'right',
                      wordBreak: 'break-all',
                    }}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Stock List modal (full-screen overlay — same UI as New Purchase / Item List) ─

export function StockListModal({ onClose }: Props) {
  const [rows, setRows] = useState<StockMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<StockMaster | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchStockMasters()
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load stock')
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
      if (e.key === 'Escape') {
        if (selected) {
          setSelected(null)
          return
        }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const hay = [
        row.item_name,
        row.batch_no,
        row.rack_location,
        String(row.item_id),
        String(row.id),
        row.mrp,
        row.sale_rate,
      ]
        .filter((v) => v != null && String(v).trim() !== '')
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search])

  if (loading) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loading}>Loading stock…</div>
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
          <h2>Stock List</h2>
          <p>{filtered.length} of {rows.length} batches · click a row to view full details</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="stock-list-search">Search</label>
            <input
              id="stock-list-search"
              type="text"
              placeholder="Item name, batch no, rack, stock ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> batches
          </span>
          {search ? (
            <button type="button" className={styles.resetLink} onClick={() => setSearch('')}>
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <div className={styles.fsTableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.fsTable}>
                <thead>
                  <tr>
                    <th>Item / Product</th>
                    <th>Batch No</th>
                    <th>Expiry</th>
                    <th>MRP</th>
                    <th>Sale Rate</th>
                    <th>Qty</th>
                    <th>Warehouse</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={7}>No stock found.</td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const isSelected = selected?.id === row.id
                      const d = daysUntil(row.expiry_date)
                      return (
                        <tr
                          key={row.id}
                          className={styles.fsInvoiceRow}
                          onClick={() => setSelected(isSelected ? null : row)}
                          style={isSelected ? { background: '#ecfdf5' } : undefined}
                        >
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: isSelected ? 'var(--medical-deep)' : 'var(--medical-mid)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                              }}
                            >
                              {fmt(row.item_name) !== '—' ? fmt(row.item_name) : `Item #${row.item_id}`}
                            </span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Item ID {row.item_id}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.batch_no)}</td>
                          <td style={{ fontSize: '0.85rem' }}>
                            {fmtDate(row.expiry_date)}
                            {d <= 90 && d >= 0 ? (
                              <div style={{ fontSize: '0.74rem', color: '#c2410c' }}>{d}d left</div>
                            ) : null}
                            {d < 0 ? (
                              <span className={`${styles.badge} ${styles.badgeOff}`} style={{ marginTop: '0.15rem', display: 'inline-flex' }}>
                                Expired
                              </span>
                            ) : null}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{row.mrp ? `₹${row.mrp}` : '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{row.sale_rate ? `₹${row.sale_rate}` : '—'}</td>
                          <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {fmt(row.quantity)}
                            {Number(row.free_quantity) > 0 ? (
                              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>+{row.free_quantity} free</div>
                            ) : null}
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.warehouse_id)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selected ? <StockDetail row={selected} onClose={() => setSelected(null)} /> : null}
      </div>
    </div>
  )
}
