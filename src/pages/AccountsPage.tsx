import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createExpense,
  deleteExpense,
  fetchAccountsOverview,
  fetchBankBook,
  fetchCashBook,
  fetchDayBook,
  fetchExpenseCategories,
  fetchExpenses,
  fetchPayments,
  fetchSupplierWise,
} from '../services/accountsApi'
import {
  createPayment,
  fetchPurchaseOutstanding,
  fetchSalesOutstanding,
  uploadPaymentReceipt,
} from '../services/paymentApi'
import { fetchPaymentModes } from '../services/paymentModeApi'
import { fetchPartyMasters } from '../services/partyMasterApi'
import type {
  AccountsOverview,
  AccountsTab,
  CashBankBook,
  DayBook,
  Expense,
  SupplierWise,
} from '../types/account'
import type { OutstandingInvoice, OutstandingSale, Payment, PaymentMode } from '../types/payment'
import type { PartyMaster } from '../types/partyMaster'
import { apiUrl } from '../lib/apiConfig'
import styles from './AccountsPage.module.css'
import pm from './ProductMasterPage.module.css'

// ── Tabs ───────────────────────────────────────────────────────────────────────

type TabDef = { type: AccountsTab; icon: string; label: string; blurb: string }
const TABS: TabDef[] = [
  { type: 'overview',      icon: '📊', label: 'Overview',      blurb: 'Cash, bank, payables & receivables at a glance' },
  { type: 'payments',      icon: '💸', label: 'Payments',      blurb: 'All receipts & payments — and record new ones' },
  { type: 'payables',      icon: '🏭', label: 'Pay Suppliers', blurb: 'Outstanding purchase bills — pay & adjust' },
  { type: 'receivables',   icon: '💵', label: 'Receivables',   blurb: 'Money customers owe you — collect receipts' },
  { type: 'supplier-wise', icon: '🧮', label: 'Supplier-wise', blurb: 'Billed, paid & outstanding per supplier' },
  { type: 'expenses',      icon: '📝', label: 'Expenses',      blurb: 'Day-to-day business expenses' },
  { type: 'cash-book',     icon: '📖', label: 'Cash Book',     blurb: 'Cash money in / out with running balance' },
  { type: 'bank-book',     icon: '🏦', label: 'Bank Book',     blurb: 'Bank / UPI / card / cheque movements' },
  { type: 'day-book',      icon: '📅', label: 'Day Book',      blurb: 'Every voucher for a single day' },
]

const RANGE_PRESETS = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
]

// ── Format helpers ──────────────────────────────────────────────────────────

const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })

function n(v: unknown): number {
  const x = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(x) ? 0 : x
}
function money(v: number): string { return inr0.format(v || 0) }
function money2(v: number): string { return inr2.format(v || 0) }
function moneyCompact(v: number): string {
  const x = v || 0
  const abs = Math.abs(x)
  if (abs >= 1e7) return `${x < 0 ? '-' : ''}₹${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${x < 0 ? '-' : ''}₹${(abs / 1e5).toFixed(2)} L`
  if (abs >= 1e3) return `${x < 0 ? '-' : ''}₹${(abs / 1e3).toFixed(1)} K`
  return inr0.format(x)
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDate(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s.slice(0, 10)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}
function partyName(p: PartyMaster): string {
  const r = p as Record<string, unknown>
  return String(r.party_name ?? r.name ?? `#${p.id}`)
}

const STATUS_CLASS: Record<string, string> = {
  paid: styles.badgePaid,
  unpaid: styles.badgeUnpaid,
  partial: styles.badgePartial,
}
function statusBadge(status: string | null | undefined) {
  const key = (status || '').toLowerCase()
  return <span className={`${styles.badge} ${STATUS_CLASS[key] ?? styles.badgeNeutral}`}>{status || 'N/A'}</span>
}

type KpiTone = 'teal' | 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'indigo' | 'rose' | 'slate'
function Kpi({ label, value, sub, tone = 'slate', icon }: {
  label: string; value: string; sub?: string; tone?: KpiTone; icon?: string
}) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiLabel}>{label}</span>
        {icon && <span className={styles.kpiIcon}>{icon}</span>}
      </div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

// ── Record Payment / Receipt modal ─────────────────────────────────────────────

type TxnMode = 'PAYMENT' | 'RECEIPT'
type PresetInvoice = { id: number; no: string; outstanding: number }

