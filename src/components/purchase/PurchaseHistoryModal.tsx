import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPurchaseOutstanding } from '../../services/paymentApi'
import { fetchPurchaseById } from '../../services/purchaseApi'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import type { OutstandingInvoice } from '../../types/payment'
import type { PartyMaster } from '../../types/partyMaster'
import type { Purchase } from '../../types/purchase'
import { SupplierPayDialog, type PayInvoice } from './SupplierPayDialog'
import styles from '../../pages/ProductMasterPage.module.css'

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}
function money(v: unknown): string {
  return `₹${num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? String(s).slice(0, 10) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}
function partyLabel(p: PartyMaster): string {
  const r = p as Record<string, unknown>
  return String(r.party_name ?? r.name ?? `#${p.id}`)
}
function statusBadge(s: string | null | undefined) {
  const k = (s || '').toLowerCase()
  const cls = k === 'paid' ? styles.badgePaid : k === 'partial' ? styles.badgeH : styles.badgeOff
  return <span className={`${styles.badge} ${cls}`}>{s || 'Unpaid'}</span>
}

export function PurchaseHistoryModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<OutstandingInvoice[]>([])
  const [suppliers, setSuppliers] = useState<PartyMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [status, setStatus] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [pay, setPay] = useState<{ supplierId: number; name: string; invoice: PayInvoice } | null>(null)
  const [detail, setDetail] = useState<Purchase | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const [r, s] = await Promise.all([
        fetchPurchaseOutstanding(),
        fetchPartyMasters('Distributor').catch(() => [] as PartyMaster[]),
      ])
      setRows(r)
      setSuppliers(s)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load purchase history')
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
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !pay && !detail) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pay, detail])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (supplierId && String(r.supplier_id) !== supplierId) return false
      if (status && (r.payment_status || '').toLowerCase() !== status.toLowerCase()) return false
      const d = (r.invoice_date || '').slice(0, 10)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
      if (q) {
        const hay = `${r.invoice_no ?? ''} ${r.supplier_name ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [rows, search, supplierId, status, from, to])

  const totals = useMemo(() => ({
    net: filtered.reduce((s, r) => s + num(r.net_amount), 0),
    paid: filtered.reduce((s, r) => s + num(r.total_paid), 0),
    out: filtered.reduce((s, r) => s + num(r.outstanding_amount), 0),
  }), [filtered])

  async function openDetail(id: number) {
    setDetailLoading(true)
    try {
      setDetail(await fetchPurchaseById(id))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load purchase')
    } finally {
      setDetailLoading(false)
    }
  }

  const hasFilters = search || supplierId || status || from || to

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>📜 Purchase History</h2>
          <p>All purchase bills with paid / outstanding — view items and pay suppliers</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label>Search</label>
            <input type="text" placeholder="Invoice no or supplier…" value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
          </div>
          <div className={styles.fsFilterField}>
            <label>Supplier</label>
            <select className={styles.select} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">All</option>
              {suppliers.map((s) => <option key={s.id} value={String(s.id)}>{partyLabel(s)}</option>)}
            </select>
          </div>
          <div className={styles.fsFilterField}>
            <label>Status</label>
            <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <div className={styles.fsFilterField}><label>From</label><input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></div>
          <div className={styles.fsFilterField}><label>To</label><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            <strong>{filtered.length}</strong> bills · net <strong>{money(totals.net)}</strong> · paid <strong>{money(totals.paid)}</strong> · outstanding <strong>{money(totals.out)}</strong>
          </span>
          {hasFilters ? (
            <button type="button" className={styles.resetLink} onClick={() => { setSearch(''); setSupplierId(''); setStatus(''); setFrom(''); setTo('') }}>Reset</button>
          ) : null}
        </div>
      </div>

      <div className={styles.fsBody}>
        {err ? <div className={`${styles.banner} ${styles.bannerError}`} style={{ marginBottom: '1rem' }}>{err}</div> : null}
        {loading ? (
          <div className={styles.loading}>Loading purchase history…</div>
        ) : (
          <div className={styles.fsTableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.fsTable}>
                <thead>
                  <tr>
                    <th>Invoice</th><th>Date</th><th>Supplier</th>
                    <th>Net</th><th>Paid</th><th>Outstanding</th><th>Status</th><th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}><td colSpan={8}>No purchase bills match these filters.</td></tr>
                  ) : filtered.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.invoice_no ?? `#${r.id}`}</strong></td>
                      <td>{fmtDate(r.invoice_date)}{r.is_overdue ? <span className={`${styles.badge} ${styles.badgeOff}`} style={{ marginLeft: 6 }}>{r.days_overdue}d</span> : null}</td>
                      <td>{r.supplier_name ?? '—'}</td>
                      <td className={styles.amtCell}>{money(r.net_amount)}</td>
                      <td className={styles.amtCell}>{money(r.total_paid)}</td>
                      <td className={styles.amtCell}><strong>{money(r.outstanding_amount)}</strong></td>
                      <td>{statusBadge(r.payment_status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button type="button" className={styles.linkBtn} onClick={() => void openDetail(r.id)}>View</button>
                          {num(r.outstanding_amount) > 0 && r.supplier_id ? (
                            <button type="button" className={styles.linkBtn} onClick={() => setPay({ supplierId: r.supplier_id!, name: r.supplier_name ?? '', invoice: { id: r.id, no: r.invoice_no ?? `#${r.id}`, outstanding: num(r.outstanding_amount) } })}>Pay</button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {pay ? (
        <SupplierPayDialog
          supplierId={pay.supplierId}
          supplierName={pay.name}
          invoice={pay.invoice}
          onClose={() => setPay(null)}
          onDone={() => void load()}
        />
      ) : null}

      {(detail || detailLoading) ? (
        <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null) }}>
          <div className={`${styles.modal} ${styles.modalWide}`} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <div className={styles.modalHeadMain}>
                <h2>🧾 {detail?.invoice_no ?? 'Purchase'}</h2>
                <p>{detail?.supplier_name ?? ''}{detail?.invoice_date ? ` · ${fmtDate(detail.invoice_date)}` : ''}</p>
              </div>
              <button type="button" className={styles.closeX} onClick={() => setDetail(null)} aria-label="Close">×</button>
            </div>
            <div className={styles.modalBody}>
              {detailLoading ? (
                <div className={styles.loading}>Loading…</div>
              ) : detail ? (
                <div className={styles.tableScroll} style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
                  <table className={styles.table}>
                    <thead><tr><th>Item</th><th>Batch</th><th>Qty</th><th>Rate</th><th>MRP</th><th>GST%</th><th>Total</th></tr></thead>
                    <tbody>
                      {(detail.items ?? []).map((it) => (
                        <tr key={it.id}>
                          <td className={styles.nameCell}><div className={styles.nameMain}>{it.item_name ?? `Item #${it.item_id}`}</div></td>
                          <td>{it.batch_no ?? '—'}</td>
                          <td className={styles.amtCell}>{num(it.quantity)}{num(it.free_quantity) ? ` (+${num(it.free_quantity)})` : ''}</td>
                          <td className={styles.amtCell}>{money(it.purchase_rate)}</td>
                          <td className={styles.amtCell}>{money(it.mrp)}</td>
                          <td className={styles.amtCell}>{num(it.gst_percent)}%</td>
                          <td className={styles.amtCell}><strong>{money(it.total)}</strong></td>
                        </tr>
                      ))}
                      {(detail.items ?? []).length === 0 ? (
                        <tr className={styles.emptyRow}><td colSpan={7}>No line items.</td></tr>
                      ) : null}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5f9' }}>
                        <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700 }}>Net Amount</td>
                        <td className={styles.amtCell}><strong>{money(detail.net_amount)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : null}
            </div>
            <div className={styles.modalFoot}>
              <button type="button" className={styles.btnGhost} onClick={() => setDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
