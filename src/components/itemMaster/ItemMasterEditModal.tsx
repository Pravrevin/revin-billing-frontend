import { useMemo, useState, type FormEvent } from 'react'
import { updateItemMaster } from '../../services/itemMasterApi'
import type { ItemMaster, ItemMasterPatchFields } from '../../types/itemMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type EditFormState = {
  item_code: string
  item_name: string
  generic_name: string
  brand_name: string
  composition: string
  strength: string
  dosage_form: string
  category_id: string
  sub_category_id: string
  marketer_id: string
  packing_type: string
  pack_size: string
  unit_primary: string
  unit_secondary: string
  conversion_factor: string
  gst_percent: string
  cgst: string
  sgst: string
  igst: string
  cess_percent: string
  hsn_code: string
  tax_type: string
  min_discount: string
  max_discount: string
  is_discount_allowed: boolean
  pricing_type: string
  min_stock_level: string
  max_stock_level: string
  reorder_level: string
  is_batch_required: boolean
  is_expiry_required: boolean
  shelf_life_days: string
  lead_time_days: string
  schedule_type: string
  is_narcotic: boolean
  is_psychotropic: boolean
  prescription_required: boolean
  drug_license_required: boolean
  regulatory_category: string
  barcode: string
  qr_code: string
  sku_code: string
  external_code: string
  is_active: boolean
  extra_data_json: string
}

function itemToForm(item: ItemMaster): EditFormState {
  let extra = ''
  if (item.extra_data != null) {
    try {
      extra = JSON.stringify(item.extra_data, null, 2)
    } catch {
      extra = String(item.extra_data)
    }
  }
  return {
    item_code: item.item_code,
    item_name: item.item_name,
    generic_name: item.generic_name,
    brand_name: item.brand_name,
    composition: item.composition,
    strength: item.strength,
    dosage_form: item.dosage_form,
    category_id: String(item.category_id),
    sub_category_id: String(item.sub_category_id),
    marketer_id: String(item.marketer_id),
    packing_type: item.packing_type,
    pack_size: String(item.pack_size),
    unit_primary: item.unit_primary,
    unit_secondary: item.unit_secondary,
    conversion_factor: item.conversion_factor,
    gst_percent: item.gst_percent,
    cgst: item.cgst,
    sgst: item.sgst,
    igst: item.igst,
    cess_percent: item.cess_percent,
    hsn_code: item.hsn_code,
    tax_type: item.tax_type,
    min_discount: item.min_discount,
    max_discount: item.max_discount,
    is_discount_allowed: item.is_discount_allowed,
    pricing_type: item.pricing_type,
    min_stock_level: String(item.min_stock_level),
    max_stock_level: String(item.max_stock_level),
    reorder_level: String(item.reorder_level),
    is_batch_required: item.is_batch_required,
    is_expiry_required: item.is_expiry_required,
    shelf_life_days: String(item.shelf_life_days),
    lead_time_days: String(item.lead_time_days),
    schedule_type: item.schedule_type,
    is_narcotic: item.is_narcotic,
    is_psychotropic: item.is_psychotropic,
    prescription_required: item.prescription_required,
    drug_license_required: item.drug_license_required,
    regulatory_category: item.regulatory_category,
    barcode: item.barcode ?? '',
    qr_code: item.qr_code ?? '',
    sku_code: item.sku_code ?? '',
    external_code: item.external_code ?? '',
    is_active: item.is_active,
    extra_data_json: extra,
  }
}

function strOrNull(s: string): string | null {
  const t = s.trim()
  return t ? t : null
}

