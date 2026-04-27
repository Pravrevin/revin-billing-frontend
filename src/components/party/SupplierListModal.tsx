import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchPartyMasters } from '../../services/partyMasterApi'
import type { PartyMaster } from '../../types/partyMaster'
import styles from '../../pages/ProductMasterPage.module.css'

function fmt(v: unknown): string {
  if (v == null || v === '') return '—'
  return String(v).trim() || '—'
}

function fmtAmt(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

// ── Detail panel ─────────────────────────────────────────────────────────────

function SupplierDetail({ supplier, onClose }: { supplier: PartyMaster; onClose: () => void }) {
  const s = supplier
  const isActive = typeof s.is_active === 'boolean' ? s.is_active : true

  const sections = [
    {
      title: 'Basic Info',
      fields: [
        { label: 'ID', value: fmt(s.id) },
        { label: 'Party Code', value: fmt(s.party_code) },
        { label: 'Party Name', value: fmt(s.party_name) },
        { label: 'Party Type', value: fmt(s.party_type) },
        { label: 'Status', value: isActive ? 'Active' : 'Inactive' },
      ],
    },
    {
      title: 'Contact',
      fields: [
        { label: 'Mobile', value: fmt(s.mobile) },
        { label: 'Email', value: fmt(s.email) },
        { label: 'Address', value: fmt(s.address) },
        { label: 'City', value: fmt(s.city) },
        { label: 'State', value: fmt(s.state) },
        { label: 'Pincode', value: fmt(s.pincode) },
      ],
    },
    {
      title: 'Regulatory',
      fields: [
        { label: 'GSTIN', value: fmt(s.gstin) },
        { label: 'Drug License No', value: fmt(s.drug_license_no) },
      ],
    },
    {
      title: 'Credit & Finance',
      fields: [
        { label: 'Credit Limit', value: fmtAmt(s.credit_limit) },
        { label: 'Credit Days', value: fmt(s.credit_days) },
        { label: 'Opening Balance', value: fmtAmt(s.opening_balance) },
      ],
    },
  ]

  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        background: '#fff',
        overflowY: 'auto',
      }}
    >
      {/* Detail header */}
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
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--medical-deep)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fmt(s.party_name)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
            ID {s.id}{s.party_code ? ` · ${String(s.party_code)}` : ''}
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

      {/* Status badge */}
      <div style={{ padding: '0.75rem 1rem 0' }}>
        <span
          className={`${styles.badge} ${isActive ? styles.badgeOtc : styles.badgeOff}`}
          style={{ fontSize: '0.72rem' }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {/* Sections */}
      <div style={{ padding: '0.75rem 1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sections.map((sec) => (
          <div
            key={sec.title}
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
                textTransform: 'uppercase' as const,
                letterSpacing: '0.07em',
                color: 'var(--medical-deep)',
              }}
            >
              {sec.title}
            </div>
            <div style={{ padding: '0.6rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {sec.fields.map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
                  <span
                    style={{
                      color: value === '—' ? 'var(--text-muted)' : 'var(--text-strong)',
                      fontWeight: value === '—' ? 400 : 600,
                      textAlign: 'right',
                      wordBreak: 'break-all',
                    }}
                  >
                    {value}
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

// ── Main modal ───────────────────────────────────────────────────────────────

type Props = { onClose: () => void }

export function SupplierListModal({ onClose }: Props) {
  const [rows, setRows]           = useState<PartyMaster[]>([])
  const [loading, setLoading]     = useState(true)
  const [err, setErr]             = useState<string | null>(null)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<PartyMaster | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = await fetchPartyMasters('Distributor')
      setRows(data)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load suppliers')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (selected) { setSelected(null); return }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, selected])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      Object.values(r).some((v) => v != null && String(v).toLowerCase().includes(q)),
    )
  }, [rows, search])

  if (loading) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className={styles.loading}>Loading suppliers…</div>
      </div>
    )
  }

  if (err) {
    return (
      <div className={styles.overlayFullscreen} style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className={`${styles.banner} ${styles.bannerError}`} style={{ maxWidth: 480 }}>
          {err}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>Retry</button>
        </div>
        <button type="button" className={styles.btnGhost} onClick={onClose}>Close</button>
      </div>
    )
  }

  return (
    <div className={styles.overlayFullscreen}>
      {/* ── Top header bar ── */}
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>
          ← Back
        </button>
        <div className={styles.fsHeaderTitle}>
          <h2>Supplier List</h2>
          <p>{filtered.length} of {rows.length} suppliers · click a name to view details</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      {/* ── Search bar ── */}
      <div className={styles.fsFilters}>
        <div className={styles.fsFilterRow}>
          <div className={`${styles.fsFilterField} ${styles.fsFilterGrow}`}>
            <label htmlFor="sl-search">Search</label>
            <input
              id="sl-search"
              type="text"
              placeholder="Name, mobile, city, GSTIN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        </div>
        <div className={styles.fsFilterMeta}>
          <span className={styles.chip}>
            Showing <strong>{filtered.length}</strong> of <strong>{rows.length}</strong> suppliers
          </span>
          {search && (
            <button type="button" className={styles.resetLink} onClick={() => setSearch('')}>Reset</button>
          )}
        </div>
      </div>

      {/* ── Split body: table + detail panel ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Table pane */}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '1rem 1.25rem' }}>
          <div className={styles.fsTableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.fsTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>GSTIN</th>
                    <th style={{ width: 90 }}>Credit Days</th>
                    <th style={{ width: 90 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={7}>No suppliers found.</td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const isActive = typeof r.is_active === 'boolean' ? r.is_active : true
                      const isSelected = selected?.id === r.id
                      return (
                        <tr
                          key={r.id}
                          className={styles.fsInvoiceRow}
                          onClick={() => setSelected(isSelected ? null : r)}
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
                              {fmt(r.party_name)}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(r.mobile)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(r.email)}</td>
                          <td style={{ fontSize: '0.85rem' }}>{fmt(r.city)}</td>
                          <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>{fmt(r.gstin)}</td>
                          <td className={styles.amtCell} style={{ fontSize: '0.85rem' }}>{fmt(r.credit_days)}</td>
                          <td>
                            <span className={`${styles.badge} ${isActive ? styles.badgeOtc : styles.badgeOff}`}>
                              {isActive ? 'Active' : 'Inactive'}
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

        {/* Detail panel — slides in when a supplier is selected */}
        {selected && (
          <SupplierDetail supplier={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  )
}