function RecordTxnModal({ mode, preset, onClose, onDone }: {
  mode: TxnMode
  preset?: { partyId: number; invoice?: PresetInvoice }
  onClose: () => void
  onDone: () => void
}) {
  const isPay = mode === 'PAYMENT'
  const [parties, setParties] = useState<PartyMaster[]>([])
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [partyId, setPartyId] = useState(preset ? String(preset.partyId) : '')
  const [outstanding, setOutstanding] = useState<{ id: number; no: string; outstanding: number }[]>([])
  const [refId, setRefId] = useState(preset?.invoice ? String(preset.invoice.id) : '')
  const [amount, setAmount] = useState(preset?.invoice ? preset.invoice.outstanding.toFixed(2) : '')
  const [modeId, setModeId] = useState('')
  const [txnDate, setTxnDate] = useState(isoDate(new Date()))
  const [refNo, setRefNo] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [p, m] = await Promise.all([
        fetchPartyMasters(isPay ? 'Distributor' : 'Customer').catch(() => [] as PartyMaster[]),
        fetchPaymentModes().catch(() => [] as PaymentMode[]),
      ])
      setParties(p)
      setModes(m)
      const cash = m.find((x) => x.mode_name.toLowerCase() === 'cash')
      setModeId(cash ? String(cash.id) : m[0] ? String(m[0].id) : '')
    })()
  }, [isPay])

  const loadOutstanding = useCallback(async (id: number) => {
    try {
      if (isPay) {
        const rows = await fetchPurchaseOutstanding(id)
        setOutstanding(rows.filter((o) => n(o.outstanding_amount) > 0)
          .map((o) => ({ id: o.id, no: o.invoice_no ?? `#${o.id}`, outstanding: n(o.outstanding_amount) })))
      } else {
        const rows = await fetchSalesOutstanding(id)
        setOutstanding(rows.filter((o) => n(o.outstanding_amount) > 0)
          .map((o) => ({ id: o.id, no: o.invoice_no ?? `#${o.id}`, outstanding: n(o.outstanding_amount) })))
      }
    } catch { setOutstanding([]) }
  }, [isPay])

  useEffect(() => {
    if (partyId) void loadOutstanding(parseInt(partyId))
    else setOutstanding([])
  }, [partyId, loadOutstanding])

  const selectedInv = outstanding.find((o) => String(o.id) === refId)
  const modeName = (modes.find((m) => String(m.id) === modeId)?.mode_name ?? '').toLowerCase()
  const needsReceipt = modeName === 'upi' || modeName === 'card'

  async function submit() {
    setErr(null)
    if (!partyId) { setErr(`Select a ${isPay ? 'supplier' : 'customer'}.`); return }
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) { setErr('Enter a valid amount.'); return }
    if (selectedInv && amt > selectedInv.outstanding + 0.001) {
      setErr(`Amount cannot exceed the outstanding ${money2(selectedInv.outstanding)}.`); return
    }
    if (needsReceipt && !receiptFile) { setErr('Attach the receipt image for a UPI / Card transaction.'); return }
    setSaving(true)
    try {
      const created = await createPayment({
        party_id: parseInt(partyId),
        txn_type: mode,
        reference_type: refId ? (isPay ? 'purchase' : 'sale') : null,
        reference_id: refId ? parseInt(refId) : null,
        txn_date: txnDate,
        amount: amt,
        payment_mode_id: modeId ? parseInt(modeId) : undefined,
        reference_no: refNo.trim() || undefined,
      })
      if (needsReceipt && receiptFile) await uploadPaymentReceipt(created.id, receiptFile)
      onDone()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={pm.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={pm.modal} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={pm.modalHead}>
          <div className={pm.modalHeadMain}>
            <h2>{isPay ? '💸 Pay Supplier' : '💵 Receive from Customer'}</h2>
            <p>{isPay ? 'Record money paid out against a purchase bill' : 'Record money received against a sales invoice'}</p>
          </div>
          <button type="button" className={pm.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={pm.modalBody}>
          {err ? <div className={`${pm.banner} ${pm.bannerError}`}>{err}</div> : null}
          <div className={pm.formGrid}>
            <div className={`${pm.formField} ${pm.formFieldFull}`}>
              <label>{isPay ? 'Supplier *' : 'Customer *'}</label>
              <select className={pm.searchInput} value={partyId} disabled={!!preset} onChange={(e) => { setPartyId(e.target.value); setRefId(''); }}>
                <option value="">— Select —</option>
                {parties.map((p) => <option key={p.id} value={String(p.id)}>{partyName(p)}</option>)}
              </select>
            </div>
            <div className={`${pm.formField} ${pm.formFieldFull}`}>
              <label>Adjust against bill (optional)</label>
              <select className={pm.searchInput} value={refId} onChange={(e) => {
                setRefId(e.target.value)
                const inv = outstanding.find((o) => String(o.id) === e.target.value)
                if (inv) setAmount(inv.outstanding.toFixed(2))
              }}>
                <option value="">— On account (no specific bill) —</option>
                {outstanding.map((o) => <option key={o.id} value={String(o.id)}>{o.no} · outstanding {money2(o.outstanding)}</option>)}
              </select>
            </div>
            <div className={pm.formField}>
              <label>Amount *</label>
              <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className={pm.formField}>
              <label>Mode</label>
              <select className={pm.searchInput} value={modeId} onChange={(e) => setModeId(e.target.value)}>
                {modes.map((m) => <option key={m.id} value={String(m.id)}>{m.mode_name}</option>)}
              </select>
            </div>
            <div className={pm.formField}>
              <label>Date</label>
              <input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} />
            </div>
            <div className={pm.formField}>
              <label>{modeName === 'cheque' ? 'Cheque No' : needsReceipt ? 'UTR / Txn No' : 'Reference No'}</label>
              <input type="text" placeholder="optional" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </div>
            {needsReceipt ? (
              <div className={`${pm.formField} ${pm.formFieldFull}`}>
                <label>Receipt (image / PDF) *</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                {receiptFile ? <span style={{ fontSize: '0.78rem', color: 'var(--medical-deep)', marginTop: '0.25rem' }}>Selected: {receiptFile.name}</span> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className={pm.modalFoot}>
          <button type="button" className={pm.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className={pm.btnPrimary} onClick={() => void submit()} disabled={saving}>
            {saving ? 'Saving…' : isPay ? 'Record Payment' : 'Record Receipt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Add Expense modal ─────────────────────────────────────────────────────────

function AddExpenseModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [categories, setCategories] = useState<string[]>([])
  const [modes, setModes] = useState<PaymentMode[]>([])
  const [expenseDate, setExpenseDate] = useState(isoDate(new Date()))
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [modeId, setModeId] = useState('')
  const [refNo, setRefNo] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const [c, m] = await Promise.all([
        fetchExpenseCategories().catch(() => [] as string[]),
        fetchPaymentModes().catch(() => [] as PaymentMode[]),
      ])
      setCategories(c)
      setCategory(c[0] ?? '')
      setModes(m)
      const cash = m.find((x) => x.mode_name.toLowerCase() === 'cash')
      setModeId(cash ? String(cash.id) : m[0] ? String(m[0].id) : '')
    })()
  }, [])

  async function submit() {
    setErr(null)
    const amt = parseFloat(amount)
    if (Number.isNaN(amt) || amt <= 0) { setErr('Enter a valid amount.'); return }
    setSaving(true)
    try {
      await createExpense({
        expense_date: expenseDate,
        category: category || null,
        description: description.trim() || null,
        amount: amt,
        payment_mode_id: modeId ? parseInt(modeId) : null,
        reference_no: refNo.trim() || null,
        notes: notes.trim() || null,
      })
      onDone()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={pm.overlay} role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className={pm.modal} role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
        <div className={pm.modalHead}>
          <div className={pm.modalHeadMain}>
            <h2>📝 Add Expense</h2>
            <p>Record a business expense (money out)</p>
          </div>
          <button type="button" className={pm.closeX} onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className={pm.modalBody}>
          {err ? <div className={`${pm.banner} ${pm.bannerError}`}>{err}</div> : null}
          <div className={pm.formGrid}>
            <div className={pm.formField}>
              <label>Date *</label>
              <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div className={pm.formField}>
              <label>Category</label>
              <select className={pm.searchInput} value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={pm.formField}>
              <label>Amount *</label>
              <input type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className={pm.formField}>
              <label>Paid via</label>
              <select className={pm.searchInput} value={modeId} onChange={(e) => setModeId(e.target.value)}>
                {modes.map((m) => <option key={m.id} value={String(m.id)}>{m.mode_name}</option>)}
              </select>
            </div>
            <div className={`${pm.formField} ${pm.formFieldFull}`}>
              <label>Description</label>
              <input type="text" placeholder="e.g. May electricity bill" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className={pm.formField}>
              <label>Voucher / Bill No</label>
              <input type="text" placeholder="optional" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
            </div>
            <div className={`${pm.formField} ${pm.formFieldFull}`}>
              <label>Notes</label>
              <input type="text" placeholder="optional" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>
        <div className={pm.modalFoot}>
          <button type="button" className={pm.btnGhost} onClick={onClose} disabled={saving}>Cancel</button>
          <button type="button" className={pm.btnPrimary} onClick={() => void submit()} disabled={saving}>
            {saving ? 'Saving…' : 'Save Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Loaded data union ──────────────────────────────────────────────────────────

type Loaded =
  | { type: 'overview'; data: AccountsOverview }
  | { type: 'payments'; data: Payment[] }
  | { type: 'payables'; data: OutstandingInvoice[] }
  | { type: 'receivables'; data: OutstandingSale[] }
  | { type: 'supplier-wise'; data: SupplierWise }
  | { type: 'expenses'; data: Expense[] }
  | { type: 'cash-book'; data: CashBankBook }
  | { type: 'bank-book'; data: CashBankBook }
  | { type: 'day-book'; data: DayBook }

// ── Page ───────────────────────────────────────────────────────────────────────

export function AccountsPage() {
  const navigate = useNavigate()
  const params = useParams<{ type?: string }>()
  const active: AccountsTab = (TABS.find((t) => t.type === params.type)?.type) ?? 'overview'
  const tab = TABS.find((t) => t.type === active)!

  const today = useMemo(() => new Date(), [])
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 864e5)))
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [day, setDay] = useState(() => isoDate(new Date()))
  const [payType, setPayType] = useState<'' | 'RECEIPT' | 'PAYMENT'>('')

  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // modal state
  const [txnModal, setTxnModal] = useState<{ mode: TxnMode; preset?: { partyId: number; invoice?: PresetInvoice } } | null>(null)
  const [expenseModal, setExpenseModal] = useState(false)

  const close = useCallback(() => navigate('/app/dashboard'), [navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      let next: Loaded
      switch (active) {
        case 'overview':      next = { type: 'overview', data: await fetchAccountsOverview() }; break
        case 'payments':      next = { type: 'payments', data: await fetchPayments({ txn_type: payType || undefined, date_from: from, date_to: to }) }; break
        case 'payables':      next = { type: 'payables', data: (await fetchPurchaseOutstanding()).filter((o) => n(o.outstanding_amount) > 0) }; break
        case 'receivables':   next = { type: 'receivables', data: (await fetchSalesOutstanding()).filter((o) => n(o.outstanding_amount) > 0) }; break
        case 'supplier-wise': next = { type: 'supplier-wise', data: await fetchSupplierWise() }; break
        case 'expenses':      next = { type: 'expenses', data: await fetchExpenses({ date_from: from, date_to: to }) }; break
        case 'cash-book':     next = { type: 'cash-book', data: await fetchCashBook(from, to) }; break
        case 'bank-book':     next = { type: 'bank-book', data: await fetchBankBook(from, to) }; break
        case 'day-book':      next = { type: 'day-book', data: await fetchDayBook(day) }; break
      }
      setLoaded(next)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load data')
      setLoaded(null)
    } finally {
      setLoading(false)
    }
  }, [active, from, to, day, payType])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !txnModal && !expenseModal) close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close, txnModal, expenseModal])

  function applyPreset(days: number) {
    setFrom(isoDate(new Date(today.getTime() - (days - 1) * 864e5)))
    setTo(isoDate(today))
  }

  const usesRange = active === 'payments' || active === 'expenses' || active === 'cash-book' || active === 'bank-book'
  const usesDay = active === 'day-book'

  return (
    <div className={styles.overlay}>
      <div className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={close}>← Back</button>
        <div className={styles.headerTitle}>
          <h2>{tab.icon} {tab.label}</h2>
          <p>{tab.blurb}</p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close">×</button>
      </div>

      <div className={styles.tabRail}>
        {TABS.map((t) => (
          <button key={t.type} type="button"
            className={`${styles.tab} ${t.type === active ? styles.tabActive : ''}`}
            onClick={() => navigate(`/app/accounts/${t.type}`)}>
            <span className={styles.tabIcon}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.toolbarRow}>
          {usesRange && (
            <>
              <div className={styles.presetGroup}>
                {RANGE_PRESETS.map((p) => (
                  <button key={p.label} type="button" className={styles.presetBtn} onClick={() => applyPreset(p.days)}>{p.label}</button>
                ))}
              </div>
              <div className={styles.dateField}><label>From</label><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className={styles.dateField}><label>To</label><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
            </>
          )}
          {active === 'payments' && (
            <div className={styles.dateField}>
              <label>Type</label>
              <select value={payType} onChange={(e) => setPayType(e.target.value as typeof payType)}>
                <option value="">All</option>
                <option value="RECEIPT">Receipts (in)</option>
                <option value="PAYMENT">Payments (out)</option>
              </select>
            </div>
          )}
          {usesDay && (
            <div className={styles.dateField}><label>Date</label><input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></div>
          )}
        </div>
        <div className={styles.toolbarActions}>
          {(active === 'overview' || active === 'payments' || active === 'payables') && (
            <button type="button" className={styles.addBtn} onClick={() => setTxnModal({ mode: 'PAYMENT' })}>💸 Pay Supplier</button>
          )}
          {(active === 'overview' || active === 'payments' || active === 'receivables') && (
            <button type="button" className={`${styles.addBtn} ${styles.addBtnGreen}`} onClick={() => setTxnModal({ mode: 'RECEIPT' })}>💵 Receive</button>
          )}
          {(active === 'overview' || active === 'expenses') && (
            <button type="button" className={styles.addBtn} onClick={() => setExpenseModal(true)}>📝 Add Expense</button>
          )}
          <button type="button" className={styles.refreshBtn} onClick={() => void load()} disabled={loading}>
            {loading ? 'Loading…' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading}><span className={styles.spinner} aria-hidden /> Loading {tab.label.toLowerCase()}…</div>
        ) : err ? (
          <div className={styles.errorBox}><p>{err}</p><button type="button" className={styles.retryBtn} onClick={() => void load()}>Retry</button></div>
        ) : loaded ? (
          <AccountsBody
            loaded={loaded}
            onPay={(partyId, invoice) => setTxnModal({ mode: 'PAYMENT', preset: { partyId, invoice } })}
            onReceive={(partyId, invoice) => setTxnModal({ mode: 'RECEIPT', preset: { partyId, invoice } })}
            onDeleteExpense={async (id) => { await deleteExpense(id); void load() }}
            goTab={(t) => navigate(`/app/accounts/${t}`)}
          />
        ) : null}
      </div>

      {txnModal && (
        <RecordTxnModal mode={txnModal.mode} preset={txnModal.preset}
          onClose={() => setTxnModal(null)} onDone={() => void load()} />
      )}
      {expenseModal && (
        <AddExpenseModal onClose={() => setExpenseModal(false)} onDone={() => void load()} />
      )}
    </div>
  )
}