function formToPayload(f: EditFormState): ItemMasterPatchFields {
  const n = (s: string, label: string) => {
    const v = Number(s)
    if (Number.isNaN(v)) throw new Error(`${label} must be a valid number`)
    return v
  }

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
    item_code: f.item_code.trim(),
    item_name: f.item_name.trim(),
    generic_name: f.generic_name.trim(),
    brand_name: f.brand_name.trim(),
    composition: f.composition.trim(),
    strength: f.strength.trim(),
    dosage_form: f.dosage_form.trim(),
    category_id: n(f.category_id, 'Category ID'),
    sub_category_id: n(f.sub_category_id, 'Sub-category ID'),
    marketer_id: n(f.marketer_id, 'Marketer ID'),
    packing_type: f.packing_type.trim(),
    pack_size: n(f.pack_size, 'Pack size'),
    unit_primary: f.unit_primary.trim(),
    unit_secondary: f.unit_secondary.trim(),
    conversion_factor: f.conversion_factor.trim(),
    gst_percent: f.gst_percent.trim(),
    cgst: f.cgst.trim(),
    sgst: f.sgst.trim(),
    igst: f.igst.trim(),
    cess_percent: f.cess_percent.trim(),
    hsn_code: f.hsn_code.trim(),
    tax_type: f.tax_type.trim(),
    min_discount: f.min_discount.trim(),
    max_discount: f.max_discount.trim(),
    is_discount_allowed: f.is_discount_allowed,
    pricing_type: f.pricing_type.trim(),
    min_stock_level: n(f.min_stock_level, 'Min stock level'),
    max_stock_level: n(f.max_stock_level, 'Max stock level'),
    reorder_level: n(f.reorder_level, 'Reorder level'),
    is_batch_required: f.is_batch_required,
    is_expiry_required: f.is_expiry_required,
    shelf_life_days: n(f.shelf_life_days, 'Shelf life (days)'),
    lead_time_days: n(f.lead_time_days, 'Lead time (days)'),
    schedule_type: f.schedule_type.trim(),
    is_narcotic: f.is_narcotic,
    is_psychotropic: f.is_psychotropic,
    prescription_required: f.prescription_required,
    drug_license_required: f.drug_license_required,
    regulatory_category: f.regulatory_category.trim(),
    barcode: strOrNull(f.barcode),
    qr_code: strOrNull(f.qr_code),
    sku_code: strOrNull(f.sku_code),
    external_code: strOrNull(f.external_code),
    is_active: f.is_active,
    extra_data,
  }
}

type Props = {
  item: ItemMaster
  dosageForms: string[]
  schedules: string[]
  regulatoryOpts: string[]
  packingTypes: string[]
  onClose: () => void
  onSaved: (next: ItemMaster) => void
}

