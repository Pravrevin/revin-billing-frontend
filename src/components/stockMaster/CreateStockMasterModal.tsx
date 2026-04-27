import { useMemo, useState, type FormEvent } from 'react'
import { createStockMaster } from '../../services/stockMasterApi'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
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

const initialForm: FormState = {
  item_id: '',
  batch_no: '',
  manufacture_date: '',
  expiry_date: '',
  mrp: '',
  purchase_rate: '',
  sale_rate: '',
  quantity: '',
  free_quantity: '',
  warehouse_id: '',
  rack_location: '',
  extra_data_json: '',
}

const OPTIONAL_KEYS: (keyof FormState)[] = [
  'manufacture_date',
  'expiry_date',
  'mrp',
  'purchase_rate',
  'sale_rate',
  'quantity',
  'free_quantity',
  'warehouse_id',
  'rack_location',
  'extra_data_json',
]

function hasOptionalFilled(f: FormState): boolean {
  return OPTIONAL_KEYS.some((k) => String(f[k]).trim() !== '')
}

function buildPayload(f: FormState): Record<string, unknown> {
  const itemId = Number.parseInt(f.item_id.trim(), 10)
  if (Number.isNaN(itemId)) {
    throw new Error('Please enter a valid product item (number).')
  }
  const batch = f.batch_no.trim()
  if (!batch) {
    throw new Error('Please enter a batch number.')
  }

  const minimalOnly = !hasOptionalFilled(f)
  const body: Record<string, unknown> = {
    item_id: itemId,
    batch_no: batch,
  }
  if (minimalOnly) return body

  const addStr = (key: string, v: string) => {
    const t = v.trim()
    if (t) body[key] = t
  }

  const addInt = (key: string, v: string) => {
    const t = v.trim()
    if (!t) return
    const n = Number.parseInt(t, 10)
    if (!Number.isNaN(n)) body[key] = n
  }

  const addNum = (key: string, v: string) => {
    const t = v.trim()
    if (!t) return
    const n = Number.parseFloat(t)
    if (!Number.isNaN(n)) body[key] = n
  }

  addStr('manufacture_date', f.manufacture_date)
  addStr('expiry_date', f.expiry_date)
  addNum('mrp', f.mrp)
  addNum('purchase_rate', f.purchase_rate)
  addNum('sale_rate', f.sale_rate)
  addNum('quantity', f.quantity)
  addNum('free_quantity', f.free_quantity)
  addInt('warehouse_id', f.warehouse_id)
  addStr('rack_location', f.rack_location)

  const raw = f.extra_data_json.trim()
  if (raw) {
    try {
      body.extra_data = JSON.parse(raw) as unknown
    } catch {
      throw new Error('Additional details must be valid JSON, or leave the box empty.')
    }
  }

  return body
}

function FormLabel({
  htmlFor,
  title,
  required,
}: {
  htmlFor: string
  title: string
  required?: boolean
}) {
  return (
    <label className={styles.fieldLabel} htmlFor={htmlFor}>
      <span className={styles.fieldLabelTitle}>
        {title}
        {required ? <span className={styles.keyRequired}> *</span> : null}
      </span>
    </label>
  )
}

type Props = {
  warehouseIds: number[]
  itemIds: number[]
  itemIdLabels: Map<number, string>
  onClose: () => void
  onCreated: () => void
}

export function CreateStockMasterModal({
  warehouseIds,
  itemIds,
  itemIdLabels,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const itemDatalistId = 'sm-create-item-ids'
  const whDatalistId = 'sm-create-warehouse-ids'

  const sortedItemIds = useMemo(() => {
    const set = new Set(itemIds)
    return [...set].sort((a, b) => a - b)
  }, [itemIds])

  const sortedWhIds = useMemo(() => {
    const set = new Set(warehouseIds)
    return [...set].sort((a, b) => a - b)
  }, [warehouseIds])

  const patch =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = buildPayload(form)
      await createStockMaster(payload)
      setForm(initialForm)
      onCreated()
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const inp = (k: keyof FormState, placeholder: string, extra?: { list?: string }) => (
    <input
      id={`sm-create-${k}`}
      className={styles.searchInput}
      value={form[k]}
      onChange={(e) => patch(k)(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      list={extra?.list}
    />
  )

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <datalist id={itemDatalistId}>
        {sortedItemIds.map((id) => (
          <option key={id} value={String(id)} label={itemIdLabels.get(id) ?? undefined} />
        ))}
      </datalist>
      <datalist id={whDatalistId}>
        {sortedWhIds.map((id) => (
          <option key={id} value={String(id)} />
        ))}
      </datalist>

      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sm-create-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="sm-create-title">Create stock line</h2>
            <p>
              <strong>Product item</strong> and <strong>batch number</strong> are required. You can add
              dates, rates, quantity, warehouse, and rack when ready—placeholders show examples. Leave
              the rest blank to save a minimal line.
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
              <h3 className={styles.sectionTitle}>Basics</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-item_id" title="Product item" required />
                  {inp('item_id', 'e.g. 1', { list: itemDatalistId })}
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-batch_no" title="Batch number" required />
                  {inp('batch_no', 'e.g. BATCH001')}
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Dates</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-manufacture_date" title="Manufacture date" />
                  <input
                    id="sm-create-manufacture_date"
                    type="date"
                    className={styles.searchInput}
                    value={form.manufacture_date}
                    onChange={(e) => patch('manufacture_date')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-expiry_date" title="Expiry date" />
                  <input
                    id="sm-create-expiry_date"
                    type="date"
                    className={styles.searchInput}
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
                  <FormLabel htmlFor="sm-create-mrp" title="MRP" />
                  {inp('mrp', 'e.g. 50')}
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-purchase_rate" title="Purchase rate" />
                  {inp('purchase_rate', 'e.g. 35')}
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-sale_rate" title="Sale rate" />
                  {inp('sale_rate', 'e.g. 45')}
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-quantity" title="Quantity" />
                  {inp('quantity', 'e.g. 200')}
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-free_quantity" title="Free quantity" />
                  {inp('free_quantity', 'e.g. 10')}
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Location</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-warehouse_id" title="Warehouse" />
                  {inp('warehouse_id', 'e.g. 1', { list: whDatalistId })}
                </div>
                <div className={styles.formField}>
                  <FormLabel htmlFor="sm-create-rack_location" title="Rack location" />
                  {inp('rack_location', 'e.g. A-01-03')}
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Additional details</h3>
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FormLabel htmlFor="sm-create-extra_data" title="Supplier, invoice, etc. (optional)" />
                  <textarea
                    id="sm-create-extra_data"
                    value={form.extra_data_json}
                    onChange={(e) => patch('extra_data_json')(e.target.value)}
                    placeholder={`e.g. {\n  "supplier": "ABC Pharma",\n  "invoice_no": "INV-2024-001"\n}`}
                    rows={5}
                    spellCheck={false}
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
              {saving ? 'Creating…' : 'Create stock line'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