// ── Bodies ───────────────────────────────────────────────────────────────────

function AccountsBody({ loaded, onPay, onReceive, onDeleteExpense, goTab }: {
  loaded: Loaded
  onPay: (partyId: number, invoice?: PresetInvoice) => void
  onReceive: (partyId: number, invoice?: PresetInvoice) => void
  onDeleteExpense: (id: number) => void
  goTab: (t: AccountsTab) => void
}) {
  switch (loaded.type) {
    case 'overview':      return <OverviewBody d={loaded.data} goTab={goTab} />
    case 'payments':      return <PaymentsBody rows={loaded.data} />
    case 'payables':      return <PayablesBody rows={loaded.data} onPay={onPay} />
    case 'receivables':   return <ReceivablesBody rows={loaded.data} onReceive={onReceive} />
    case 'supplier-wise': return <SupplierWiseBody d={loaded.data} onPay={onPay} />
    case 'expenses':      return <ExpensesBody rows={loaded.data} onDelete={onDeleteExpense} />
    case 'cash-book':     return <BookBody d={loaded.data} label="Cash Book" />
    case 'bank-book':     return <BookBody d={loaded.data} label="Bank Book" />
    case 'day-book':      return <DayBookBody d={loaded.data} />
  }
}

function OverviewBody({ d, goTab }: { d: AccountsOverview; goTab: (t: AccountsTab) => void }) {
  const cashTone: KpiTone = d.balances.cash_in_hand >= 0 ? 'teal' : 'rose'
  const bankTone: KpiTone = d.balances.bank_balance >= 0 ? 'blue' : 'rose'
  const todayTone: KpiTone = d.today.net >= 0 ? 'green' : 'rose'
  const posTone: KpiTone = d.net_position >= 0 ? 'green' : 'rose'
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone={cashTone} icon="📖" label="Cash in Hand" value={moneyCompact(d.balances.cash_in_hand)} sub={money2(d.balances.cash_in_hand)} />
        <Kpi tone={bankTone} icon="🏦" label="Bank Balance" value={moneyCompact(d.balances.bank_balance)} sub={money2(d.balances.bank_balance)} />
        <Kpi tone="rose" icon="🏭" label="Payables (we owe)" value={moneyCompact(d.payables.outstanding)} sub={`${d.payables.bills} bills · ${money(d.payables.overdue)} overdue`} />
        <Kpi tone="green" icon="💵" label="Receivables (owed to us)" value={moneyCompact(d.receivables.outstanding)} sub={`${d.receivables.bills} bills · ${money(d.receivables.overdue)} overdue`} />
        <Kpi tone={todayTone} icon="📅" label="Today's Net Flow" value={moneyCompact(d.today.net)} sub={`In ${money(d.today.money_in)} · Out ${money(d.today.money_out)}`} />
        <Kpi tone="orange" icon="📝" label="Expenses (this month)" value={moneyCompact(d.month_expenses)} sub={`${d.counts.expenses} entries all-time`} />
        <Kpi tone={posTone} icon="⚖️" label="Net Position" value={moneyCompact(d.net_position)} sub="receivables − payables" />
        <Kpi tone="indigo" icon="💸" label="Payments Logged" value={String(d.counts.payments)} sub="receipts + payments" />
      </div>

      <div className={styles.panel}>
        <p className={styles.panelTitle}>Jump to</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
          {([['payables', '🏭 Pay Suppliers'], ['receivables', '💵 Collect Receivables'], ['cash-book', '📖 Cash Book'], ['bank-book', '🏦 Bank Book'], ['day-book', '📅 Day Book'], ['expenses', '📝 Expenses']] as [AccountsTab, string][]).map(([t, label]) => (
            <button key={t} type="button" className={styles.linkBtn} onClick={() => goTab(t)}>{label}</button>
          ))}
        </div>
      </div>
    </>
  )
}

