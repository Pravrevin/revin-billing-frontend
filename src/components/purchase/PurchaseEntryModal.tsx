import { type CSSProperties, type InputHTMLAttributes, useEffect, useState } from 'react'
import { fetchItemMasters } from '../../services/itemMasterApi'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import { createPurchase } from '../../services/purchaseApi'
import type { ItemMaster } from '../../types/itemMaster'
import type { PartyMaster } from '../../types/partyMaster'
import type { Purchase } from '../../types/purchase'
import styles from '../../pages/ProductMasterPage.module.css'

// ── Types ───────────────────────────────────────────────────────────────────

type ItemRow = {
  _key: string
  item_id: string
  batch_no: string
  quantity: string
  free_quantity: string
  purchase_rate: string
  mrp: string
  sale_rate: string
  discount: string
  gst_percent: string
  expiry_date: string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function emptyRow(): ItemRow {
  return {
    _key: crypto.randomUUID(),
    item_id: '',
    batch_no: '',
    quantity: '',
    free_quantity: '0',
    purchase_rate: '',
    mrp: '',
    sale_rate: '',
    discount: '0',
    gst_percent: '',
    expiry_date: '',
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function rowTotal(row: ItemRow): number {
  const qty = parseFloat(row.quantity) || 0
  const rate = parseFloat(row.purchase_rate) || 0
  const disc = parseFloat(row.discount) || 0
  const gst = parseFloat(row.gst_percent) || 0
  const gross = qty * rate
  const discAmt = gross * (disc / 100)
  const taxable = gross - discAmt
  return taxable + taxable * (gst / 100)
}

function fmtInr(n: number) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── Cell input styles ────────────────────────────────────────────────────────

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

const cellSelect: CSSProperties = {
  ...cellInput,
  minWidth: 160,
}

// ── Row editor ───────────────────────────────────────────────────────────────

function ItemRowEditor({
  row,
  idx,
  items,
  loadingOptions,
  onChange,
  onRemove,
  canRemove,
}: {
  row: ItemRow
  idx: number
  items: ItemMaster[]
  loadingOptions: boolean
  onChange: (key: string, field: keyof ItemRow, value: string) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const total = rowTotal(row)
  const inp = (field: keyof ItemRow, type = 'text', extra: InputHTMLAttributes<HTMLInputElement> = {}) => (
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
      <td style={{ padding: '0.4rem 0.5rem' }}>
        <select
          value={row.item_id}
          onChange={(e) => onChange(row._key, 'item_id', e.target.value)}
          disabled={loadingOptions}
          style={cellSelect}
        >
          <option value="">— Select Item —</option>
          {items.map((i) => (
            <option key={i.id} value={String(i.id)}>
              {i.item_name}
            </option>
          ))}
        </select>
      </td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('batch_no', 'text', { placeholder: 'BATCH…' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('quantity', 'number', { min: 0, placeholder: '0' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('free_quantity', 'number', { min: 0 })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('purchase_rate', 'number', { min: 0, step: '0.01', placeholder: '0.00' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('mrp', 'number', { min: 0, step: '0.01' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('sale_rate', 'number', { min: 0, step: '0.01' })}</td>
      <td style={{ padding: '0.4rem 0.5rem' }}>{inp('discount', 'number', { min: 0, max: 100, step: '0.01' })}</td>
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
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '6px',
              width: '1.75rem',
              height: '1.75rem',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  )
}

// ── Main modal ───────────────────────────────────────────────────────────────

export function PurchaseEntryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (p: Purchase) => void
}) {
  const [suppliers, setSuppliers] = useState<PartyMaster[]>([])
  const [itemOptions, setItemOptions] = useState<ItemMaster[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionsErr, setOptionsErr] = useState<string | null>(null)

  const [supplierId, setSupplierId] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(todayStr())
  const [entryDate, setEntryDate] = useState(todayStr())
  const [dueDate, setDueDate] = useState(daysFromNow(30))

  const [rows, setRows] = useState<ItemRow[]>([emptyRow()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [s, i] = await Promise.all([fetchPartyMasters('Distributor'), fetchItemMasters()])
        setSuppliers(s)
        setItemOptions(i)
      } catch (e) {
        setOptionsErr(e instanceof Error ? e.message : 'Failed to load suppliers/items')
      } finally {
        setLoadingOptions(false)
      }
    })()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  function updateRow(key: string, field: keyof ItemRow, value: string) {
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return r
        const updated = { ...r, [field]: value }
        // Auto-fill GST when item is selected
        if (field === 'item_id') {
          const item = itemOptions.find((i) => String(i.id) === value)
          if (item?.gst_percent) {
            updated.gst_percent = String(parseFloat(item.gst_percent) || '')
          }
        }
        return updated
      }),
    )
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r._key !== key))
  }

  const grandTotal = rows.reduce((s, r) => s + rowTotal(r), 0)

  async function handleSubmit() {
    setError(null)
    if (!supplierId) { setError('Please select a supplier.'); return }
    if (!invoiceDate) { setError('Invoice date is required.'); return }

    const validRows = rows.filter((r) => r.item_id && r.quantity && r.purchase_rate)
    if (validRows.length === 0) {
      setError('Add at least one complete item row (item, quantity and purchase rate are required).')
      return
    }

    const payload = {
      supplier_id: parseInt(supplierId),
      ...(invoiceNo.trim() ? { invoice_no: invoiceNo.trim() } : {}),
      invoice_date: invoiceDate,
      entry_date: entryDate || invoiceDate,
      due_date: dueDate || undefined,
      items: validRows.map((r) => ({
        item_id: parseInt(r.item_id),
        ...(r.batch_no.trim() ? { batch_no: r.batch_no.trim() } : {}),
        quantity: parseFloat(r.quantity),
        free_quantity: parseFloat(r.free_quantity) || 0,
        purchase_rate: parseFloat(r.purchase_rate),
        ...(r.mrp ? { mrp: parseFloat(r.mrp) } : {}),
        ...(r.sale_rate ? { sale_rate: parseFloat(r.sale_rate) } : {}),
        discount: parseFloat(r.discount) || 0,
        gst_percent: parseFloat(r.gst_percent) || 0,
        ...(r.expiry_date ? { expiry_date: r.expiry_date } : {}),
      })),
    }

    setSubmitting(true)
    try {
      const created = await createPurchase(payload)
      onCreated(created)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const supplierName = (s: PartyMaster) =>
    String(s.party_name ?? s.name ?? `Supplier #${s.id}`)

  return (
    <div
      className={styles.overlayFullscreen}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pe-title"
    >
      {/* Header */}
      <header className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>
          ← Cancel
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2 id="pe-title">New Purchase Entry</h2>
          <p>Select supplier, fill dates and add line items — then save</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>

      {/* Body */}
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

        {/* ── Invoice header card ── */}
        <div className={styles.fsKvSection} style={{ marginBottom: '1.35rem' }}>
          <div className={styles.fsKvSectionHead}>Invoice Details</div>
          <div style={{ padding: '1rem 1.1rem 1.1rem' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.85rem 1rem',
              }}
            >
              {/* Supplier */}
              <div className={styles.formField}>
                <label htmlFor="pe-supplier">Supplier *</label>
                <select
                  id="pe-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  disabled={loadingOptions}
                  style={{ padding: '0.55rem 0.65rem', borderRadius: '9px', border: '1px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit', background: '#fff' }}
                >
                  <option value="">{loadingOptions ? 'Loading…' : '— Select Supplier —'}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {supplierName(s)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Invoice No */}
              <div className={styles.formField}>
                <label htmlFor="pe-invoice-no">Invoice No</label>
                <input
                  id="pe-invoice-no"
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                />
              </div>

              {/* Invoice Date */}
              <div className={styles.formField}>
                <label htmlFor="pe-invoice-date">Invoice Date *</label>
                <input
                  id="pe-invoice-date"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>

              {/* Entry Date */}
              <div className={styles.formField}>
                <label htmlFor="pe-entry-date">Entry Date</label>
                <input
                  id="pe-entry-date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>

              {/* Due Date */}
              <div className={styles.formField}>
                <label htmlFor="pe-due-date">Due Date</label>
                <input
                  id="pe-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
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
            Line Items ({rows.length})
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
            <table className={styles.fsTable} style={{ minWidth: 1180 }}>
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th style={{ minWidth: 190 }}>Item *</th>
                  <th style={{ minWidth: 110 }}>Batch No</th>
                  <th style={{ width: 80 }}>Qty *</th>
                  <th style={{ width: 80 }}>Free Qty</th>
                  <th style={{ width: 115 }}>Purchase Rate *</th>
                  <th style={{ width: 100 }}>MRP</th>
                  <th style={{ width: 100 }}>Sale Rate</th>
                  <th style={{ width: 80 }}>Disc %</th>
                  <th style={{ width: 80 }}>GST %</th>
                  <th style={{ width: 130 }}>Expiry Date</th>
                  <th style={{ width: 110 }}>Total</th>
                  <th style={{ width: 40 }} aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <ItemRowEditor
                    key={row._key}
                    row={row}
                    idx={idx}
                    items={itemOptions}
                    loadingOptions={loadingOptions}
                    onChange={updateRow}
                    onRemove={() => removeRow(row._key)}
                    canRemove={rows.length > 1}
                  />
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc' }}>
                  <td
                    colSpan={11}
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
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void handleSubmit()}
            disabled={submitting || loadingOptions}
          >
            {submitting ? 'Saving…' : 'Save Purchase'}
          </button>
        </div>
      </div>
    </div>
  )
}
