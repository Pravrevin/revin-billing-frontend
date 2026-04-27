import { useMemo, useState, type FormEvent } from 'react'
import { updateStockMaster } from '../../services/stockMasterApi'
import type { StockMaster, StockMasterPatchFields } from '../../types/stockMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type EditFormState = {
  item_id: string
  batch_no: string
  manufacture_date: string
  expiry_date: string
  mrp: string
  purchase_rate: string
  sale_rate: string
  quantity: string
  free_quantity: string
  warehouse_id: string
  rack_location: string
  extra_data_json: string
}

function toDateInput(d: string): string {
  if (!d) return ''
  return d.slice(0, 10)
}

function rowToForm(row: StockMaster): EditFormState {
  let extra = ''
  if (row.extra_data != null) {
    try {
      extra = JSON.stringify(row.extra_data, null, 2)
    } catch {
      extra = String(row.extra_data)
    }
  }
  return {
    item_id: String(row.item_id),
    batch_no: row.batch_no,
    manufacture_date: toDateInput(row.manufacture_date),
    expiry_date: toDateInput(row.expiry_date),
    mrp: row.mrp,
    purchase_rate: row.purchase_rate,
    sale_rate: row.sale_rate,
    quantity: row.quantity,
    free_quantity: row.free_quantity,
    warehouse_id: String(row.warehouse_id),
    rack_location: row.rack_location,
    extra_data_json: extra,
  }
}

function intField(s: string, label: string): number {
  const v = Number.parseInt(s, 10)
  if (Number.isNaN(v)) throw new Error(`${label} must be a whole number`)
  return v
}

function decField(s: string, label: string): number {
  const v = Number.parseFloat(s)
  if (Number.isNaN(v)) throw new Error(`${label} must be a valid number`)
  return v
}

function formToPayload(f: EditFormState): StockMasterPatchFields {
  let extra_data: unknown = null
  const raw = f.extra_data_json.trim()
  if (raw) {
    try {
      extra_data = JSON.parse(raw) as unknown
    } catch {
      throw new Error('extra_data must be valid JSON (or leave empty)')
    }
  }

  return {
    item_id: intField(f.item_id, 'Item ID'),
    batch_no: f.batch_no.trim(),
    manufacture_date: f.manufacture_date.trim(),
    expiry_date: f.expiry_date.trim(),
    mrp: decField(f.mrp, 'MRP'),
    purchase_rate: decField(f.purchase_rate, 'Purchase rate'),
    sale_rate: decField(f.sale_rate, 'Sale rate'),
    quantity: decField(f.quantity, 'Quantity'),
    free_quantity: decField(f.free_quantity, 'Free quantity'),
    warehouse_id: intField(f.warehouse_id, 'Warehouse ID'),
    rack_location: f.rack_location.trim(),
    extra_data,
  }
}

type Props = {
  row: StockMaster
  warehouseIds: number[]
  onClose: () => void
  onSaved: (next: StockMaster) => void
}

export function StockMasterEditModal({ row, warehouseIds, onClose, onSaved }: Props) {
  const initial = useMemo(() => rowToForm(row), [row])
  const [form, setForm] = useState<EditFormState>(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const patch =
    <K extends keyof EditFormState>(key: K) =>
    (value: EditFormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const whList = useMemo(() => {
    const set = new Set(warehouseIds.length ? warehouseIds : [row.warehouse_id])
    set.add(row.warehouse_id)
    return [...set].sort((a, b) => a - b)
  }, [warehouseIds, row.warehouse_id])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = formToPayload(form)
      const next = await updateStockMaster(row.id, payload)
      onSaved(next)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-edit-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="sm-edit-title">Edit stock</h2>
            <p>
              Update batch details below. The stock record id stays fixed; all other values can be
              changed and saved together.
            </p>
          </div>
          <div className={styles.headActions}>
            <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <form className={styles.modalForm} onSubmit={submit}>
          <div className={styles.modalBody}>
            {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}

            <section>
              <h3 className={styles.sectionTitle}>Record ID (read-only)</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="sm-id">Stock record id</label>
                  <input
                    id="sm-id"
                    className={styles.inputReadonly}
                    value={String(row.id)}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Batch & item</h3>
              <div className={styles.formGrid}>
                {row.item_name?.trim() ? (
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label htmlFor="sm-item-name">Product name</label>
                    <input
                      id="sm-item-name"
                      className={styles.inputReadonly}
                      value={row.item_name.trim()}
                      readOnly
                      aria-readonly="true"
                    />
                    <p
                      style={{
                        margin: '0.35rem 0 0',
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      From catalog; updating Item ID below may change this after save.
                    </p>
                  </div>
                ) : null}
                <div className={styles.formField}>
                  <label htmlFor="sm-item">Item ID</label>
                  <input
                    id="sm-item"
                    inputMode="numeric"
                    value={form.item_id}
                    onChange={(e) => patch('item_id')(e.target.value)}
                  />
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="sm-batch">Batch no.</label>
                  <input
                    id="sm-batch"
                    value={form.batch_no}
                    onChange={(e) => patch('batch_no')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-mfg">Manufacture date</label>
                  <input
                    id="sm-mfg"
                    type="date"
                    value={form.manufacture_date}
                    onChange={(e) => patch('manufacture_date')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-exp">Expiry date</label>
                  <input
                    id="sm-exp"
                    type="date"
                    value={form.expiry_date}
                    onChange={(e) => patch('expiry_date')(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Rates & quantity</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="sm-mrp">MRP</label>
                  <input
                    id="sm-mrp"
                    inputMode="decimal"
                    value={form.mrp}
                    onChange={(e) => patch('mrp')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-pr">Purchase rate</label>
                  <input
                    id="sm-pr"
                    inputMode="decimal"
                    value={form.purchase_rate}
                    onChange={(e) => patch('purchase_rate')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-sr">Sale rate</label>
                  <input
                    id="sm-sr"
                    inputMode="decimal"
                    value={form.sale_rate}
                    onChange={(e) => patch('sale_rate')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-qty">Quantity</label>
                  <input
                    id="sm-qty"
                    inputMode="decimal"
                    value={form.quantity}
                    onChange={(e) => patch('quantity')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-fq">Free quantity</label>
                  <input
                    id="sm-fq"
                    inputMode="decimal"
                    value={form.free_quantity}
                    onChange={(e) => patch('free_quantity')(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Location</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="sm-wh">Warehouse ID</label>
                  <select
                    id="sm-wh"
                    value={form.warehouse_id}
                    onChange={(e) => patch('warehouse_id')(e.target.value)}
                  >
                    {!whList.includes(Number(form.warehouse_id)) && form.warehouse_id ? (
                      <option value={form.warehouse_id}>{form.warehouse_id}</option>
                    ) : null}
                    {whList.map((w) => (
                      <option key={w} value={String(w)}>
                        Warehouse {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="sm-rack">Rack location</label>
                  <input
                    id="sm-rack"
                    value={form.rack_location}
                    onChange={(e) => patch('rack_location')(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Extra data (JSON)</h3>
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="sm-extra">extra_data</label>
                  <textarea
                    id="sm-extra"
                    rows={4}
                    placeholder="{} or leave empty for null"
                    value={form.extra_data_json}
                    onChange={(e) => patch('extra_data_json')(e.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>
          <div className={styles.modalFoot}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