export function ItemMasterEditModal({
  item,
  dosageForms,
  schedules,
  regulatoryOpts,
  packingTypes,
  onClose,
  onSaved,
}: Props) {
  const initial = useMemo(() => itemToForm(item), [item])
  const [form, setForm] = useState<EditFormState>(initial)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const patch =
    <K extends keyof EditFormState>(key: K) =>
    (value: EditFormState[K]) =>
      setForm((f) => ({ ...f, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = formToPayload(form)
      const next = await updateItemMaster(item.id, payload)
      onSaved(next)
      onClose()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const sch = schedules.length ? schedules : [item.schedule_type]
  const reg = regulatoryOpts.length ? regulatoryOpts : [item.regulatory_category]
  const pack = packingTypes.length ? packingTypes : [item.packing_type]

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
        aria-labelledby="edit-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="edit-title">Edit product</h2>
            <p>
              <code>item_id</code> is always sent with PATCH; all other fields below are editable.
              You can change one field or many — the full form is submitted together.
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
              <h3 className={styles.sectionTitle}>Item ID (read-only)</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-item-id">Item ID (mandatory in request body)</label>
                  <input
                    id="pm-item-id"
                    className={styles.inputReadonly}
                    value={String(item.id)}
                    readOnly
                    aria-readonly="true"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Identity</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-item_code">Item code</label>
                  <input id="pm-item_code" value={form.item_code} onChange={(e) => patch('item_code')(e.target.value)} />
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="pm-item_name">Item name</label>
                  <input id="pm-item_name" value={form.item_name} onChange={(e) => patch('item_name')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-generic">Generic name</label>
                  <input
                    id="pm-generic"
                    value={form.generic_name}
                    onChange={(e) => patch('generic_name')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-brand">Brand</label>
                  <input id="pm-brand" value={form.brand_name} onChange={(e) => patch('brand_name')(e.target.value)} />
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="pm-comp">Composition</label>
                  <textarea
                    id="pm-comp"
                    value={form.composition}
                    onChange={(e) => patch('composition')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-strength">Strength</label>
                  <input id="pm-strength" value={form.strength} onChange={(e) => patch('strength')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-form">Dosage form</label>
                  <input
                    id="pm-form"
                    list="pm-dosage-forms"
                    value={form.dosage_form}
                    onChange={(e) => patch('dosage_form')(e.target.value)}
                  />
                  <datalist id="pm-dosage-forms">
                    {dosageForms.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Classification IDs</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-cat">Category ID</label>
                  <input
                    id="pm-cat"
                    inputMode="numeric"
                    value={form.category_id}
                    onChange={(e) => patch('category_id')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-subcat">Sub-category ID</label>
                  <input
                    id="pm-subcat"
                    inputMode="numeric"
                    value={form.sub_category_id}
                    onChange={(e) => patch('sub_category_id')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-mkt">Marketer ID</label>
                  <input
                    id="pm-mkt"
                    inputMode="numeric"
                    value={form.marketer_id}
                    onChange={(e) => patch('marketer_id')(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Packing & units</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-pack">Packing type</label>
                  <input
                    id="pm-pack"
                    list="pm-packing-types"
                    value={form.packing_type}
                    onChange={(e) => patch('packing_type')(e.target.value)}
                  />
                  <datalist id="pm-packing-types">
                    {pack.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-packsize">Pack size</label>
                  <input
                    id="pm-packsize"
                    inputMode="numeric"
                    value={form.pack_size}
                    onChange={(e) => patch('pack_size')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-upri">Primary unit</label>
                  <input
                    id="pm-upri"
                    value={form.unit_primary}
                    onChange={(e) => patch('unit_primary')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-usec">Secondary unit</label>
                  <input
                    id="pm-usec"
                    value={form.unit_secondary}
                    onChange={(e) => patch('unit_secondary')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-conv">Conversion factor</label>
                  <input
                    id="pm-conv"
                    value={form.conversion_factor}
                    onChange={(e) => patch('conversion_factor')(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Tax & pricing</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-gst">GST %</label>
                  <input id="pm-gst" value={form.gst_percent} onChange={(e) => patch('gst_percent')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-cgst">CGST</label>
                  <input id="pm-cgst" value={form.cgst} onChange={(e) => patch('cgst')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-sgst">SGST</label>
                  <input id="pm-sgst" value={form.sgst} onChange={(e) => patch('sgst')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-igst">IGST</label>
                  <input id="pm-igst" value={form.igst} onChange={(e) => patch('igst')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-cess">Cess %</label>
                  <input id="pm-cess" value={form.cess_percent} onChange={(e) => patch('cess_percent')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-hsn">HSN code</label>
                  <input id="pm-hsn" value={form.hsn_code} onChange={(e) => patch('hsn_code')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-taxtype">Tax type</label>
                  <input id="pm-taxtype" value={form.tax_type} onChange={(e) => patch('tax_type')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-pricetype">Pricing type</label>
                  <input
                    id="pm-pricetype"
                    value={form.pricing_type}
                    onChange={(e) => patch('pricing_type')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-mind">Min discount %</label>
                  <input
                    id="pm-mind"
                    value={form.min_discount}
                    onChange={(e) => patch('min_discount')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-maxd">Max discount %</label>
                  <input
                    id="pm-maxd"
                    value={form.max_discount}
                    onChange={(e) => patch('max_discount')(e.target.value)}
                  />
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.is_discount_allowed}
                      onChange={(e) => patch('is_discount_allowed')(e.target.checked)}
                    />
                    Discount allowed
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Stock</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-minst">Min stock</label>
                  <input
                    id="pm-minst"
                    inputMode="numeric"
                    value={form.min_stock_level}
                    onChange={(e) => patch('min_stock_level')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-maxst">Max stock</label>
                  <input
                    id="pm-maxst"
                    inputMode="numeric"
                    value={form.max_stock_level}
                    onChange={(e) => patch('max_stock_level')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-reo">Reorder level</label>
                  <input
                    id="pm-reo"
                    inputMode="numeric"
                    value={form.reorder_level}
                    onChange={(e) => patch('reorder_level')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-shelf">Shelf life (days)</label>
                  <input
                    id="pm-shelf"
                    inputMode="numeric"
                    value={form.shelf_life_days}
                    onChange={(e) => patch('shelf_life_days')(e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-lead">Lead time (days)</label>
                  <input
                    id="pm-lead"
                    inputMode="numeric"
                    value={form.lead_time_days}
                    onChange={(e) => patch('lead_time_days')(e.target.value)}
                  />
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.is_batch_required}
                      onChange={(e) => patch('is_batch_required')(e.target.checked)}
                    />
                    Batch required
                  </label>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.is_expiry_required}
                      onChange={(e) => patch('is_expiry_required')(e.target.checked)}
                    />
                    Expiry required
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Regulatory</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-schedule">Schedule</label>
                  <select
                    id="pm-schedule"
                    value={form.schedule_type}
                    onChange={(e) => patch('schedule_type')(e.target.value)}
                  >
                    {!sch.includes(form.schedule_type) && form.schedule_type ? (
                      <option value={form.schedule_type}>{form.schedule_type}</option>
                    ) : null}
                    {sch.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-reg">Regulatory category</label>
                  <select
                    id="pm-reg"
                    value={form.regulatory_category}
                    onChange={(e) => patch('regulatory_category')(e.target.value)}
                  >
                    {!reg.includes(form.regulatory_category) && form.regulatory_category ? (
                      <option value={form.regulatory_category}>{form.regulatory_category}</option>
                    ) : null}
                    {reg.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.prescription_required}
                      onChange={(e) => patch('prescription_required')(e.target.checked)}
                    />
                    Prescription required
                  </label>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.drug_license_required}
                      onChange={(e) => patch('drug_license_required')(e.target.checked)}
                    />
                    Drug license required
                  </label>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.is_narcotic}
                      onChange={(e) => patch('is_narcotic')(e.target.checked)}
                    />
                    Narcotic
                  </label>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.is_psychotropic}
                      onChange={(e) => patch('is_psychotropic')(e.target.checked)}
                    />
                    Psychotropic
                  </label>
                  <label className={styles.checkRow}>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => patch('is_active')(e.target.checked)}
                    />
                    Active
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Codes</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label htmlFor="pm-barcode">Barcode</label>
                  <input id="pm-barcode" value={form.barcode} onChange={(e) => patch('barcode')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-qr">QR code</label>
                  <input id="pm-qr" value={form.qr_code} onChange={(e) => patch('qr_code')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-sku">SKU code</label>
                  <input id="pm-sku" value={form.sku_code} onChange={(e) => patch('sku_code')(e.target.value)} />
                </div>
                <div className={styles.formField}>
                  <label htmlFor="pm-ext">External code</label>
                  <input
                    id="pm-ext"
                    value={form.external_code}
                    onChange={(e) => patch('external_code')(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Extra data (JSON)</h3>
              <div className={styles.formGrid}>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <label htmlFor="pm-extra">extra_data</label>
                  <textarea
                    id="pm-extra"
                    value={form.extra_data_json}
                    onChange={(e) => patch('extra_data_json')(e.target.value)}
                    placeholder="{} or leave empty for null"
                    rows={4}
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
