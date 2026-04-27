import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CreateItemMasterModal } from '../components/itemMaster/CreateItemMasterModal'
import { ItemMasterEditModal } from '../components/itemMaster/ItemMasterEditModal'
import { getBearerToken } from '../lib/apiConfig'
import { fetchItemMasters } from '../services/itemMasterApi'
import type { ItemMaster } from '../types/itemMaster'
import styles from './ProductMasterPage.module.css'

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [locked])
}

function uniqSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

type Tri = 'all' | 'yes' | 'no'

function triBool(v: boolean, f: Tri): boolean {
  if (f === 'all') return true
  if (f === 'yes') return v === true
  return v === false
}

function scheduleBadgeClass(schedule: string): string {
  const s = schedule?.toUpperCase() || ''
  if (s === 'H' || s.includes('H1')) return styles.badgeH
  if (s === 'OTC') return styles.badgeOtc
  return styles.badgeRx
}

function DetailModal({
  item,
  onClose,
  onEdit,
}: {
  item: ItemMaster
  onClose: () => void
  onEdit: () => void
}) {
  const kv = (label: string, value: ReactNode) => (
    <div className={styles.kv}>
      <span>{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  )

  const boolStr = (v: boolean) => (v ? 'Yes' : 'No')

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
        aria-labelledby="detail-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="detail-title">{item.item_name}</h2>
            <p>
              {item.item_code} · SKU {item.sku_code ?? '—'} · HSN {item.hsn_code}
            </p>
          </div>
          <div className={styles.headActions}>
            <button type="button" className={styles.btnPrimarySm} onClick={onEdit}>
              Edit
            </button>
            <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailSections}>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Identity</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Generic name', item.generic_name)}
                  {kv('Brand', item.brand_name)}
                  {kv('Strength', item.strength)}
                  {kv('Dosage form', item.dosage_form)}
                  {kv('Composition', item.composition)}
                  {kv('Barcode', item.barcode)}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Packing & units</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Packing type', item.packing_type)}
                  {kv('Pack size', item.pack_size)}
                  {kv('Primary unit', item.unit_primary)}
                  {kv('Secondary unit', item.unit_secondary)}
                  {kv('Conversion factor', item.conversion_factor)}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Tax</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('GST %', item.gst_percent)}
                  {kv('CGST / SGST / IGST', `${item.cgst} / ${item.sgst} / ${item.igst}`)}
                  {kv('Cess %', item.cess_percent)}
                  {kv('Tax type', item.tax_type)}
                  {kv('Pricing type', item.pricing_type)}
                  {kv('Discount range', `${item.min_discount}% – ${item.max_discount}%`)}
                  {kv('Discount allowed', boolStr(item.is_discount_allowed))}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Stock parameters</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Min / Max / Reorder', `${item.min_stock_level} / ${item.max_stock_level} / ${item.reorder_level}`)}
                  {kv('Shelf life (days)', item.shelf_life_days)}
                  {kv('Lead time (days)', item.lead_time_days)}
                  {kv('Batch required', boolStr(item.is_batch_required))}
                  {kv('Expiry required', boolStr(item.is_expiry_required))}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Regulatory</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Schedule', item.schedule_type)}
                  {kv('Regulatory category', item.regulatory_category)}
                  {kv('Prescription', boolStr(item.prescription_required))}
                  {kv('Drug license', boolStr(item.drug_license_required))}
                  {kv('Narcotic', boolStr(item.is_narcotic))}
                  {kv('Psychotropic', boolStr(item.is_psychotropic))}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>References</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Category ID', item.category_id)}
                  {kv('Sub-category ID', item.sub_category_id)}
                  {kv('Marketer ID', item.marketer_id)}
                  {kv('External code', item.external_code)}
                  {kv('QR code', item.qr_code)}
                </div>
              </div>
            </section>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>System</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {kv('Active', boolStr(item.is_active))}
                  {kv('Created', new Date(item.created_at).toLocaleString())}
                  {kv('Updated', new Date(item.updated_at).toLocaleString())}
                </div>
              </div>
            </section>
          </div>
        </div>
        <div className={styles.modalFoot}>
          <button type="button" className={styles.btnGhost} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProductMasterPage() {
  const [items, setItems] = useState<ItemMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dosageForm, setDosageForm] = useState('')
  const [schedule, setSchedule] = useState('')
  const [regulatory, setRegulatory] = useState('')
  const [packing, setPacking] = useState('')
  const [rxFilter, setRxFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [genericContains, setGenericContains] = useState('')
  const [hsnCode, setHsnCode] = useState('')
  const [gstPercent, setGstPercent] = useState('')
  const [taxType, setTaxType] = useState('')
  const [pricingType, setPricingType] = useState('')
  const [unitPrimary, setUnitPrimary] = useState('')
  const [discountAllowed, setDiscountAllowed] = useState<Tri>('all')
  const [drugLicenseFilter, setDrugLicenseFilter] = useState<Tri>('all')
  const [narcoticFilter, setNarcoticFilter] = useState<Tri>('all')
  const [psychotropicFilter, setPsychotropicFilter] = useState<Tri>('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<ItemMaster | null>(null)
  const [edit, setEdit] = useState<ItemMaster | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [createOpen, setCreateOpen] = useState(false)

  useBodyScrollLock(Boolean(detail || edit || createOpen))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchItemMasters()
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load items')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [
    search,
    dosageForm,
    schedule,
    regulatory,
    packing,
    rxFilter,
    activeFilter,
    genericContains,
    hsnCode,
    gstPercent,
    taxType,
    pricingType,
    unitPrimary,
    discountAllowed,
    drugLicenseFilter,
    narcoticFilter,
    psychotropicFilter,
    pageSize,
  ])

  const dosageForms = useMemo(
    () => uniqSorted(items.map((i) => i.dosage_form)),
    [items],
  )
  const schedules = useMemo(
    () => uniqSorted(items.map((i) => i.schedule_type)),
    [items],
  )
  const regulatoryOpts = useMemo(
    () => uniqSorted(items.map((i) => i.regulatory_category)),
    [items],
  )
  const packingTypes = useMemo(
    () => uniqSorted(items.map((i) => i.packing_type)),
    [items],
  )
  const hsnCodes = useMemo(() => uniqSorted(items.map((i) => i.hsn_code)), [items])
  const gstPercents = useMemo(() => uniqSorted(items.map((i) => i.gst_percent)), [items])
  const taxTypes = useMemo(() => uniqSorted(items.map((i) => i.tax_type)), [items])
  const pricingTypes = useMemo(() => uniqSorted(items.map((i) => i.pricing_type)), [items])
  const unitPrimaries = useMemo(() => uniqSorted(items.map((i) => i.unit_primary)), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const genQ = genericContains.trim().toLowerCase()

    return items.filter((i) => {
      if (dosageForm && i.dosage_form !== dosageForm) return false
      if (schedule && i.schedule_type !== schedule) return false
      if (regulatory && i.regulatory_category !== regulatory) return false
      if (packing && i.packing_type !== packing) return false
      if (rxFilter === 'yes' && !i.prescription_required) return false
      if (rxFilter === 'no' && i.prescription_required) return false
      if (activeFilter === 'active' && !i.is_active) return false
      if (activeFilter === 'inactive' && i.is_active) return false

      if (genQ && !i.generic_name.toLowerCase().includes(genQ)) return false
      if (hsnCode && i.hsn_code !== hsnCode) return false
      if (gstPercent && i.gst_percent !== gstPercent) return false
      if (taxType && i.tax_type !== taxType) return false
      if (pricingType && i.pricing_type !== pricingType) return false
      if (unitPrimary && i.unit_primary !== unitPrimary) return false

      if (!triBool(i.is_discount_allowed, discountAllowed)) return false
      if (!triBool(i.drug_license_required, drugLicenseFilter)) return false
      if (!triBool(i.is_narcotic, narcoticFilter)) return false
      if (!triBool(i.is_psychotropic, psychotropicFilter)) return false

      if (!q) return true
      const hay = [
        i.item_name,
        i.item_code,
        i.sku_code,
        i.generic_name,
        i.brand_name,
        i.barcode,
        i.hsn_code,
        i.composition,
        i.strength,
        i.external_code,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [
    items,
    search,
    dosageForm,
    schedule,
    regulatory,
    packing,
    rxFilter,
    activeFilter,
    genericContains,
    hsnCode,
    gstPercent,
    taxType,
    pricingType,
    unitPrimary,
    discountAllowed,
    drugLicenseFilter,
    narcoticFilter,
    psychotropicFilter,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 4200)
  }

  const resetFilters = () => {
    setSearch('')
    setDosageForm('')
    setSchedule('')
    setRegulatory('')
    setPacking('')
    setRxFilter('all')
    setActiveFilter('all')
    setGenericContains('')
    setHsnCode('')
    setGstPercent('')
    setTaxType('')
    setPricingType('')
    setUnitPrimary('')
    setDiscountAllowed('all')
    setDrugLicenseFilter('all')
    setNarcoticFilter('all')
    setPsychotropicFilter('all')
  }

  const mergeItem = (next: ItemMaster) => {
    setItems((prev) => prev.map((x) => (x.id === next.id ? next : x)))
  }

  const hasToken = Boolean(getBearerToken())

  return (
    <div className={styles.page}>
      {!hasToken ? (
        <div className={`${styles.banner} ${styles.bannerHint}`}>
          Add <code>VITE_API_BEARER_TOKEN</code> to <code>.env.local</code> (see{' '}
          <code>.env.example</code>). In dev, API calls use the Vite proxy at <code>/api</code> →{' '}
          <code>localhost:8000</code>.
        </div>
      ) : null}

      {error ? (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {error}{' '}
          <button type="button" className={styles.resetLink} onClick={load}>
            Retry
          </button>
        </div>
      ) : null}

      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>Product Master</h1>
          <p>
            Browse and maintain your product catalog. Use the filters to narrow by form, schedule,
            generic name, tax, units, and compliance flags — then open a row to view or edit.
          </p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnPrimary} onClick={() => setCreateOpen(true)}>
            + Create product
          </button>
          <button
            type="button"
            className={styles.btnMuted}
            onClick={() => fileRef.current?.click()}
          >
            Bulk import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className={styles.hiddenFile}
            tabIndex={-1}
            onChange={() => {
              showToast('Bulk import: connect your upload endpoint to process this file.')
              if (fileRef.current) fileRef.current.value = ''
            }}
          />
        </div>
      </div>

      <div className={`${styles.filterCard} ${styles.pmFilterCard}`}>
        <div className={styles.filterGrid}>
          <div className={`${styles.field} ${styles.pmSearchField}`}>
            <label htmlFor="pm-search" className={styles.pmSearchLabel}>
              Search catalog
            </label>
            <input
              id="pm-search"
              className={`${styles.searchInput} ${styles.pmSearchInput}`}
              placeholder="Name, code, SKU, generic, brand, HSN, barcode…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-dosage">Dosage form</label>
            <select
              id="pm-dosage"
              className={styles.select}
              value={dosageForm}
              onChange={(e) => setDosageForm(e.target.value)}
            >
              <option value="">All forms</option>
              {dosageForms.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-schedule-f">Schedule</label>
            <select
              id="pm-schedule-f"
              className={styles.select}
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
            >
              <option value="">All schedules</option>
              {schedules.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-reg-f">Regulatory</label>
            <select
              id="pm-reg-f"
              className={styles.select}
              value={regulatory}
              onChange={(e) => setRegulatory(e.target.value)}
            >
              <option value="">All categories</option>
              {regulatoryOpts.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-pack">Packing</label>
            <select
              id="pm-pack"
              className={styles.select}
              value={packing}
              onChange={(e) => setPacking(e.target.value)}
            >
              <option value="">All packing</option>
              {packingTypes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-rx">Prescription</label>
            <select
              id="pm-rx"
              className={styles.select}
              value={rxFilter}
              onChange={(e) => setRxFilter(e.target.value as typeof rxFilter)}
            >
              <option value="all">All</option>
              <option value="yes">Rx required</option>
              <option value="no">OTC / no Rx</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-active">Status</label>
            <select
              id="pm-active"
              className={styles.select}
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-gen-f">Generic contains</label>
            <input
              id="pm-gen-f"
              className={styles.searchInput}
              placeholder="Generic name"
              value={genericContains}
              onChange={(e) => setGenericContains(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-hsn-f">HSN code</label>
            <select
              id="pm-hsn-f"
              className={styles.select}
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
            >
              <option value="">All HSN</option>
              {hsnCodes.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-gst-f">GST %</label>
            <select
              id="pm-gst-f"
              className={styles.select}
              value={gstPercent}
              onChange={(e) => setGstPercent(e.target.value)}
            >
              <option value="">All rates</option>
              {gstPercents.map((g) => (
                <option key={g} value={g}>
                  {g}%
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-tax-f">Tax type</label>
            <select
              id="pm-tax-f"
              className={styles.select}
              value={taxType}
              onChange={(e) => setTaxType(e.target.value)}
            >
              <option value="">All</option>
              {taxTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-price-f">Pricing type</label>
            <select
              id="pm-price-f"
              className={styles.select}
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value)}
            >
              <option value="">All</option>
              {pricingTypes.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-unit-f">Primary unit</label>
            <select
              id="pm-unit-f"
              className={styles.select}
              value={unitPrimary}
              onChange={(e) => setUnitPrimary(e.target.value)}
            >
              <option value="">All units</option>
              {unitPrimaries.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-disc-f">Discount allowed</label>
            <select
              id="pm-disc-f"
              className={styles.select}
              value={discountAllowed}
              onChange={(e) => setDiscountAllowed(e.target.value as Tri)}
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-dl-f">Drug license</label>
            <select
              id="pm-dl-f"
              className={styles.select}
              value={drugLicenseFilter}
              onChange={(e) => setDrugLicenseFilter(e.target.value as Tri)}
            >
              <option value="all">All</option>
              <option value="yes">Required</option>
              <option value="no">Not required</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-nar-f">Narcotic</label>
            <select
              id="pm-nar-f"
              className={styles.select}
              value={narcoticFilter}
              onChange={(e) => setNarcoticFilter(e.target.value as Tri)}
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="pm-psy-f">Psychotropic</label>
            <select
              id="pm-psy-f"
              className={styles.select}
              value={psychotropicFilter}
              onChange={(e) => setPsychotropicFilter(e.target.value as Tri)}
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
        <div className={styles.filterMeta}>
          <span className={styles.chip}>
            Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> filtered
            ({items.length} loaded)
          </span>
          <button type="button" className={styles.resetLink} onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      <div className={`${styles.tableWrap} ${styles.pmTableWrap}`}>
        {loading ? (
          <div className={styles.loading}>Loading item master…</div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${styles.pmTable}`}>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Product</th>
                    <th>Form / strength</th>
                    <th>Schedule</th>
                    <th>HSN</th>
                    <th>Pack</th>
                    <th>Rx</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {!pageItems.length ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No products match these filters. Try clearing search or reset filters.
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.item_code}</strong>
                        <div className={styles.nameSub}>{row.sku_code}</div>
                      </td>
                      <td className={styles.nameCell}>
                        <div className={styles.nameMain}>{row.item_name}</div>
                        <div className={styles.nameSub}>
                          {row.brand_name} · {row.generic_name}
                        </div>
                      </td>
                      <td>
                        {row.dosage_form}
                        <div className={styles.nameSub}>{row.strength}</div>
                      </td>
                      <td>
                        <span className={`${styles.badge} ${scheduleBadgeClass(row.schedule_type)}`}>
                          {row.schedule_type}
                        </span>
                      </td>
                      <td>{row.hsn_code}</td>
                      <td>
                        {row.packing_type}
                        <div className={styles.nameSub}>
                          {row.pack_size} {row.unit_secondary}
                        </div>
                      </td>
                      <td>{row.prescription_required ? 'Yes' : 'No'}</td>
                      <td>
                        {row.is_active ? (
                          <span className={`${styles.badge} ${styles.badgeOtc}`}>Active</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeOff}`}>Off</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => setDetail(row)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className={`${styles.linkBtn} ${styles.linkBtnWarn}`}
                            onClick={() => setEdit(row)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <div className={styles.field} style={{ maxWidth: 120 }}>
                <label htmlFor="pm-pagesize">Rows / page</label>
                <select
                  id="pm-pagesize"
                  className={styles.pageSize}
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className={styles.pageBtns}>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <span style={{ padding: '0 0.5rem', fontSize: '0.88rem', fontWeight: 600 }}>
                  Page {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {detail ? (
        <DetailModal
          item={detail}
          onClose={() => setDetail(null)}
          onEdit={() => {
            setEdit(detail)
            setDetail(null)
          }}
        />
      ) : null}
      {edit ? (
        <ItemMasterEditModal
          key={edit.id}
          item={edit}
          dosageForms={dosageForms}
          schedules={schedules.length ? schedules : [edit.schedule_type]}
          regulatoryOpts={regulatoryOpts.length ? regulatoryOpts : [edit.regulatory_category]}
          packingTypes={packingTypes.length ? packingTypes : [edit.packing_type]}
          onClose={() => setEdit(null)}
          onSaved={(next) => {
            mergeItem(next)
            showToast('Product updated successfully.')
          }}
        />
      ) : null}

      {createOpen ? (
        <CreateItemMasterModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            showToast('Product created successfully.')
            void load()
          }}
        />
      ) : null}

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  )
}