function PaymentsBody({ rows }: { rows: Payment[] }) {
  const totalIn = rows.filter((r) => r.txn_type === 'RECEIPT').reduce((s, r) => s + n(r.amount), 0)
  const totalOut = rows.filter((r) => r.txn_type === 'PAYMENT').reduce((s, r) => s + n(r.amount), 0)
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <p className={styles.panelTitle}>Payments & Receipts</p>
        <span className={styles.panelMeta}>{rows.length} txns · in {money(totalIn)} · out {money(totalOut)}</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Date</th><th>Type</th><th>Party</th><th>Mode</th><th>Reference</th><th className={styles.right}>Amount</th><th>Receipt</th></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className={styles.emptyCell} colSpan={7}>No transactions for this filter.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id}>
                <td>{fmtDate(r.txn_date)}</td>
                <td>{r.txn_type === 'RECEIPT' ? <span className={`${styles.badge} ${styles.badgeIn}`}>Receipt</span> : <span className={`${styles.badge} ${styles.badgeOut}`}>Payment</span>}</td>
                <td>{r.party_name || '—'}</td>
                <td>{r.payment_mode_name || '—'}</td>
                <td className={styles.muted}>{r.reference_no || r.reference_no_doc || '—'}</td>
                <td className={`${styles.right} ${styles.num} ${r.txn_type === 'RECEIPT' ? styles.pos : styles.neg}`}>{money2(n(r.amount))}</td>
                <td>{r.receipt_path ? <a className={styles.linkBtn} href={apiUrl(r.receipt_path)} target="_blank" rel="noreferrer">View</a> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PayablesBody({ rows, onPay }: { rows: OutstandingInvoice[]; onPay: (partyId: number, invoice?: PresetInvoice) => void }) {
  const total = rows.reduce((s, r) => s + n(r.outstanding_amount), 0)
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <p className={styles.panelTitle}>Outstanding Purchase Bills</p>
        <span className={styles.panelMeta}>{rows.length} bills · {money(total)} payable</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Invoice</th><th>Supplier</th><th>Date</th><th>Due</th><th className={styles.right}>Net</th><th className={styles.right}>Paid</th><th className={styles.right}>Outstanding</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className={styles.emptyCell} colSpan={9}>🎉 No outstanding bills — all suppliers settled.</td></tr>
            ) : rows.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.invoice_no ?? `#${o.id}`}</strong></td>
                <td>{o.supplier_name ?? '—'}</td>
                <td>{fmtDate(o.invoice_date)}</td>
                <td>{fmtDate(o.effective_due_date ?? o.due_date)}{o.is_overdue ? <span className={`${styles.badge} ${styles.badgeOverdue}`} style={{ marginLeft: 6 }}>{o.days_overdue}d</span> : null}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(n(o.net_amount))}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(n(o.total_paid))}</td>
                <td className={`${styles.right} ${styles.num} ${styles.strong}`}>{money2(n(o.outstanding_amount))}</td>
                <td>{statusBadge(o.payment_status)}</td>
                <td>{o.supplier_id ? <button type="button" className={styles.linkBtn} onClick={() => onPay(o.supplier_id!, { id: o.id, no: o.invoice_no ?? `#${o.id}`, outstanding: n(o.outstanding_amount) })}>Pay</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReceivablesBody({ rows, onReceive }: { rows: OutstandingSale[]; onReceive: (partyId: number, invoice?: PresetInvoice) => void }) {
  const total = rows.reduce((s, r) => s + n(r.outstanding_amount), 0)
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <p className={styles.panelTitle}>Outstanding Sales Invoices</p>
        <span className={styles.panelMeta}>{rows.length} invoices · {money(total)} receivable</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th className={styles.right}>Net</th><th className={styles.right}>Received</th><th className={styles.right}>Outstanding</th><th>Status</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className={styles.emptyCell} colSpan={8}>🎉 No pending receivables — all customers settled.</td></tr>
            ) : rows.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.invoice_no ?? `#${o.id}`}</strong></td>
                <td>{o.customer_name ?? 'Walk-in'}</td>
                <td>{fmtDate(o.invoice_date)}{o.is_overdue ? <span className={`${styles.badge} ${styles.badgeOverdue}`} style={{ marginLeft: 6 }}>{o.days_overdue}d</span> : null}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(n(o.net_amount))}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(n(o.total_received))}</td>
                <td className={`${styles.right} ${styles.num} ${styles.strong}`}>{money2(n(o.outstanding_amount))}</td>
                <td>{statusBadge(o.payment_status)}</td>
                <td>{o.customer_id ? <button type="button" className={styles.linkBtn} onClick={() => onReceive(o.customer_id!, { id: o.id, no: o.invoice_no ?? `#${o.id}`, outstanding: n(o.outstanding_amount) })}>Receive</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SupplierWiseBody({ d, onPay }: { d: SupplierWise; onPay: (partyId: number) => void }) {
  const rows = d.suppliers
  const totalOut = rows.reduce((s, r) => s + r.outstanding, 0)
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <p className={styles.panelTitle}>Supplier-wise Summary</p>
        <span className={styles.panelMeta}>{rows.length} suppliers · {money(totalOut)} outstanding</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Supplier</th><th className={styles.right}>Bills</th><th className={styles.right}>Billed</th><th className={styles.right}>Paid</th><th className={styles.right}>Outstanding</th><th>Last Payment</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className={styles.emptyCell} colSpan={7}>No supplier activity yet.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.supplier_id}>
                <td><strong>{r.supplier_name}</strong></td>
                <td className={`${styles.right} ${styles.num}`}>{r.bills}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(r.billed)}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(r.paid)}</td>
                <td className={`${styles.right} ${styles.num} ${r.outstanding > 0 ? styles.strong : ''}`}>{money2(r.outstanding)}</td>
                <td>{fmtDate(r.last_payment)}</td>
                <td>{r.outstanding > 0 ? <button type="button" className={styles.linkBtn} onClick={() => onPay(r.supplier_id)}>Pay</button> : <span className={`${styles.badge} ${styles.badgePaid}`}>Settled</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ExpensesBody({ rows, onDelete }: { rows: Expense[]; onDelete: (id: number) => void }) {
  const total = rows.reduce((s, r) => s + n(r.amount), 0)
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <p className={styles.panelTitle}>Expenses</p>
        <span className={styles.panelMeta}>{rows.length} entries · {money(total)} total</span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Paid via</th><th>Ref</th><th className={styles.right}>Amount</th><th /></tr></thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className={styles.emptyCell} colSpan={7}>No expenses in this period. Use “Add Expense” to record one.</td></tr>
            ) : rows.map((e) => (
              <tr key={e.id}>
                <td>{fmtDate(e.expense_date)}</td>
                <td><span className={`${styles.badge} ${styles.badgeNeutral}`}>{e.category || 'Misc'}</span></td>
                <td>{e.description || '—'}</td>
                <td>{e.payment_mode_name || '—'}</td>
                <td className={styles.muted}>{e.reference_no || '—'}</td>
                <td className={`${styles.right} ${styles.num} ${styles.neg}`}>{money2(n(e.amount))}</td>
                <td><button type="button" className={`${styles.linkBtn} ${styles.linkBtnDanger}`} onClick={() => onDelete(e.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot><tr><td colSpan={5} className={styles.right}>Total</td><td className={`${styles.right} ${styles.num}`}>{money2(total)}</td><td /></tr></tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

function BookBody({ d, label }: { d: CashBankBook; label: string }) {
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="slate" icon="🔖" label="Opening Balance" value={moneyCompact(d.opening_balance)} sub={money2(d.opening_balance)} />
        <Kpi tone="green" icon="⬇️" label="Money In" value={moneyCompact(d.total_in)} sub={`${d.range.from} → ${d.range.to}`} />
        <Kpi tone="rose" icon="⬆️" label="Money Out" value={moneyCompact(d.total_out)} sub="payments + expenses" />
        <Kpi tone={d.closing_balance >= 0 ? 'teal' : 'rose'} icon="🧾" label="Closing Balance" value={moneyCompact(d.closing_balance)} sub={money2(d.closing_balance)} />
      </div>
      <div className={styles.panel}>
        <p className={styles.panelTitle}>{label} Statement</p>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th>Date</th><th>Particulars</th><th>Type</th><th>Ref</th><th className={styles.right}>In</th><th className={styles.right}>Out</th><th className={styles.right}>Balance</th></tr></thead>
            <tbody>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={4} className={styles.muted}><strong>Opening Balance</strong></td>
                <td /><td />
                <td className={`${styles.right} ${styles.num} ${styles.strong}`}>{money2(d.opening_balance)}</td>
              </tr>
              {d.rows.length === 0 ? (
                <tr><td className={styles.emptyCell} colSpan={7}>No {label.toLowerCase()} movements in this period.</td></tr>
              ) : d.rows.map((r, i) => (
                <tr key={i}>
                  <td>{fmtDate(r.date)}</td>
                  <td>{r.particulars}</td>
                  <td>{r.voucher_type}</td>
                  <td className={styles.muted}>{r.voucher_no || '—'}</td>
                  <td className={`${styles.right} ${styles.num} ${styles.pos}`}>{r.money_in ? money2(r.money_in) : '—'}</td>
                  <td className={`${styles.right} ${styles.num} ${styles.neg}`}>{r.money_out ? money2(r.money_out) : '—'}</td>
                  <td className={`${styles.right} ${styles.num} ${styles.strong}`}>{money2(r.balance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className={styles.right}>Totals</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(d.total_in)}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(d.total_out)}</td>
                <td className={`${styles.right} ${styles.num}`}>{money2(d.closing_balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}

function DayBookBody({ d }: { d: DayBook }) {
  const s = d.summary
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="blue" icon="💰" label="Sales" value={moneyCompact(s.sales)} />
        <Kpi tone="green" icon="📥" label="Purchases" value={moneyCompact(s.purchases)} />
        <Kpi tone="teal" icon="⬇️" label="Receipts (in)" value={moneyCompact(s.receipts)} />
        <Kpi tone="orange" icon="⬆️" label="Payments (out)" value={moneyCompact(s.payments)} />
        <Kpi tone="rose" icon="📝" label="Expenses (out)" value={moneyCompact(s.expenses)} />
        <Kpi tone={s.net_cash >= 0 ? 'teal' : 'rose'} icon="📅" label="Net Cash" value={moneyCompact(s.net_cash)} sub={`In ${money(s.cash_in)} · Out ${money(s.cash_out)}`} />
      </div>
      <div className={styles.panel}>
        <div className={styles.panelHead}>
          <p className={styles.panelTitle}>Vouchers — {fmtDate(d.day)}</p>
          <span className={styles.panelMeta}>{d.vouchers.length} entries</span>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th>Type</th><th>Voucher</th><th>Party</th><th className={styles.right}>Amount</th><th>Flow</th></tr></thead>
            <tbody>
              {d.vouchers.length === 0 ? (
                <tr><td className={styles.emptyCell} colSpan={5}>No vouchers on this day.</td></tr>
              ) : d.vouchers.map((v, i) => (
                <tr key={i}>
                  <td><strong>{v.type}</strong></td>
                  <td className={styles.muted}>{v.voucher_no}</td>
                  <td>{v.party}</td>
                  <td className={`${styles.right} ${styles.num}`}>{money2(v.amount)}</td>
                  <td>{v.direction === 'in' ? <span className={`${styles.badge} ${styles.badgeIn}`}>In</span> : <span className={`${styles.badge} ${styles.badgeOut}`}>Out</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
