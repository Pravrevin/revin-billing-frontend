import { type CSSProperties, type InputHTMLAttributes, useEffect, useMemo, useRef, useState } from 'react'
import { fetchItemMasters } from '../../services/itemMasterApi'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import { createSale } from '../../services/salesApi'
import { fetchStockMasters } from '../../services/stockMasterApi'
import { deleteHeldBill, holdBill } from '../../services/heldBillApi'
import type { ItemMaster } from '../../types/itemMaster'
import type { PartyMaster } from '../../types/partyMaster'
import type { Sale } from '../../types/sales'
import type { StockMaster } from '../../types/stockMaster'
import type { HeldBillDraft, HeldBillRow } from '../../types/heldBill'
import { QuickAddCustomerModal } from '../party/QuickAddCustomerModal'
import styles from '../../pages/ProductMasterPage.module.css'

// ── Types ────────────────────────────────────────────────────────────────────

type SaleRow = {
  _key: string
  item_id: string
  batch_no: string
  quantity: string
  mrp: string
  sale_rate: string
  discount: string
  gst_percent: string
  expiry_date: string
  available: string // on-hand qty for the selected batch (display + validation)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyRow(): SaleRow {
  return {
    _key: crypto.randomUUID(),
    item_id: '',
    batch_no: '',
    quantity: '',
    mrp: '',
    sale_rate: '',
    discount: '0',
    gst_percent: '',
    expiry_date: '',
    available: '',
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

/** Rebuild editable rows (with fresh _key) from a resumed held-bill draft. */
function rowsFromDraft(rows: HeldBillRow[] | undefined): SaleRow[] {
  if (!rows || rows.length === 0) return Array.from({ length: 5 }, emptyRow)
  return rows.map((r) => ({
    _key: crypto.randomUUID(),
    item_id: r.item_id ?? '',
    batch_no: r.batch_no ?? '',
    quantity: r.quantity ?? '',
    mrp: r.mrp ?? '',
    sale_rate: r.sale_rate ?? '',
    discount: r.discount ?? '0',
    gst_percent: r.gst_percent ?? '',
    expiry_date: r.expiry_date ?? '',
    available: r.available ?? '',
  }))
}

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}

function rowTotal(row: SaleRow): number {
  const qty  = parseFloat(row.quantity)  || 0
  const rate = parseFloat(row.sale_rate) || 0
  const disc = parseFloat(row.discount)  || 0
  const gst  = parseFloat(row.gst_percent) || 0
  const gross    = qty * rate
  const discAmt  = gross * (disc / 100)
  const taxable  = gross - discAmt
  return taxable + taxable * (gst / 100)
}

function fmtInr(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function partyText(c: PartyMaster): string {
  return [c.party_name, c.party_code, c.mobile]
    .filter((v) => v != null && String(v).trim() !== '')
    .join(' ')
    .toLowerCase()
}

function partyLabel(c: PartyMaster): string {
  return String(c.party_name ?? c.name ?? `Customer #${c.id}`)
}

// ── Cell styles ───────────────────────────────────────────────────────────────

const cellInput: CSSProperties = {
  width: '100%',
  padding: '0.38rem 0.5rem',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  background: '#fff',
  color: 'var(--text)',
  boxSizing: 'border-box',
}

// ── Shared dropdown shell ──────────────────────────────────────────────────────

function Dropdown({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 50,
        top: 'calc(100% + 2px)',
        left: 0,
        right: 0,
        minWidth: 260,
        maxHeight: 280,
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: '9px',
        boxShadow: '0 12px 28px rgba(15,23,42,0.16)',
      }}
    >
      {children}
    </div>
  )
}

// ── Stock (inventory) search combo — sales are picked from available stock ──────

