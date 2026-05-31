import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { fetchBrands } from '../../services/brandMasterApi'
import { fetchCategories, fetchSubCategories } from '../../services/categoryMasterApi'
import { createItemMaster } from '../../services/itemMasterApi'
import { fetchPackagingMasters } from '../../services/packagingMasterApi'
import { fetchUnits } from '../../services/unitMasterApi'
import type { BrandMaster } from '../../types/brandMaster'
import type { CategoryMaster, SubCategoryMaster } from '../../types/categoryMaster'
import type { ItemMaster } from '../../types/itemMaster'
import type { PackagingMaster } from '../../types/packagingMaster'
import type { UnitMaster } from '../../types/unitMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  item_code: string
  item_name: string
  generic_name: string
  brand_name: string
  composition: string
  strength: string
  dosage_form: string
  unit_name: string
  category_name: string
  sub_category_name: string
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
  pricing_type: string
  min_stock_level: string
  max_stock_level: string
  reorder_level: string
  shelf_life_days: string
  lead_time_days: string
  schedule_type: string
  regulatory_category: string
  barcode: string
  sku_code: string
  is_discount_allowed: boolean
  is_batch_required: boolean
  is_expiry_required: boolean
  is_narcotic: boolean
  is_psychotropic: boolean
  prescription_required: boolean
  drug_license_required: boolean
  is_active: boolean
}

const BOOLEAN_DEFAULTS = {
  is_discount_allowed: true,
  is_batch_required: true,
  is_expiry_required: true,
  is_narcotic: false,
  is_psychotropic: false,
  prescription_required: false,
  drug_license_required: false,
  is_active: true,
} as const

const initialForm: FormState = {
  item_code: '',
  item_name: '',
  generic_name: '',
  brand_name: '',
  composition: '',
  strength: '',
  dosage_form: '',
  unit_name: '',
  category_name: '',
  sub_category_name: '',
  packing_type: '',
  pack_size: '',
  unit_primary: '',
  unit_secondary: '',
  conversion_factor: '',
  gst_percent: '',
  cgst: '',
  sgst: '',
  igst: '',
  cess_percent: '',
  hsn_code: '',
  tax_type: '',
  min_discount: '',
  max_discount: '',
  pricing_type: '',
  min_stock_level: '',
  max_stock_level: '',
  reorder_level: '',
  shelf_life_days: '',
  lead_time_days: '',
  schedule_type: '',
  regulatory_category: '',
  barcode: '',
  sku_code: '',
  is_discount_allowed: true,
  is_batch_required: true,
  is_expiry_required: true,
  is_narcotic: false,
  is_psychotropic: false,
  prescription_required: false,
  drug_license_required: false,
  is_active: true,
}

function hasOptionalFilled(f: FormState): boolean {
  const keys: (keyof FormState)[] = [
    'generic_name',
    'brand_name',
    'composition',
    'strength',
    'dosage_form',
    'unit_name',
    'category_name',
    'sub_category_name',
    'packing_type',
    'pack_size',
    'unit_primary',
    'unit_secondary',
    'conversion_factor',
    'gst_percent',
    'cgst',
    'sgst',
    'igst',
    'cess_percent',
    'hsn_code',
    'tax_type',
    'min_discount',
    'max_discount',
    'pricing_type',
    'min_stock_level',
    'max_stock_level',
    'reorder_level',
    'shelf_life_days',
    'lead_time_days',
    'schedule_type',
    'regulatory_category',
    'barcode',
    'sku_code',
  ]
  return keys.some((k) => String(f[k]).trim() !== '')
}

function booleansDifferFromDefaults(f: FormState): boolean {
  return (
    f.is_discount_allowed !== BOOLEAN_DEFAULTS.is_discount_allowed ||
    f.is_batch_required !== BOOLEAN_DEFAULTS.is_batch_required ||
    f.is_expiry_required !== BOOLEAN_DEFAULTS.is_expiry_required ||
    f.is_narcotic !== BOOLEAN_DEFAULTS.is_narcotic ||
    f.is_psychotropic !== BOOLEAN_DEFAULTS.is_psychotropic ||
    f.prescription_required !== BOOLEAN_DEFAULTS.prescription_required ||
    f.drug_license_required !== BOOLEAN_DEFAULTS.drug_license_required ||
    f.is_active !== BOOLEAN_DEFAULTS.is_active
  )
}

