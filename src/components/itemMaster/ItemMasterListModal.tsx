import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchItemMasters } from '../../services/itemMasterApi'
import type { ItemMaster } from '../../types/itemMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type Props = { onClose: () => void }

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value).trim() || '—'
}

function boolLabel(value: unknown): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return '—'
}

function getAny(item: ItemMaster, key: string): unknown {
  return (item as unknown as Record<string, unknown>)[key]
}

function ItemDetail({ item, onClose }: { item: ItemMaster; onClose: () => void }) {
  const isActive = item.is_active === true

  const sections: { title: string; fields: { label: string; value: string }[] }[] = [
    {
      title: 'Basic Info',
      fields: [
        { label: 'ID', value: fmt(item.id) },
        { label: 'Item Code', value: fmt(item.item_code) },
        { label: 'Item Name', value: fmt(item.item_name) },
        { label: 'Generic Name', value: fmt(item.generic_name) },
        { label: 'Brand Name', value: fmt(item.brand_name) },
        { label: 'Composition', value: fmt(item.composition) },
        { label: 'Strength', value: fmt(item.strength) },
        { label: 'Dosage Form', value: fmt(item.dosage_form) },
        { label: 'Category', value: fmt(getAny(item, 'category_name')) },
        { label: 'Sub Category', value: fmt(getAny(item, 'sub_category_name')) },
        { label: 'Status', value: isActive ? 'Active' : 'Inactive' },
      ],
    },
    {
      title: 'Packing & Units',
      fields: [
        { label: 'Packing Type', value: fmt(item.packing_type) },
        { label: 'Pack Size', value: fmt(item.pack_size) },
        { label: 'Conversion Factor', value: fmt(item.conversion_factor) },
        { label: 'Unit Primary', value: fmt(item.unit_primary) },
        { label: 'Unit Secondary', value: fmt(item.unit_secondary) },
      ],
    },
    {
      title: 'Tax & Pricing',
      fields: [
        { label: 'GST %', value: fmt(item.gst_percent) },
        { label: 'CGST %', value: fmt(item.cgst) },
        { label: 'SGST %', value: fmt(item.sgst) },
        { label: 'IGST %', value: fmt(item.igst) },
        { label: 'Cess %', value: fmt(item.cess_percent) },
        { label: 'HSN Code', value: fmt(item.hsn_code) },
        { label: 'Tax Type', value: fmt(item.tax_type) },
        { label: 'Min Discount', value: fmt(item.min_discount) },
        { label: 'Max Discount', value: fmt(item.max_discount) },
        { label: 'Discount Allowed', value: boolLabel(item.is_discount_allowed) },
        { label: 'Pricing Type', value: fmt(item.pricing_type) },
      ],
    },
    {
      title: 'Stock & Shelf',
      fields: [
        { label: 'Min Stock Level', value: fmt(item.min_stock_level) },
        { label: 'Max Stock Level', value: fmt(item.max_stock_level) },
        { label: 'Reorder Level', value: fmt(item.reorder_level) },
        { label: 'Batch Required', value: boolLabel(item.is_batch_required) },
        { label: 'Expiry Required', value: boolLabel(item.is_expiry_required) },
        { label: 'Shelf Life (Days)', value: fmt(item.shelf_life_days) },
        { label: 'Lead Time (Days)', value: fmt(item.lead_time_days) },
      ],
    },
    {
      title: 'Regulatory',
      fields: [
        { label: 'Schedule Type', value: fmt(item.schedule_type) },
        { label: 'Narcotic', value: boolLabel(item.is_narcotic) },
        { label: 'Psychotropic', value: boolLabel(item.is_psychotropic) },
        { label: 'Prescription Required', value: boolLabel(item.prescription_required) },
        { label: 'Drug License Required', value: boolLabel(item.drug_license_required) },
        { label: 'Regulatory Category', value: fmt(item.regulatory_category) },
      ],
    },
    {
      title: 'Codes & System',
      fields: [
        { label: 'Barcode', value: fmt(item.barcode) },
        { label: 'QR Code', value: fmt(item.qr_code) },
        { label: 'SKU Code', value: fmt(item.sku_code) },
        { label: 'External Code', value: fmt(item.external_code) },
        { label: 'Extra Data', value: fmt(item.extra_data) },
        { label: 'Created At', value: fmt(item.created_at) },
        { label: 'Updated At', value: fmt(item.updated_at) },
      ],
    },
  ]

  return (
    <div
      style={{
        width: 360,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        background: '#fff',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border)',
          background: '#f8fafc',
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: 'var(--medical-deep)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fmt(item.item_name)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            ID {item.id} · {fmt(item.item_code)}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close detail"
          style={{
            background: '#f1f5f9',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            width: '2rem',
            height: '2rem',
            cursor: 'pointer',
            fontSize: '1rem',
            color: 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '0.75rem 1rem 0' }}>
        <span
          className={`${styles.badge} ${isActive ? styles.badgeOtc : styles.badgeOff}`}
          style={{ fontSize: '0.72rem' }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div style={{ padding: '0.75rem 1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--medical-teal)',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.85rem',
                background: '#f1f5f9',
                borderBottom: '1px solid var(--border)',
                fontWeight: 700,
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--medical-deep)',
              }}
            >
              {section.title}
            </div>
            <div style={{ padding: '0.6rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {section.fields.map((field) => (
                <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{field.label}</span>
                  <span
                    style={{
                      color: field.value === '—' ? 'var(--text-muted)' : 'var(--text-strong)',
                      fontWeight: field.value === '—' ? 400 : 600,
                      textAlign: 'right',
                      wordBreak: 'break-all',
                    }}
                  >
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ItemMasterListModal({ onClose }: Props) {
  const [rows, setRows] = useState<ItemMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ItemMaster | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchItemMasters()
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selected) {
          setSelected(null)
          return
        }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const hay = [
        row.item_name,
        row.item_code,
        row.generic_name,
        row.brand_name,
        row.packing_type,
        row.hsn_code,
        row.sku_code,
        row.barcode,
      ]
        .filter((v) => v != null && String(v).trim() !== '')
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [rows, search])

  if (loading) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loading}>Loading items…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div
        className={styles.overlayFullscreen}
        style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}
      >
        <div className={`${styles.banner} ${styles.bannerError}`} style={{ maxWidth: 480 }}>
          {err}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>
            Retry
          </button>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>
          ← Back
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2>Item List</h2>
          <p>{filtered.length} of {rows.length} items · click item name to view details</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="item-list-search">Search</label>
            <input
              id="item-list-search"
              type="text"
              placeholder="Name, code, generic, brand, HSN, packing…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> items
          </span>
          {search ? (
            <button type="button" className={styles.resetLink} onClick={() => setSearch('')}>
              Reset
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <div className={styles.fsTableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.fsTable}>
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Generic Name</th>
                    <th>Brand Name</th>
                    <th>Packing Type</th>
                    <th>Strength</th>
                    <th>Dosage Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={7}>No items found.</td>
                    </tr>
                  ) : (
                    filtered.map((row) => {
                      const isSelected = selected?.id === row.id
                      return (
                        <tr
                          key={row.id}
                          className={styles.fsInvoiceRow}
                          onClick={() => setSelected(isSelected ? null : row)}
                          style={isSelected ? { background: '#ecfdf5' } : undefined}
                        >
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: isSelected ? 'var(--medical-deep)' : 'var(--medical-mid)',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                              }}
                            >
                              {fmt(row.item_name)}
                            </span>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {fmt(row.item_code)}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.generic_name)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.brand_name)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.packing_type)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.strength)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(row.dosage_form)}</td>
                          <td>
                            <span className={`${styles.badge} ${row.is_active ? styles.badgeOtc : styles.badgeOff}`}>
                              {row.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {selected ? <ItemDetail item={selected} onClose={() => setSelected(null)} /> : null}
      </div>
    </div>
  )
}