function StockSearchCombo({
  stock,
  valueId,
  valueBatch,
  disabled,
  onPick,
}: {
  stock: StockMaster[]
  valueId: string
  valueBatch: string
  disabled: boolean
  onPick: (s: StockMaster) => void
}) {
  const selected = stock.find((s) => String(s.item_id) === valueId && s.batch_no === valueBatch) ?? null
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const blurTimer = useRef<number | null>(null)

  const trimmed = query.trim()
  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase()
    // Only batches with stock left are sellable
    const inStock = stock.filter((s) => num(s.quantity) > 0)
    if (!q) return inStock.slice(0, 50)
    return inStock
      .filter((s) => `${s.item_name ?? ''} ${s.batch_no} ${s.item_id}`.toLowerCase().includes(q))
      .slice(0, 50)
  }, [stock, trimmed])

  const showDropdown = open && !disabled && trimmed.length > 0
  const display = open
    ? query
    : selected
      ? `${selected.item_name ?? `Item #${selected.item_id}`} · ${selected.batch_no}`
      : ''

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={display}
        disabled={disabled}
        placeholder={disabled ? 'Loading…' : 'Type item / batch…'}
        autoComplete="off"
        style={cellInput}
        onFocus={() => { setQuery(''); setOpen(true) }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onBlur={() => { blurTimer.current = window.setTimeout(() => setOpen(false), 150) }}
      />
      {showDropdown ? (
        <div onMouseDown={(e) => { e.preventDefault(); if (blurTimer.current) window.clearTimeout(blurTimer.current) }}>
          <Dropdown>
            {filtered.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No stock matches “{trimmed}”. (Only batches with available quantity are sellable — add stock via a purchase.)
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { onPick(s); setOpen(false); setQuery('') }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
                    border: 'none', borderBottom: '1px solid #f1f5f9', background: '#fff', cursor: 'pointer', fontSize: '0.83rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{s.item_name ?? `Item #${s.item_id}`}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.76rem' }}>
                    Batch {s.batch_no} · Avail {num(s.quantity)} · MRP ₹{s.mrp ?? '—'}
                    {s.expiry_date ? ` · Exp ${String(s.expiry_date).slice(0, 10)}` : ''}
                  </span>
                </button>
              ))
            )}
          </Dropdown>
        </div>
      ) : null}
    </div>
  )
}

// ── Customer search combo (by name / mobile) + create new ──────────────────────

function CustomerSearchCombo({
  customers,
  valueId,
  disabled,
  onPick,
  onCreateNew,
}: {
  customers: PartyMaster[]
  valueId: string
  disabled: boolean
  onPick: (c: PartyMaster) => void
  onCreateNew: (typed: string) => void
}) {
  const selected = customers.find((c) => String(c.id) === valueId) ?? null
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const blurTimer = useRef<number | null>(null)

  const trimmed = query.trim()
  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase()
    if (!q) return customers.slice(0, 50)
    return customers.filter((c) => partyText(c).includes(q)).slice(0, 50)
  }, [customers, trimmed])

  const display = open ? query : selected ? partyLabel(selected) : ''

  return (
    <div style={{ position: 'relative' }}>
      <input
        id="sb-customer"
        type="text"
        value={display}
        disabled={disabled}
        placeholder={disabled ? 'Loading…' : 'Walk-in — type name or mobile…'}
        autoComplete="off"
        style={{ padding: '0.55rem 0.65rem', borderRadius: '9px', border: '1px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit', background: '#fff', width: '100%', boxSizing: 'border-box' }}
        onFocus={() => { setQuery(''); setOpen(true) }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onBlur={() => { blurTimer.current = window.setTimeout(() => setOpen(false), 150) }}
      />
      {open && !disabled ? (
        <div onMouseDown={(e) => { e.preventDefault(); if (blurTimer.current) window.clearTimeout(blurTimer.current) }}>
          <Dropdown>
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onPick(c); setOpen(false); setQuery('') }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
                  border: 'none', borderBottom: '1px solid #f1f5f9',
                  background: String(c.id) === valueId ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: '0.83rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>{partyLabel(c)}</span>
                {c.mobile ? (
                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem', fontSize: '0.76rem' }}>
                    📞 {String(c.mobile)}
                  </span>
                ) : null}
              </button>
            ))}
            {filtered.length === 0 ? (
              <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No customer matches “{trimmed}”.
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => { onCreateNew(trimmed); setOpen(false) }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '0.55rem 0.75rem',
                border: 'none', borderTop: '1px solid var(--border)', background: '#f0fdf4',
                color: '#15803d', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600, position: 'sticky', bottom: 0,
              }}
            >
              ➕ Add new customer{trimmed ? ` “${trimmed}”` : ''}
            </button>
          </Dropdown>
        </div>
      ) : null}
    </div>
  )
}

