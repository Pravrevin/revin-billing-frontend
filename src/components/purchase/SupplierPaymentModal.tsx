import { useCallback, useEffect, useState } from 'react'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import { fetchPartyOutstandingSummary, fetchPurchaseOutstanding } from '../../services/paymentApi'
import type { OutstandingInvoice, OutstandingSummary } from '../../types/payment'
import type { PartyMaster } from '../../types/partyMaster'
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

export function SupplierPaymentModal({ onClose }: { onClose: () => void }) {
  const [suppliers, setSuppliers] = useState<PartyMaster[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [summary, setSummary] = useState<OutstandingSummary | null>(null)
  const [bills, setBills] = useState<OutstandingInvoice[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pay, setPay] = useState<{ invoice: PayInvoice | null } | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    void fetchPartyMasters('Distributor').then(setSuppliers).catch((e) =>
      setErr(e instanceof Error ? e.message : 'Failed to load suppliers'))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !pay) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, pay])

  const loadSupplier = useCallback(async (id: number) => {
    setLoading(true)
    setErr(null)
    try {
      const [sum, out] = await Promise.all([
        fetchPartyOutstandingSummary(id),
        fetchPurchaseOutstanding(id),
      ])
      setSummary(sum)
      setBills(out.filter((o) => num(o.outstanding_amount) > 0))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load supplier')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (supplierId) void loadSupplier(parseInt(supplierId))
    else { setSummary(null); setBills([]) }
  }, [supplierId, loadSupplier])

  const supplierName = suppliers.find((s) => String(s.id) === supplierId)
  const summaryCards = summary ? [
    { label: 'Total Billed', value: money(summary.total_invoiced) },
    { label: 'Total Paid', value: money(summary.total_settled) },
    { label: 'Outstanding', value: money(summary.total_outstanding), strong: true },
    { label: 'Overdue', value: money(summary.overdue_amount), warn: true },
  ] : []

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>💸 Supplier Payment</h2>
          <p>Pick a supplier, see what you owe, and record payments against bills</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsBody}>
        {err ? <div className={`${styles.banner} ${styles.bannerError}`} style={{ marginBottom: '1rem' }}>{err}</div> : null}

        <div className={styles.formField} style={{ maxWidth: 380, marginBottom: '1.25rem' }}>
          <label htmlFor="sp-supplier">Supplier *</label>
          <select id="sp-supplier" className={styles.select} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}
            style={{ padding: '0.55rem 0.65rem', borderRadius: 9, border: '1px solid var(--border)', fontSize: '0.9rem', background: '#fff' }}>
            <option value="">— Select supplier —</option>
            {suppliers.map((s) => <option key={s.id} value={String(s.id)}>{partyLabel(s)}</option>)}
          </select>
        </div>

        {!supplierId ? (
          <p style={{ color: 'var(--text-muted)' }}>Select a supplier to view outstanding bills and record a payment.</p>
        ) : loading ? (
          <div className={styles.loading}>Loading…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
              {summaryCards.map((c) => (
                <div key={c.label} style={{
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${c.warn ? '#dc2626' : c.strong ? 'var(--medical-teal)' : '#cbd5e1'}`,
                  borderRadius: 10, padding: '0.75rem 0.95rem', background: '#fff',
                }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.25rem', color: c.warn ? '#b91c1c' : 'var(--text-strong)' }}>{c.value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <h3 className={styles.fsSectionTitle} style={{ margin: 0 }}>Outstanding Bills ({bills.length})</h3>
              <button type="button" className={styles.btnPrimary} style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                onClick={() => setPay({ invoice: null })} disabled={!supplierId}>
                + On-account Payment
              </button>
            </div>

            <div className={styles.fsTableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.fsTable}>
                  <thead>
                    <tr><th>Invoice</th><th>Date</th><th>Due</th><th>Net</th><th>Paid</th><th>Outstanding</th><th aria-label="Pay" /></tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 ? (
                      <tr className={styles.emptyRow}><td colSpan={7}>🎉 No outstanding bills — fully settled.</td></tr>
                    ) : bills.map((o) => (
                      <tr key={o.id}>
                        <td><strong>{o.invoice_no ?? `#${o.id}`}</strong></td>
                        <td>{fmtDate(o.invoice_date)}</td>
                        <td>{fmtDate(o.effective_due_date ?? o.due_date)}{o.is_overdue ? <span className={`${styles.badge} ${styles.badgeOff}`} style={{ marginLeft: 6 }}>{o.days_overdue}d</span> : null}</td>
                        <td className={styles.amtCell}>{money(o.net_amount)}</td>
                        <td className={styles.amtCell}>{money(o.total_paid)}</td>
                        <td className={styles.amtCell}><strong>{money(o.outstanding_amount)}</strong></td>
                        <td>
                          <button type="button" className={styles.linkBtn}
                            onClick={() => setPay({ invoice: { id: o.id, no: o.invoice_no ?? `#${o.id}`, outstanding: num(o.outstanding_amount) } })}>
                            Pay
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {pay && supplierId ? (
        <SupplierPayDialog
          supplierId={parseInt(supplierId)}
          supplierName={supplierName ? partyLabel(supplierName) : undefined}
          invoice={pay.invoice}
          onClose={() => setPay(null)}
          onDone={() => void loadSupplier(parseInt(supplierId))}
        />
      ) : null}
    </div>
  )
}
