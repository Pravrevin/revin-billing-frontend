import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import {
  createPayment,
  fetchPartyLedger,
  fetchPartyOutstandingSummary,
  fetchSalesOutstanding,
  uploadPaymentReceipt,
} from '../../services/paymentApi'
import { fetchPaymentModes } from '../../services/paymentModeApi'
import type { PartyMaster } from '../../types/partyMaster'
import type { LedgerEntry, OutstandingSale, OutstandingSummary, PaymentMode } from '../../types/payment'
import styles from '../../pages/ProductMasterPage.module.css'

function n(v: unknown): number {
  const x = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(x) ? 0 : x
}
function inr(v: unknown): string {
  return n(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// ── Record-receipt sub-modal (collect money against a sales bill) ─────────────

function RecordReceiptModal({
  customerId,
  invoice,
  modes,
  onClose,
  onPaid,
}: {
  customerId: number
  invoice: OutstandingSale
  modes: PaymentMode[]
  onClose: () => void
  onPaid: () => void
}) {
  const outstanding = n(invoice.outstanding_amount)
  const [amount, setAmount] = useState(String(outstanding.toFixed(2)))
  const [modeId, setModeId] = useState(() => {
    const cash = modes.find((m) => m.mode_name.toLowerCase() === 'cash')
    return cash ? String(cash.id) : modes[0] ? String(modes[0].id) : ''
  })
  const [txnDate, setTxnDate] = useState(todayStr())
  const [refNo, setRefNo] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const modeName = (modes.find((m) => String(m.id) === modeId)?.mode_name ?? '').toLowerCase()
  const isCheque = modeName === 'cheque'
  const isUpiOrCard = modeName === 'upi' || modeName === 'card'

  async function submit() {
    setErr(null)
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) { setErr('Enter a valid amount.'); return }
    if (amt > outstanding + 0.001) { setErr(`Amount cannot exceed the outstanding ₹${inr(outstanding)}.`); return }
    if (isUpiOrCard && !receiptFile) { setErr('Please attach the payment receipt for a UPI / Card payment.'); return }
    setSaving(true)
    try {
      const payment = await createPayment({
        party_id: customerId,
        txn_type: 'RECEIPT',
        reference_type: 'sale',
        reference_id: invoice.id,
        txn_date: txnDate,
        amount: amt,
        payment_mode_id: parseInt(modeId) || undefined,
        reference_no: refNo.trim() || undefined,
      })
      if (isUpiOrCard && receiptFile) await uploadPaymentReceipt(payment.id, receiptFile)
      onPaid()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to record receipt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2>Record Receipt</h2>
            <p>Bill {invoice.invoice_no ?? `#${invoice.id}`} · Outstanding ₹{inr(outstanding)}</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}>
          {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="rr-amount">Amount *</label>
              <input id="rr-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label htmlFor="rr-mode">Payment Mode</label>
              <select id="rr-mode" className={styles.searchInput} value={modeId} onChange={(e) => setModeId(e.target.value)}>
                {modes.map((m) => <option key={m.id} value={String(m.id)}>{m.mode_name}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label htmlFor="rr-date">Receipt Date</label>
              <input id="rr-date" type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label htmlFor="rr-ref">{isCheque ? 'Cheque No' : isUpiOrCard ? 'UPI / UTR / Txn No' : 'Reference No'}</label>
              <input id="rr-ref" type="text" placeholder={isCheque ? 'e.g. 045123' : 'optional'} value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </div>
            {isUpiOrCard ? (
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label htmlFor="rr-receipt">Payment Receipt (image / PDF) *</label>
                <input id="rr-receipt" type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                {receiptFile ? <span style={{ fontSize: '0.78rem', color: 'var(--medical-deep)', marginTop: '0.25rem' }}>Selected: {receiptFile.name}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className={styles.btnPrimary} onClick={() => void submit()} disabled={saving}>
            {saving ? 'Saving…' : 'Record Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Customer Ledger (full-screen) ─────────────────────────────────────────────

export function CustomerLedgerModal({ onClose }: { onClose: () => void }) {
  const [customers, setCustomers] = useState<PartyMaster[]>([])
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [customerId, setCustomerId] = useState('')

  const [summary, setSummary] = useState<OutstandingSummary | null>(null)
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [outstanding, setOutstanding] = useState<OutstandingSale[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [payInvoice, setPayInvoice] = useState<OutstandingSale | null>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const [c, m] = await Promise.all([
          fetchPartyMasters('Customer'),
          fetchPaymentModes().catch(() => [] as PaymentMode[]),
        ])
        setCustomers(c)
        setModes(m)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed to load customers')
      }
    })()
  }, [])

  const loadLedger = useCallback(async (id: number) => {
    setLoading(true)
    setErr(null)
    try {
      const [sum, led, out] = await Promise.all([
        fetchPartyOutstandingSummary(id),
        fetchPartyLedger(id),
        fetchSalesOutstanding(id),
      ])
      setSummary(sum)
      setLedger(led)
      setOutstanding(out.filter((o) => n(o.outstanding_amount) > 0))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (customerId) void loadLedger(parseInt(customerId))
    else { setSummary(null); setLedger([]); setOutstanding([]) }
  }, [customerId, loadLedger])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !payInvoice) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, payInvoice])

  const name = (c: PartyMaster) => String(c.party_name ?? c.name ?? `Customer #${c.id}`)

  // Running balance (debtor): debit = sales invoice (they owe), credit = receipt.
  let running = 0

  const summaryCards = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Total Invoiced', value: inr(summary.total_invoiced) },
      { label: 'Total Received', value: inr(summary.total_settled) },
      { label: 'Outstanding', value: inr(summary.total_outstanding), strong: true },
      { label: 'Overdue', value: inr(summary.overdue_amount), warn: true },
    ]
  }, [summary])

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>📒 Customer Ledger</h2>
          <p>Track each customer's bills, what they owe, and record receipts</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsBody}>
        {err ? <div className={`${styles.banner} ${styles.bannerError}`} style={{ marginBottom: '1rem' }}>{err}</div> : null}

        <div className={styles.formField} style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <label htmlFor="cust-pick">Customer</label>
          <select
            id="cust-pick"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ padding: '0.55rem 0.65rem', borderRadius: '9px', border: '1px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit', background: '#fff' }}
          >
            <option value="">— Select Customer —</option>
            {customers.map((c) => <option key={c.id} value={String(c.id)}>{name(c)}</option>)}
          </select>
        </div>

        {!customerId ? (
          <p style={{ color: 'var(--text-muted)' }}>Select a customer to view their bills, balance and ledger.</p>
        ) : loading ? (
          <div className={styles.loading}>Loading ledger…</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
              {summaryCards.map((c) => (
                <div key={c.label} style={{ border: '1px solid var(--border)', borderLeft: `3px solid ${c.warn ? '#dc2626' : c.strong ? 'var(--medical-teal)' : '#cbd5e1'}`, borderRadius: '10px', padding: '0.75rem 0.95rem', background: '#fff' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '0.25rem', color: c.warn ? '#b91c1c' : 'var(--text-strong)' }}>₹{c.value}</div>
                </div>
              ))}
            </div>

            {/* Outstanding bills */}
            <h3 className={styles.fsSectionTitle}>Outstanding Bills ({outstanding.length})</h3>
            <div className={styles.fsTableWrap} style={{ marginBottom: '1.5rem' }}>
              <div className={styles.tableScroll}>
                <table className={styles.fsTable}>
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Date</th>
                      <th>Net</th>
                      <th>Received</th>
                      <th>Outstanding</th>
                      <th>Status</th>
                      <th aria-label="Receipt" />
                    </tr>
                  </thead>
                  <tbody>
                    {outstanding.length === 0 ? (
                      <tr className={styles.emptyRow}><td colSpan={7}>🎉 No outstanding bills — fully settled.</td></tr>
                    ) : (
                      outstanding.map((o) => (
                        <tr key={o.id}>
                          <td><strong>{o.invoice_no ?? `#${o.id}`}</strong></td>
                          <td>{o.invoice_date?.slice(0, 10) ?? '—'}{o.is_overdue ? <span className={`${styles.badge} ${styles.badgeOff}`} style={{ marginLeft: '0.35rem' }}>{o.days_overdue}d overdue</span> : null}</td>
                          <td className={styles.amtCell}>₹{inr(o.net_amount)}</td>
                          <td className={styles.amtCell}>₹{inr(o.total_received)}</td>
                          <td className={styles.amtCell}><strong>₹{inr(o.outstanding_amount)}</strong></td>
                          <td>{o.payment_status ?? '—'}</td>
                          <td><button type="button" className={styles.linkBtn} onClick={() => setPayInvoice(o)}>Record Receipt</button></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Account statement */}
            <h3 className={styles.fsSectionTitle}>Account Statement</h3>
            <div className={styles.fsTableWrap}>
              <div className={styles.tableScroll}>
                <table className={styles.fsTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Particulars</th>
                      <th>Debit</th>
                      <th>Credit</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.length === 0 ? (
                      <tr className={styles.emptyRow}><td colSpan={5}>No transactions yet.</td></tr>
                    ) : (
                      ledger.map((e, i) => {
                        running += n(e.debit) - n(e.credit)
                        const bal = running
                        return (
                          <tr key={i}>
                            <td>{e.entry_date?.slice(0, 10)}</td>
                            <td>{e.description}</td>
                            <td className={styles.amtCell}>{n(e.debit) ? `₹${inr(e.debit)}` : '—'}</td>
                            <td className={styles.amtCell}>{n(e.credit) ? `₹${inr(e.credit)}` : '—'}</td>
                            <td className={styles.amtCell}><strong>₹{inr(Math.abs(bal))} {bal >= 0 ? 'Dr' : 'Cr'}</strong></td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {payInvoice ? (
        <RecordReceiptModal
          customerId={parseInt(customerId)}
          invoice={payInvoice}
          modes={modes}
          onClose={() => setPayInvoice(null)}
          onPaid={() => { if (customerId) void loadLedger(parseInt(customerId)) }}
        />
      ) : null}
    </div>
  )
}
