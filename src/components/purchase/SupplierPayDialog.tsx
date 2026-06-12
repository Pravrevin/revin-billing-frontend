import { useEffect, useMemo, useState } from 'react'
import { createPayment, uploadPaymentReceipt } from '../../services/paymentApi'
import { fetchPaymentModes } from '../../services/paymentModeApi'
import type { PaymentMode } from '../../types/payment'
import styles from '../../pages/ProductMasterPage.module.css'

function money2(v: number): string {
  return `₹${(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function todayStr() { return new Date().toISOString().slice(0, 10) }

export type PayInvoice = { id: number; no: string; outstanding: number }

/** Record a PAYMENT to a supplier — optionally settling a specific purchase invoice. */
export function SupplierPayDialog({
  supplierId,
  supplierName,
  invoice,
  onClose,
  onDone,
}: {
  supplierId: number
  supplierName?: string
  invoice?: PayInvoice | null
  onClose: () => void
  onDone: () => void
}) {
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [amount, setAmount] = useState(invoice ? invoice.outstanding.toFixed(2) : '')
  const [modeId, setModeId] = useState('')
  const [txnDate, setTxnDate] = useState(todayStr())
  const [refNo, setRefNo] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void fetchPaymentModes()
      .then((m) => {
        setModes(m)
        const cash = m.find((x) => x.mode_name.toLowerCase() === 'cash')
        setModeId(cash ? String(cash.id) : m[0] ? String(m[0].id) : '')
      })
      .catch(() => setModes([]))
  }, [])

  const modeName = useMemo(
    () => (modes.find((m) => String(m.id) === modeId)?.mode_name ?? '').toLowerCase(),
    [modes, modeId],
  )
  const needsReceipt = modeName === 'upi' || modeName === 'card'

  async function submit() {
    setErr(null)
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) { setErr('Enter a valid amount.'); return }
    if (invoice && amt > invoice.outstanding + 0.001) {
      setErr(`Amount cannot exceed the outstanding ${money2(invoice.outstanding)}.`); return
    }
    if (needsReceipt && !receiptFile) { setErr('Attach the receipt for a UPI / Card payment.'); return }
    setSaving(true)
    try {
      const created = await createPayment({
        party_id: supplierId,
        txn_type: 'PAYMENT',
        reference_type: invoice ? 'purchase' : null,
        reference_id: invoice ? invoice.id : null,
        txn_date: txnDate,
        amount: amt,
        payment_mode_id: modeId ? parseInt(modeId) : undefined,
        reference_no: refNo.trim() || undefined,
      })
      if (needsReceipt && receiptFile) await uploadPaymentReceipt(created.id, receiptFile)
      onDone()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to record payment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2>💸 Pay Supplier</h2>
            <p>
              {supplierName ? `${supplierName} · ` : ''}
              {invoice ? `Invoice ${invoice.no} · Outstanding ${money2(invoice.outstanding)}` : 'On-account payment'}
            </p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}>
          {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label>Amount *</label>
              <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label>Mode</label>
              <select className={styles.searchInput} value={modeId} onChange={(e) => setModeId(e.target.value)}>
                {modes.map((m) => <option key={m.id} value={String(m.id)}>{m.mode_name}</option>)}
              </select>
            </div>
            <div className={styles.formField}>
              <label>Date</label>
              <input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className={styles.formField}>
              <label>{modeName === 'cheque' ? 'Cheque No' : needsReceipt ? 'UTR / Txn No' : 'Reference No'}</label>
              <input type="text" placeholder="optional" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </div>
            {needsReceipt ? (
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label>Receipt (image / PDF) *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                {receiptFile ? <span style={{ fontSize: '0.78rem', color: 'var(--medical-deep)', marginTop: '0.25rem' }}>Selected: {receiptFile.name}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className={styles.btnPrimary} onClick={() => void submit()} disabled={saving}>
            {saving ? 'Saving…' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div>
  )
}
