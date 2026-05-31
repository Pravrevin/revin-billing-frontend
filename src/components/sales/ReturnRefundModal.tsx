import { useEffect, useMemo, useState } from 'react'
import { fetchAllSales } from '../../services/salesApi'
import { fetchPaymentModes } from '../../services/paymentModeApi'
import { createSalesReturn, fetchReturnable } from '../../services/salesReturnApi'
import type { Sale } from '../../types/sales'
import type { PaymentMode } from '../../types/payment'
import type { Returnable, ReturnableLine } from '../../types/salesReturn'
import styles from '../../pages/ProductMasterPage.module.css'

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}
function inr(v: unknown): string {
  return `₹${num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function todayStr() { return new Date().toISOString().slice(0, 10) }

/** Tax portion of a tax-inclusive amount at the given GST %. */
function inclusiveTax(total: number, gst: number): number {
  if (gst <= 0) return 0
  return +(total - (total * 100) / (100 + gst)).toFixed(2)
}

export function ReturnRefundModal({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [search, setSearch] = useState('')
  const [saleId, setSaleId] = useState('')
  const [returnable, setReturnable] = useState<Returnable | null>(null)
  const [qty, setQty] = useState<Record<number, string>>({})

  const [reason, setReason] = useState('')
  const [refundMode, setRefundMode] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundEdited, setRefundEdited] = useState(false)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [done, setDone] = useState<{ no: string; refund: number } | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    void (async () => {
      const [s, m] = await Promise.all([
        fetchAllSales().catch(() => [] as Sale[]),
        fetchPaymentModes().catch(() => [] as PaymentMode[]),
      ])
      setSales(s)
      setModes(m)
      const cash = m.find((x) => x.mode_name.toLowerCase() === 'cash')
      setRefundMode(cash ? String(cash.id) : m[0] ? String(m[0].id) : '')
    })()
  }, [])

  useEffect(() => {
    if (!saleId) { setReturnable(null); setQty({}); return }
    setLoading(true)
    setErr(null)
    void fetchReturnable(parseInt(saleId))
      .then((r) => { setReturnable(r); setQty({}); setRefundEdited(false) })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Failed to load invoice'))
      .finally(() => setLoading(false))
  }, [saleId])

  const filteredSales = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = [...sales].sort((a, b) => b.id - a.id)
    if (!q) return list.slice(0, 100)
    return list.filter((s) =>
      (s.invoice_no ?? '').toLowerCase().includes(q) ||
      String(s.id) === q ||
      (s.invoice_date ?? '').includes(q),
    ).slice(0, 100)
  }, [sales, search])

  function lineTotal(line: ReturnableLine): number {
    const q = num(qty[line.sales_item_id])
    return +(q * num(line.sale_rate)).toFixed(2)
  }

  const refundComputed = useMemo(() => {
    if (!returnable) return 0
    return +returnable.lines.reduce((s, l) => s + lineTotal(l), 0).toFixed(2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnable, qty])

  useEffect(() => {
    if (!refundEdited) setRefundAmount(refundComputed ? refundComputed.toFixed(2) : '')
  }, [refundComputed, refundEdited])

  const anyQty = returnable?.lines.some((l) => num(qty[l.sales_item_id]) > 0) ?? false

  function setLineQty(line: ReturnableLine, val: string) {
    const max = num(line.returnable_qty)
    let v = val
    if (num(val) > max) v = String(max)
    if (num(val) < 0) v = '0'
    setQty((p) => ({ ...p, [line.sales_item_id]: v }))
  }

  async function submit() {
    if (!returnable) return
    setErr(null)
    const items = returnable.lines
      .filter((l) => num(qty[l.sales_item_id]) > 0)
      .map((l) => {
        const q = num(qty[l.sales_item_id])
        const total = +(q * num(l.sale_rate)).toFixed(2)
        return {
          sales_item_id: l.sales_item_id,
          item_id: l.item_id,
          batch_no: l.batch_no,
          quantity: q,
          mrp: l.mrp != null ? num(l.mrp) : null,
          sale_rate: l.sale_rate != null ? num(l.sale_rate) : null,
          gst_percent: l.gst_percent != null ? num(l.gst_percent) : null,
          tax_amount: inclusiveTax(total, num(l.gst_percent)),
          total,
          expiry_date: l.expiry_date,
        }
      })
    if (items.length === 0) { setErr('Enter a return quantity for at least one item.'); return }
    setSaving(true)
    try {
      const created = await createSalesReturn({
        sales_id: returnable.sales_id,
        return_date: todayStr(),
        reason: reason.trim() || null,
        refund_amount: refundAmount === '' ? null : num(refundAmount),
        refund_mode_id: refundMode ? parseInt(refundMode) : null,
        items,
      })
      setDone({ no: created.return_no ?? `#${created.id}`, refund: num(created.refund_amount) })
      onDone?.()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to record return')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`${styles.modal} ${styles.modalWide}`} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2>↩️ Sales Return / Refund</h2>
            <p>Return goods to stock and refund the customer — inventory updates automatically</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          {done ? (
            <div className={`${styles.banner} ${styles.bannerSuccess}`} style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem' }}>✅</div>
              <h3 style={{ margin: '0.5rem 0' }}>Return {done.no} recorded</h3>
              <p style={{ margin: 0 }}>
                Stock has been added back to inventory{done.refund > 0 ? ` and ${inr(done.refund)} refunded` : ''}.
              </p>
            </div>
          ) : (
            <>
              {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}

              {/* Invoice picker */}
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label>Find invoice</label>
                  <input type="text" placeholder="Search by invoice no, sale ID or date…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label>Sales Invoice *</label>
                  <select className={styles.searchInput} value={saleId} onChange={(e) => setSaleId(e.target.value)}>
                    <option value="">— Select an invoice to return —</option>
                    {filteredSales.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {(s.invoice_no ?? `Sale #${s.id}`)} · {(s.invoice_date ?? '').slice(0, 10) || '—'} · {inr(s.net_amount)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className={styles.loading}>Loading invoice…</div>
              ) : returnable ? (
                <>
                  <p style={{ margin: '0.5rem 0 0.75rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                    Customer: <strong style={{ color: 'var(--text-strong)' }}>{returnable.customer_name ?? 'Walk-in'}</strong>
                    {returnable.invoice_no ? ` · Invoice ${returnable.invoice_no}` : ''}
                  </p>

                  <div className={styles.tableScroll} style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Item</th><th>Batch</th><th>Sold</th><th>Returned</th><th>Returnable</th>
                          <th>Rate</th><th>Return Qty</th><th>Refund</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnable.lines.map((l) => {
                          const max = num(l.returnable_qty)
                          return (
                            <tr key={l.sales_item_id}>
                              <td className={styles.nameCell}>
                                <div className={styles.nameMain}>{l.item_name ?? `Item #${l.item_id}`}</div>
                              </td>
                              <td>{l.batch_no ?? '—'}</td>
                              <td className={styles.amtCell}>{num(l.sold_qty)}</td>
                              <td className={styles.amtCell}>{num(l.returned_qty)}</td>
                              <td className={styles.amtCell}><strong>{max}</strong></td>
                              <td className={styles.amtCell}>{inr(l.sale_rate)}</td>
                              <td>
                                <input
                                  type="number" min={0} max={max} step="1"
                                  value={qty[l.sales_item_id] ?? ''}
                                  disabled={max <= 0}
                                  onChange={(e) => setLineQty(l, e.target.value)}
                                  style={{ width: 80, padding: '0.35rem 0.5rem', borderRadius: 8, border: '1px solid var(--border-strong)' }}
                                />
                              </td>
                              <td className={styles.amtCell}><strong>{inr(lineTotal(l))}</strong></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.formGrid} style={{ marginTop: '1rem' }}>
                    <div className={styles.formField}>
                      <label>Reason</label>
                      <input type="text" placeholder="e.g. Damaged / Wrong item / Expired" value={reason} onChange={(e) => setReason(e.target.value)} />
                    </div>
                    <div className={styles.formField}>
                      <label>Refund via</label>
                      <select className={styles.searchInput} value={refundMode} onChange={(e) => setRefundMode(e.target.value)}>
                        <option value="">— No cash refund —</option>
                        {modes.map((m) => <option key={m.id} value={String(m.id)}>{m.mode_name}</option>)}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <label>Refund Amount</label>
                      <input type="number" min={0} step="0.01" value={refundAmount}
                        onChange={(e) => { setRefundEdited(true); setRefundAmount(e.target.value) }} />
                    </div>
                  </div>
                </>
              ) : null}
            </>
          )}
        </div>

        <div className={styles.modalFoot}>
          {done ? (
            <button type="button" className={styles.btnPrimary} onClick={onClose}>Done</button>
          ) : (
            <>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
              <button type="button" className={styles.btnPrimary} onClick={() => void submit()} disabled={saving || !anyQty}>
                {saving ? 'Processing…' : 'Process Return & Refund'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