// ── Row editor ────────────────────────────────────────────────────────────────

function SaleRowEditor({
  row,
  idx,
  stock,
  loadingOptions,
  onChange,
  onPickStock,
  onRemove,
  canRemove,
}: {
  row: SaleRow
  idx: number
  stock: StockMaster[]
  loadingOptions: boolean
  onChange: (key: string, field: keyof SaleRow, value: string) => void
  onPickStock: (key: string, s: StockMaster) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const total = rowTotal(row)
  const avail = num(row.available)
  const qty = num(row.quantity)
  const over = row.item_id !== '' && qty > avail
  const inp = (field: keyof SaleRow, type = 'text', extra: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      type={type}
      value={row[field]}
      onChange={(e) => onChange(row._key, field, e.target.value)}
      style={cellInput}
      {...extra}
    />
  )
  return (
    <tr>
      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0.5rem 0.4rem' }}>
        {idx + 1}
      </td>
      <td style={{ padding: '0.4rem 0.5rem', minWidth: 220 }}>
        <StockSearchCombo
          stock={stock}
          valueId={row.item_id}
          valueBatch={row.batch_no}
          disabled={loadingOptions}
          onPick={(s) => onPickStock(row._key, s)}
        />
      </td>
      <td style={{ padding: '0.4rem 0.5rem' }}>
        <input value={row.batch_no} readOnly style={{ ...cellInput, background: '#f8fafc' }} placeholder="—" />
      </td>
      <td style={{ padding: '0.4rem 0.5rem' }}>
        {inp('quantity', 'number', { min: 0, placeholder: '0' })}
        {row.item_id ? (
          <div style={{ fontSize: '0.7rem', marginTop: '0.15rem', color: over ? '#b91c1c' : 'var(--text-muted)' }}>
            {over ? `Only ${avail} in stock` : `Avail ${avail}`}
          </div>
        ) : null}
      </td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('mrp',       'number', { min: 0, step: '0.01' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('sale_rate', 'number', { min: 0, step: '0.01', placeholder: '0.00' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('discount',  'number', { min: 0, max: 100, step: '0.01' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('gst_percent', 'number', { min: 0, step: '0.01' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('expiry_date', 'date')}</td>
      <td
        className={styles.amtCell}
        style={{ padding: '0.4rem 0.75rem', fontWeight: 600, color: total > 0 ? 'var(--medical-deep)' : 'var(--text-muted)' }}
      >
        {total > 0 ? `₹${fmtInr(total)}` : '—'}
      </td>
      <td style={{ padding: '0.4rem 0.35rem', textAlign: 'center' }}>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove row"
            style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px',
              width: '1.75rem', height: '1.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function SalesBillingModal({
  onClose,
  onCreated,
  initialDraft,
  resumeHoldId,
  onHeld,
}: {
  onClose: () => void
  onCreated: (s: Sale) => void
  initialDraft?: HeldBillDraft
  resumeHoldId?: number
  onHeld?: () => void
}) {
  const [customers, setCustomers]           = useState<PartyMaster[]>([])
  const [stock, setStock]                   = useState<StockMaster[]>([])
  const [gstByItem, setGstByItem]           = useState<Map<number, number>>(new Map())
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsErr, setOptionsErr]         = useState<string | null>(null)

  const [customerId,   setCustomerId]   = useState(initialDraft?.customer_id != null ? String(initialDraft.customer_id) : '')
  const [invoiceNo,    setInvoiceNo]    = useState(initialDraft?.invoice_no ?? '')
  const [invoiceDate,  setInvoiceDate]  = useState(initialDraft?.invoice_date || todayStr())
  const [doctorName,   setDoctorName]   = useState(initialDraft?.doctor_name ?? '')
  const [paymentStatus, setPaymentStatus] = useState(initialDraft?.payment_status || 'Unpaid')

  const [rows, setRows]           = useState<SaleRow[]>(() => rowsFromDraft(initialDraft?.rows))
  const [submitting, setSubmitting] = useState(false)
  const [holding, setHolding]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const resuming = resumeHoldId != null

  const [createCustomerName, setCreateCustomerName] = useState<string | null>(null)

  const loadOptions = async () => {
    try {
      const [c, s, items] = await Promise.all([
        fetchPartyMasters('Customer'),
        fetchStockMasters(),
        fetchItemMasters().catch(() => [] as ItemMaster[]),
      ])
      setCustomers(c)
      setStock(s)
      const m = new Map<number, number>()
      for (const it of items) {
        const g = num(it.gst_percent)
        if (it.id != null) m.set(it.id, g)
      }
      setGstByItem(m)
    } catch (e) {
      setOptionsErr(e instanceof Error ? e.message : 'Failed to load customers/stock')
    } finally {
      setLoadingOptions(false)
    }
  }

  useEffect(() => {
    void loadOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && createCustomerName === null) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, createCustomerName])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Keep each row's on-hand "available" in sync with the latest stock (esp. on resume).
  useEffect(() => {
    if (stock.length === 0) return
    setRows((prev) =>
      prev.map((r) => {
        if (!r.item_id) return r
        const s = stock.find((x) => String(x.item_id) === r.item_id && x.batch_no === r.batch_no)
        return s ? { ...r, available: String(num(s.quantity)) } : r
      }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stock])

  function updateRow(key: string, field: keyof SaleRow, value: string) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)))
  }

  function pickStock(key: string, s: StockMaster) {
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r
        const gst = gstByItem.get(s.item_id)
        return {
          ...r,
          item_id: String(s.item_id),
          batch_no: s.batch_no,
          mrp: s.mrp != null ? String(s.mrp) : '',
          sale_rate: s.sale_rate != null ? String(s.sale_rate) : '',
          expiry_date: s.expiry_date ? String(s.expiry_date).slice(0, 10) : '',
          gst_percent: gst != null ? String(gst) : r.gst_percent,
          available: String(num(s.quantity)),
        }
      }),
    )
  }

  function addRow()          { setRows((prev) => [...prev, emptyRow()]) }
  function removeRow(key: string) { setRows((prev) => prev.filter((r) => r._key !== key)) }

  function handleCustomerCreated(c: PartyMaster) {
    setCustomers((prev) => [c, ...prev.filter((x) => x.id !== c.id)])
    setCustomerId(String(c.id))
    setCreateCustomerName(null)
  }

  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0)

  async function handleSubmit() {
    setError(null)
    if (!invoiceDate) { setError('Bill date is required.'); return }

    const validRows = rows.filter((r) => r.item_id && r.quantity && r.sale_rate)
    if (validRows.length === 0) {
      setError('Add at least one item from stock (item, quantity and sale rate are required).')
      return
    }

    // Don't allow selling more than what's in stock
    const over = validRows.find((r) => num(r.quantity) > num(r.available))
    if (over) {
      setError(`Quantity for the selected batch exceeds available stock (${num(over.available)}).`)
      return
    }

    const payload = {
      ...(invoiceNo.trim()   ? { invoice_no:   invoiceNo.trim() }          : {}),
      invoice_date:    invoiceDate,
      ...(customerId         ? { customer_id:  parseInt(customerId) }       : {}),
      ...(doctorName.trim()  ? { doctor_name:  doctorName.trim() }          : {}),
      payment_status:  paymentStatus,
      net_amount:      parseFloat(grandTotal.toFixed(2)),
      items: validRows.map((r) => ({
        item_id:     parseInt(r.item_id),
        ...(r.batch_no.trim()   ? { batch_no:     r.batch_no.trim() }   : {}),
        quantity:    parseFloat(r.quantity),
        ...(r.mrp               ? { mrp:          parseFloat(r.mrp) }   : {}),
        sale_rate:   parseFloat(r.sale_rate),
        discount:    parseFloat(r.discount)    || 0,
        gst_percent: parseFloat(r.gst_percent) || 0,
        ...(r.expiry_date       ? { expiry_date:  r.expiry_date }        : {}),
        total:       parseFloat(rowTotal(r).toFixed(2)),
      })),
    }

    setSubmitting(true)
    try {
      const created = await createSale(payload)
      // Resumed from a held bill → it's now a real sale, so discard the hold.
      if (resumeHoldId != null) {
        await deleteHeldBill(resumeHoldId).catch(() => {})
      }
      onCreated(created)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create bill')
    } finally {
      setSubmitting(false)
    }
  }

  function buildDraft(): HeldBillDraft {
    return {
      customer_id: customerId ? parseInt(customerId) : null,
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      doctor_name: doctorName,
      payment_status: paymentStatus,
      rows: rows.map(({ _key, ...rest }) => { void _key; return rest }),
    }
  }

  async function handleHold() {
    setError(null)
    const filled = rows.filter((r) => r.item_id || r.quantity || r.sale_rate)
    if (filled.length === 0 && !customerId) {
      setError('Nothing to hold yet — pick a customer or add at least one item.')
      return
    }
    const itemCount = rows.filter((r) => r.item_id).length
    const customerName = customerId
      ? partyLabel(customers.find((c) => String(c.id) === customerId) ?? ({ id: 0 } as PartyMaster))
      : 'Walk-in'
    setHolding(true)
    try {
      await holdBill({
        customer_id: customerId ? parseInt(customerId) : null,
        customer_name: customerName,
        invoice_no: invoiceNo.trim() || null,
        invoice_date: invoiceDate || null,
        doctor_name: doctorName.trim() || null,
        payment_status: paymentStatus,
        net_amount: parseFloat(grandTotal.toFixed(2)),
        item_count: itemCount,
        payload: buildDraft(),
      })
      // Re-holding a resumed bill: drop the old hold so we don't duplicate it.
      if (resumeHoldId != null) {
        await deleteHeldBill(resumeHoldId).catch(() => {})
      }
      onHeld?.()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to hold bill')
    } finally {
      setHolding(false)
    }
  }

  return (
    <div
      className={styles.overlayFullscreen}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sb-title"
    >
      {/* ── Header ── */}
      <header className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>
          ← Cancel
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2 id="sb-title">{resuming ? '▶️ Resume Held Bill' : '🧾 New Sales Bill'}</h2>
          <p>{resuming
            ? 'Review the parked bill, then process it — stock is deducted only now'
            : 'Find / add a customer, add items from stock — then save or hold'}</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      {/* ── Body ── */}
      <div className={styles.fsBody}>
        {optionsErr && (
          <div className={`${styles.banner} ${styles.bannerError}`} style={{ marginBottom: '1rem' }}>
            {optionsErr}
          </div>
        )}
        {error && (
          <div className={`${styles.banner} ${styles.bannerError}`} style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* ── Bill header card ── (overflow visible so the customer search dropdown isn't clipped) */}
        <div className={styles.fsKvSection} style={{ marginBottom: '1.35rem', overflow: 'visible' }}>
          <div className={styles.fsKvSectionHead} style={{ borderRadius: '14px 14px 0 0' }}>Bill Details</div>
          <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.85rem 1rem',
              }}
            >
              {/* Customer */}
              <div className={styles.formField}>
                <label htmlFor="sb-customer">Customer</label>
                <CustomerSearchCombo
                  customers={customers}
                  valueId={customerId}
                  disabled={loadingOptions}
                  onPick={(c) => setCustomerId(String(c.id))}
                  onCreateNew={(typed) => setCreateCustomerName(typed)}
                />
              </div>

              {/* Invoice No */}
              <div className={styles.formField}>
                <label htmlFor="sb-invoice-no">Bill / Invoice No</label>
                <input
                  id="sb-invoice-no"
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>

              {/* Invoice Date */}
              <div className={styles.formField}>
                <label htmlFor="sb-invoice-date">Bill Date *</label>
                <input
                  id="sb-invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              {/* Doctor Name */}
              <div className={styles.formField}>
                <label htmlFor="sb-doctor">Doctor Name</label>
                <input
                  id="sb-doctor"
                  type="text"
                  placeholder="Dr. (optional)"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
              </div>

              {/* Payment Status */}
              <div className={styles.formField}>
                <label htmlFor="sb-pay-status">Payment Status</label>
                <select
                  id="sb-pay-status"
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  style={{ padding: '0.55rem 0.65rem', borderRadius: '9px', border: '1px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit', background: '#fff' }}
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Line items ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.65rem',
          }}
        >
          <h3 className={styles.fsSectionTitle} style={{ margin: 0 }}>
            Line Items ({rows.length}) — from stock
          </h3>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={addRow}
            style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
          >
            + Add Row
          </button>
        </div>

        <div className={styles.fsTableWrap} style={{ marginBottom: '1.35rem' }}>
          <div className={styles.tableScroll}>
            <table className={styles.fsTable} style={{ minWidth: 1080 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th style={{ minWidth: 220 }}>Item (from stock) *</th>
                  <th style={{ minWidth: 110 }}>Batch No</th>
                  <th style={{ width: 90 }}>Qty *</th>
                  <th style={{ width: 100 }}>MRP</th>
                  <th style={{ width: 110 }}>Sale Rate *</th>
                  <th style={{ width: 80 }}>Disc %</th>
                  <th style={{ width: 80 }}>GST %</th>
                  <th style={{ width: 130 }}>Expiry Date</th>
                  <th style={{ width: 110 }}>Total</th>
                  <th style={{ width: 40 }} aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <SaleRowEditor
                    key={row._key}
                    row={row}
                    idx={idx}
                    stock={stock}
                    loadingOptions={loadingOptions}
                    onChange={updateRow}
                    onPickStock={pickStock}
                    onRemove={() => removeRow(row._key)}
                    canRemove={rows.length > 1}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc' }}>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: 'right',
                      padding: '0.75rem 0.9rem',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      borderTop: '2px solid var(--border)',
                    }}
                  >
                    Estimated Grand Total (incl. GST)
                  </td>
                  <td
                    style={{
                      padding: '0.75rem 0.75rem',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color: 'var(--medical-deep)',
                      fontVariantNumeric: 'tabular-nums',
                      whiteSpace: 'nowrap',
                      borderTop: '2px solid var(--border)',
                    }}
                  >
                    ₹{fmtInr(grandTotal)}
                  </td>
                  <td style={{ borderTop: '2px solid var(--border)' }} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Actions ── */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end',
            paddingBottom: '1.5rem',
          }}
        >
          <button
            type="button"
            className={styles.btnGhost}
            onClick={onClose}
            disabled={submitting || holding}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnMuted}
            onClick={() => void handleHold()}
            disabled={submitting || holding || loadingOptions}
            title="Park this bill to finish later — no stock is deducted"
          >
            {holding ? 'Holding…' : '⏸ Hold Bill'}
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void handleSubmit()}
            disabled={submitting || holding || loadingOptions}
          >
            {submitting ? 'Saving…' : resuming ? '✅ Process Sale' : '💾 Save Bill'}
          </button>
        </div>
      </div>

      {createCustomerName !== null ? (
        <QuickAddCustomerModal
          initialName={/^\d/.test(createCustomerName) ? '' : createCustomerName}
          initialMobile={/^\d/.test(createCustomerName) ? createCustomerName : ''}
          onClose={() => setCreateCustomerName(null)}
          onCreated={handleCustomerCreated}
        />
      ) : null}
    </div>
  )
}