function buildPayload(f: FormState): Record<string, unknown> {
  const name = f.item_name.trim()
  if (!name) {
    throw new Error('Please enter product name.')
  }

  const minimalOnly = !hasOptionalFilled(f) && !booleansDifferFromDefaults(f)
  const body: Record<string, unknown> = {
    item_name: name,
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

  addStr('generic_name', f.generic_name)
  addStr('brand_name', f.brand_name)
  addStr('composition', f.composition)
  addStr('strength', f.strength)
  addStr('dosage_form', f.dosage_form)
  addStr('unit_name', f.unit_name)
  addStr('category_name', f.category_name)
  addStr('sub_category_name', f.sub_category_name)
  addStr('packing_type', f.packing_type)
  addInt('pack_size', f.pack_size)
  addNum('conversion_factor', f.conversion_factor)
  addNum('gst_percent', f.gst_percent)
  addNum('cgst', f.cgst)
  addNum('sgst', f.sgst)
  addNum('igst', f.igst)
  addNum('cess_percent', f.cess_percent)
  addStr('hsn_code', f.hsn_code)
  addStr('tax_type', f.tax_type)
  addNum('min_discount', f.min_discount)
  addNum('max_discount', f.max_discount)
  addStr('pricing_type', f.pricing_type)
  addInt('min_stock_level', f.min_stock_level)
  addInt('max_stock_level', f.max_stock_level)
  addInt('reorder_level', f.reorder_level)
  addInt('shelf_life_days', f.shelf_life_days)
  addInt('lead_time_days', f.lead_time_days)
  addStr('schedule_type', f.schedule_type)
  addStr('barcode', f.barcode)
  addStr('sku_code', f.sku_code)

  body.is_discount_allowed = f.is_discount_allowed
  body.is_batch_required = f.is_batch_required
  body.is_expiry_required = f.is_expiry_required
  body.is_narcotic = f.is_narcotic
  body.is_psychotropic = f.is_psychotropic
  body.prescription_required = f.prescription_required
  body.drug_license_required = f.drug_license_required
  body.is_active = f.is_active

  return body
}

function FieldLabel({
  htmlFor,
  title,
  required,
}: {
  htmlFor: string
  title: string
  apiKey: string
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

function FieldHeader({
  title,
  required,
}: {
  title: string
  apiKey: string
  required?: boolean
}) {
  return (
    <div className={styles.fieldHeader}>
      <span className={styles.fieldLabelTitle}>
        {title}
        {required ? <span className={styles.keyRequired}> *</span> : null}
      </span>
    </div>
  )
}

type Props = {
  onClose: () => void
  /** Receives the newly created item (callers that don't need it can ignore the arg). */
  onCreated: (item?: ItemMaster) => void
  /** Pre-fill the product name — used when creating directly from the purchase screen. */
  initialName?: string
}

export function CreateItemMasterModal({ onClose, onCreated, initialName }: Props) {
  const [form, setForm] = useState<FormState>(() =>
    initialName ? { ...initialForm, item_name: initialName } : initialForm,
  )
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [brands, setBrands] = useState<BrandMaster[]>([])
  const [units, setUnits] = useState<UnitMaster[]>([])
  const [categories, setCategories] = useState<CategoryMaster[]>([])
  const [subCategories, setSubCategories] = useState<SubCategoryMaster[]>([])
  const [packaging, setPackaging] = useState<PackagingMaster[]>([])

  useEffect(() => {
    let cancelled = false

    const loadOptions = async () => {
      try {
        const [brandRows, unitRows, categoryRows, subCategoryRows, packagingRows] = await Promise.all([
          fetchBrands(),
          fetchUnits(),
          fetchCategories(),
          fetchSubCategories(),
          fetchPackagingMasters(),
        ])
        if (cancelled) return
        setBrands(brandRows)
        setUnits(unitRows)
        setCategories(categoryRows)
        setSubCategories(subCategoryRows)
        setPackaging(packagingRows)
      } catch (e) {
        if (cancelled) return
        setErr(e instanceof Error ? e.message : 'Failed to load dropdown options')
      }
    }

    void loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedCategoryId = useMemo(() => {
    const selected = categories.find((category) => category.category_name === form.category_name)
    return selected?.id
  }, [categories, form.category_name])

  const filteredSubCategories = useMemo(() => {
    if (!selectedCategoryId) return subCategories
    return subCategories.filter((subCategory) => subCategory.category_id === selectedCategoryId)
  }, [selectedCategoryId, subCategories])

  const packingTypeOptions = useMemo(() => {
    const byType = new Map<string, { unit_primary: string; unit_secondary: string }>()
    for (const row of packaging) {
      const packingType = row.packing_type?.trim() ?? ''
      if (!packingType || byType.has(packingType)) continue
      byType.set(packingType, {
        unit_primary: row.unit_primary?.trim() ?? '',
        unit_secondary: row.unit_secondary?.trim() ?? '',
      })
    }

    return Array.from(byType.entries()).map(([packing_type, units]) => ({
      packing_type,
      ...units,
    }))
  }, [packaging])

  const patch =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (keepOpen: boolean) => {
    setErr(null)
    setSavedMsg(null)
    setSaving(true)
    try {
      const payload = buildPayload(form)
      const savedName = String(payload.item_name)
      const created = await createItemMaster(payload)
      setForm(initialForm)
      onCreated(created)
      if (keepOpen) {
        setSavedMsg(`“${savedName}” saved. Add another item below.`)
      } else {
        onClose()
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void save(false)
  }

  const inp = (k: keyof FormState, placeholder: string) => (
    <input
      id={`create-${k}`}
      className={styles.searchInput}
      value={String(form[k])}
      onChange={(e) => patch(k)(e.target.value as FormState[typeof k])}
      placeholder={placeholder}
      autoComplete="off"
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
      <div
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-item-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="create-item-title">Add Item</h2>
            <p>
              Only <strong>item name</strong> is required. Other fields are optional—placeholders
              show example values.
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
            {savedMsg ? (
              <div className={`${styles.banner} ${styles.bannerSuccess}`}>{savedMsg}</div>
            ) : null}

            <section>
              <h3 className={styles.sectionTitle}>Basics</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-item_code"
                    title="Item code"
                    apiKey="item_code"
                  />
                  {inp('item_code', 'e.g. ITM001')}
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldLabel
                    htmlFor="create-item_name"
                    title="Product name"
                    apiKey="item_name"
                    required
                  />
                  <input
                    id="create-item_name"
                    className={styles.searchInput}
                    value={form.item_name}
                    onChange={(e) => patch('item_name')(e.target.value)}
                    placeholder="e.g. Paracetamol 500mg"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Product details</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-generic_name" title="Generic name" apiKey="generic_name" />
                  {inp('generic_name', 'e.g. Paracetamol')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-brand_name" title="Brand name" apiKey="brand_name" />
                  <select
                    id="create-brand_name"
                    className={styles.searchInput}
                    value={form.brand_name}
                    onChange={(e) => patch('brand_name')(e.target.value)}
                  >
                    <option value="">Select brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.brand_name}>
                        {brand.brand_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldLabel htmlFor="create-composition" title="Composition" apiKey="composition" />
                  <textarea
                    id="create-composition"
                    value={form.composition}
                    onChange={(e) => patch('composition')(e.target.value)}
                    placeholder="e.g. Paracetamol 500mg"
                    rows={2}
                  />
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-strength" title="Strength" apiKey="strength" />
                  {inp('strength', 'e.g. 500mg')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-unit_name" title="Unit" apiKey="unit_name" />
                  <select
                    id="create-unit_name"
                    className={styles.searchInput}
                    value={form.unit_name}
                    onChange={(e) => patch('unit_name')(e.target.value)}
                  >
                    <option value="">Select unit</option>
                    {units.map((unit) => (
                      <option key={unit.unit_name} value={unit.unit_name}>
                        {unit.unit_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Category & vendors</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-category_name" title="Category" apiKey="category_name" />
                  <select
                    id="create-category_name"
                    className={styles.searchInput}
                    value={form.category_name}
                    onChange={(e) => {
                      const value = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        category_name: value,
                        sub_category_name: '',
                      }))
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.category_name}>
                        {category.category_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-sub_category_name"
                    title="Sub-category"
                    apiKey="sub_category_name"
                  />
                  <select
                    id="create-sub_category_name"
                    className={styles.searchInput}
                    value={form.sub_category_name}
                    onChange={(e) => patch('sub_category_name')(e.target.value)}
                    disabled={filteredSubCategories.length === 0}
                  >
                    <option value="">
                      {form.category_name ? 'Select sub-category' : 'Select category first'}
                    </option>
                    {filteredSubCategories.map((subCategory) => (
                      <option key={subCategory.id} value={subCategory.sub_category_name}>
                        {subCategory.sub_category_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Packing & units</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-packing_type" title="Packing type" apiKey="packing_type" />
                  <select
                    id="create-packing_type"
                    className={styles.searchInput}
                    value={form.packing_type}
                    onChange={(e) => {
                      const selectedPackingType = e.target.value
                      const selected = packingTypeOptions.find(
                        (option) => option.packing_type === selectedPackingType,
                      )
                      setForm((prev) => ({
                        ...prev,
                        packing_type: selectedPackingType,
                        unit_primary: selected?.unit_primary ?? '',
                        unit_secondary: selected?.unit_secondary ?? '',
                      }))
                    }}
                  >
                    <option value="">Select packing type</option>
                    {packingTypeOptions.map((option) => (
                      <option key={option.packing_type} value={option.packing_type}>
                        {option.packing_type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-pack_size" title="Pack size" apiKey="pack_size" />
                  {inp('pack_size', 'e.g. 10')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-unit_primary" title="Primary unit" apiKey="unit_primary" />
                  <input
                    id="create-unit_primary"
                    className={styles.searchInput}
                    value={form.unit_primary}
                    placeholder="Auto from packing type"
                    readOnly
                    disabled
                  />
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-unit_secondary"
                    title="Secondary unit"
                    apiKey="unit_secondary"
                  />
                  <input
                    id="create-unit_secondary"
                    className={styles.searchInput}
                    value={form.unit_secondary}
                    placeholder="Auto from packing type"
                    readOnly
                    disabled
                  />
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-conversion_factor"
                    title="Conversion factor"
                    apiKey="conversion_factor"
                  />
                  {inp('conversion_factor', 'e.g. 10')}
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Tax & pricing</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-gst_percent" title="GST (%)" apiKey="gst_percent" />
                  {inp('gst_percent', 'e.g. 12')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-cgst" title="CGST (%)" apiKey="cgst" />
                  {inp('cgst', 'e.g. 6')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-sgst" title="SGST (%)" apiKey="sgst" />
                  {inp('sgst', 'e.g. 6')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-igst" title="IGST (%)" apiKey="igst" />
                  {inp('igst', 'e.g. 12')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-cess_percent" title="Cess (%)" apiKey="cess_percent" />
                  {inp('cess_percent', 'e.g. 0')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-hsn_code" title="HSN code" apiKey="hsn_code" />
                  {inp('hsn_code', 'e.g. 30049099')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-tax_type" title="Tax type" apiKey="tax_type" />
                  {inp('tax_type', 'e.g. exclusive')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-min_discount" title="Min discount (%)" apiKey="min_discount" />
                  {inp('min_discount', 'e.g. 0')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-max_discount" title="Max discount (%)" apiKey="max_discount" />
                  {inp('max_discount', 'e.g. 10')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-pricing_type" title="Pricing type" apiKey="pricing_type" />
                  {inp('pricing_type', 'e.g. MRP')}
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Allow discount" apiKey="is_discount_allowed" />
                  <label className={styles.checkRow} htmlFor="create-is_discount_allowed">
                    <input
                      id="create-is_discount_allowed"
                      type="checkbox"
                      checked={form.is_discount_allowed}
                      onChange={(e) => patch('is_discount_allowed')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Stock & logistics</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-min_stock_level"
                    title="Minimum stock"
                    apiKey="min_stock_level"
                  />
                  {inp('min_stock_level', 'e.g. 10')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-max_stock_level"
                    title="Maximum stock"
                    apiKey="max_stock_level"
                  />
                  {inp('max_stock_level', 'e.g. 500')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-reorder_level" title="Reorder level" apiKey="reorder_level" />
                  {inp('reorder_level', 'e.g. 50')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-shelf_life_days"
                    title="Shelf life (days)"
                    apiKey="shelf_life_days"
                  />
                  {inp('shelf_life_days', 'e.g. 730')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-lead_time_days"
                    title="Lead time (days)"
                    apiKey="lead_time_days"
                  />
                  {inp('lead_time_days', 'e.g. 7')}
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Require batch number" apiKey="is_batch_required" />
                  <label className={styles.checkRow} htmlFor="create-is_batch_required">
                    <input
                      id="create-is_batch_required"
                      type="checkbox"
                      checked={form.is_batch_required}
                      onChange={(e) => patch('is_batch_required')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Require expiry date" apiKey="is_expiry_required" />
                  <label className={styles.checkRow} htmlFor="create-is_expiry_required">
                    <input
                      id="create-is_expiry_required"
                      type="checkbox"
                      checked={form.is_expiry_required}
                      onChange={(e) => patch('is_expiry_required')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Compliance</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-schedule_type" title="Schedule type" apiKey="schedule_type" />
                  {inp('schedule_type', 'e.g. OTC')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel
                    htmlFor="create-regulatory_category"
                    title="Regulatory category"
                    apiKey="regulatory_category"
                  />
                  {inp('regulatory_category', 'e.g. General')}
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Narcotic" apiKey="is_narcotic" />
                  <label className={styles.checkRow} htmlFor="create-is_narcotic">
                    <input
                      id="create-is_narcotic"
                      type="checkbox"
                      checked={form.is_narcotic}
                      onChange={(e) => patch('is_narcotic')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Psychotropic" apiKey="is_psychotropic" />
                  <label className={styles.checkRow} htmlFor="create-is_psychotropic">
                    <input
                      id="create-is_psychotropic"
                      type="checkbox"
                      checked={form.is_psychotropic}
                      onChange={(e) => patch('is_psychotropic')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Prescription required" apiKey="prescription_required" />
                  <label className={styles.checkRow} htmlFor="create-prescription_required">
                    <input
                      id="create-prescription_required"
                      type="checkbox"
                      checked={form.prescription_required}
                      onChange={(e) => patch('prescription_required')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Drug license required" apiKey="drug_license_required" />
                  <label className={styles.checkRow} htmlFor="create-drug_license_required">
                    <input
                      id="create-drug_license_required"
                      type="checkbox"
                      checked={form.drug_license_required}
                      onChange={(e) => patch('drug_license_required')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Barcode & status</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-barcode" title="Barcode" apiKey="barcode" />
                  {inp('barcode', 'e.g. 8901234567890')}
                </div>
                <div className={styles.formField}>
                  <FieldLabel htmlFor="create-sku_code" title="SKU code" apiKey="sku_code" />
                  {inp('sku_code', 'e.g. SKU-ITM001')}
                </div>
                <div className={`${styles.formField} ${styles.formFieldFull}`}>
                  <FieldHeader title="Active product" apiKey="is_active" />
                  <label className={styles.checkRow} htmlFor="create-is_active">
                    <input
                      id="create-is_active"
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => patch('is_active')(e.target.checked)}
                    />
                    <span>Yes</span>
                  </label>
                </div>
              </div>
            </section>
          </div>
          <div className={styles.modalFoot}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnGhost}
              onClick={() => void save(true)}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save & Add Another'}
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
