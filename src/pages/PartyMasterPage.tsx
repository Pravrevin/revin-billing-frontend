import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DistributorBillsModal } from '../components/party/DistributorBillsModal'
import { getBearerToken } from '../lib/apiConfig'
import { fetchPartyMasters, type PartyTypeParam } from '../services/partyMasterApi'
import type { PartyMaster } from '../types/partyMaster'
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

function strVal(p: PartyMaster, ...keys: string[]): string {
  for (const k of keys) {
    const v = p[k]
    if (v == null) continue
    if (typeof v === 'object') continue
    const s = String(v).trim()
    if (s) return s
  }
  return ''
}

/** First matching property name on `p` (any casing), or null. */
function rowKeyMatch(p: PartyMaster, logical: string): string | null {
  const t = logical.toLowerCase()
  for (const k of Object.keys(p)) {
    if (k.toLowerCase() === t) return k
  }
  return null
}

/** Like `strVal` but matches each logical key case-insensitively (API may send `Phone` vs `phone`). */
function strValCI(p: PartyMaster, ...logicalKeys: string[]): string {
  for (const logical of logicalKeys) {
    const ak = rowKeyMatch(p, logical)
    if (!ak) continue
    const v = p[ak]
    if (v == null || typeof v === 'object') continue
    const s = String(v).trim()
    if (s) return s
  }
  return ''
}

function cellByHeaderKey(p: PartyMaster, headerKey: string): string {
  const ak = rowKeyMatch(p, headerKey)
  if (!ak) return ''
  const v = p[ak]
  if (v == null || typeof v === 'object') return ''
  return String(v).trim()
}

function displayName(p: PartyMaster): string {
  return (
    strVal(p, 'party_name', 'name', 'customer_name', 'distributor_name', 'legal_name', 'display_name') ||
    `Party #${p.id}`
  )
}

function displayCode(p: PartyMaster): string {
  return strVal(p, 'party_code', 'code', 'customer_code', 'distributor_code', 'external_code')
}

/** Keys used for mobile display + mobile text filter (not landline). */
const MOBILE_KEY_LIST = [
  'mobile',
  'mobile_no',
  'mobile_number',
  'cellphone',
  'cell_phone',
  'cell',
  'whatsapp',
  'contact_phone',
  'primary_phone',
] as const

/** Landline / office-only keys — Phone column when data actually has these. */
const LANDLINE_KEY_LIST = ['phone', 'landline', 'telephone', 'office_phone'] as const

const DISTRIBUTOR_PHONE_KEYS = [
  ...LANDLINE_KEY_LIST,
  ...MOBILE_KEY_LIST,
] as const

function displayMobile(p: PartyMaster): string {
  return strValCI(p, ...(MOBILE_KEY_LIST as unknown as string[]))
}

/** Landline / office — excludes mobile-style keys so they stay in the Mobile column. */
function displayPhoneLandline(p: PartyMaster): string {
  return strValCI(p, ...(LANDLINE_KEY_LIST as unknown as string[]))
}

function datasetHasColumnCI(rows: PartyMaster[], logicalKey: string): boolean {
  return rows.some((p) => {
    const ak = rowKeyMatch(p, logicalKey)
    if (!ak) return false
    const v = p[ak]
    if (v == null || typeof v === 'object') return false
    return String(v).trim() !== ''
  })
}

/** First non-empty value’s actual property name as returned by the API (preserves casing). */
function pickFirstDisplayKey(rows: PartyMaster[], logical: string): string | null {
  for (const p of rows) {
    const ak = rowKeyMatch(p, logical)
    if (!ak) continue
    const v = p[ak]
    if (v == null || typeof v === 'object') continue
    if (String(v).trim() !== '') return ak
  }
  return null
}

/**
 * Distributor: one column per contact/phone field present in the payload.
 * Headers use the exact key string from the API (first row that has data).
 */
function distributorTableContactKeys(rows: PartyMaster[]): string[] {
  const out: string[] = []
  const seenLower = new Set<string>()

  for (const logical of DISTRIBUTOR_PHONE_KEYS) {
    const display = pickFirstDisplayKey(rows, logical)
    if (!display) continue
    const low = display.toLowerCase()
    if (seenLower.has(low)) continue
    seenLower.add(low)
    out.push(display)
  }

  const extraLower = new Set<string>()
  for (const p of rows) {
    for (const k of Object.keys(p)) {
      const low = k.toLowerCase()
      if (seenLower.has(low)) continue
      const kn = keyNorm(k)
      if (!/phone|mobile|tel|whatsapp|cell/.test(kn)) continue
      const v = p[k]
      if (v == null || typeof v === 'object') continue
      if (String(v).trim() === '') continue
      extraLower.add(low)
    }
  }
  const sortedExtras = [...extraLower].sort((a, b) => a.localeCompare(b))
  for (const low of sortedExtras) {
    for (const p of rows) {
      const found = Object.keys(p).find((kk) => kk.toLowerCase() === low)
      if (found) {
        out.push(found)
        seenLower.add(low)
        break
      }
    }
  }

  return out
}

function mobileFilterHaystack(p: PartyMaster): string {
  return MOBILE_KEY_LIST.map((logical) => {
    const ak = rowKeyMatch(p, logical)
    if (!ak) return ''
    const v = p[ak]
    if (v == null || typeof v === 'object') return ''
    return String(v).trim()
  })
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function isPartyActive(p: PartyMaster): boolean {
  if (typeof p.is_active === 'boolean') return p.is_active
  if (typeof p.active === 'boolean') return p.active
  if (typeof p.status === 'string') {
    const s = p.status.toLowerCase()
    if (s === 'inactive' || s === 'disabled') return false
  }
  return true
}

function humanizeKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function searchHaystack(p: PartyMaster): string {
  const parts: string[] = []
  for (const v of Object.values(p)) {
    if (v == null) continue
    if (typeof v === 'object') {
      try {
        parts.push(JSON.stringify(v))
      } catch {
        /* skip */
      }
      continue
    }
    parts.push(String(v))
  }
  return parts.join(' ').toLowerCase()
}

type Tri = 'all' | 'yes' | 'no'

function triBool(v: boolean, f: Tri): boolean {
  if (f === 'all') return true
  if (f === 'yes') return v === true
  return v === false
}

type FacetDef = { key: string; label: string; options: string[] }

function keyNorm(k: string): string {
  return k.toLowerCase().replace(/_/g, '')
}

/** Never build facet dropdowns for mobile-style fields — mobile is a free-text filter instead. */
const MOBILE_NEVER_FACET_NORM = new Set(
  [...MOBILE_KEY_LIST, 'phonemobile', 'alternatemobile', 'altmobile', 'secondarymobile'].map((k) =>
    keyNorm(k),
  ),
)

function buildFacetOptions(
  rows: PartyMaster[],
  excludeKeysLower: Set<string>,
  excludeKeysNorm: Set<string>,
  maxUnique = 28,
  maxFacets = 8,
): FacetDef[] {
  const keySets = new Map<string, Set<string>>()
  for (const row of rows) {
    for (const [k, v] of Object.entries(row)) {
      if (k === 'id') continue
      if (k === 'party_type') continue
      if (k === 'extra_data') continue
      if (k.endsWith('_at')) continue
      const kl = k.toLowerCase()
      const kn = keyNorm(k)
      if (excludeKeysLower.has(kl) || excludeKeysNorm.has(kn)) continue
      if (MOBILE_NEVER_FACET_NORM.has(kn)) continue
      if (v == null || typeof v === 'object') continue
      const s = String(v).trim()
      if (!s || s.length > 72) continue
      if (!keySets.has(k)) keySets.set(k, new Set())
      keySets.get(k)!.add(s)
    }
  }

  const candidates: FacetDef[] = []
  for (const [k, set] of keySets) {
    if (set.size < 2 || set.size > maxUnique) continue
    candidates.push({
      key: k,
      label: humanizeKey(k),
      options: [...set].sort((a, b) => a.localeCompare(b)),
    })
  }

  candidates.sort((a, b) => {
    if (a.options.length !== b.options.length) return a.options.length - b.options.length
    return a.label.localeCompare(b.label)
  })

  return candidates.slice(0, maxFacets)
}

function PartyDetailModal({ row, onClose }: { row: PartyMaster; onClose: () => void }) {
  const entries = useMemo(() => {
    return Object.keys(row)
      .sort((a, b) => a.localeCompare(b))
      .map((k) => {
        const v = row[k]
        let display: ReactNode
        if (v == null) display = '—'
        else if (typeof v === 'boolean') display = v ? 'Yes' : 'No'
        else if (typeof v === 'object') {
          try {
            display = (
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                {JSON.stringify(v, null, 2)}
              </pre>
            )
          } catch {
            display = String(v)
          }
        } else display = String(v)
        return { k, label: humanizeKey(k), display }
      })
  }, [row])

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
        aria-labelledby="party-detail-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="party-detail-title">{displayName(row)}</h2>
            <p>
              {displayCode(row) ? `${displayCode(row)} · ` : null}ID {row.id}
            </p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailSections}>
            <section className={styles.detailSection}>
              <h3 className={styles.detailSectionTitle}>Record fields</h3>
              <div className={styles.detailSectionBody}>
                <div className={styles.kvGrid}>
                  {entries.map(({ k, label, display }) => (
                    <div key={k} className={styles.kv}>
                      <span>{label}</span>
                      <span>{display}</span>
                    </div>
                  ))}
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

type Props = {
  partyType: PartyTypeParam
  title: string
  subtitle: string
  /** API field names (any case) to never offer as facet dropdowns. */
  facetKeyBlocklist?: readonly string[]
  /** Customer list: hide Code & GSTIN columns; show Mobile separately from Phone. */
  customerTable?: boolean
}

/** Stable default — do not use inline `[]` (new reference each render breaks useMemo / causes infinite loops). */
const EMPTY_FACET_BLOCKLIST: readonly string[] = []

export function PartyMasterPage({
  partyType,
  title,
  subtitle,
  facetKeyBlocklist = EMPTY_FACET_BLOCKLIST,
  customerTable = false,
}: Props) {
  const [rows, setRows] = useState<PartyMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [mobileFilter, setMobileFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<Tri>('all')
  const [facetFilters, setFacetFilters] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [detail, setDetail] = useState<PartyMaster | null>(null)
  const [billsFor, setBillsFor] = useState<PartyMaster | null>(null)

  useBodyScrollLock(Boolean(detail || billsFor))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchPartyMasters(partyType)
      setRows(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load parties')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [partyType])

  useEffect(() => {
    load()
  }, [load])

  const excludeFacetKeys = useMemo(
    () => new Set(facetKeyBlocklist.map((k) => k.toLowerCase().trim()).filter(Boolean)),
    [facetKeyBlocklist],
  )

  const excludeFacetKeysNorm = useMemo(
    () => new Set(facetKeyBlocklist.map((k) => keyNorm(k)).filter(Boolean)),
    [facetKeyBlocklist],
  )

  const facets = useMemo(
    () => buildFacetOptions(rows, excludeFacetKeys, excludeFacetKeysNorm),
    [rows, excludeFacetKeys, excludeFacetKeysNorm],
  )

  useEffect(() => {
    setFacetFilters((prev) => {
      const allowed = new Set(facets.map((f) => f.key))
      const next: Record<string, string> = {}
      for (const [k, v] of Object.entries(prev)) {
        if (allowed.has(k) && v) next[k] = v
      }
      const same =
        Object.keys(prev).length === Object.keys(next).length &&
        Object.keys(next).every((k) => prev[k] === next[k])
      return same ? prev : next
    })
  }, [facets])

  const facetSig = useMemo(
    () =>
      Object.entries(facetFilters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('|'),
    [facetFilters],
  )

  useEffect(() => {
    setPage(1)
  }, [search, mobileFilter, activeFilter, pageSize, partyType, facetSig])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const mq = mobileFilter.trim().toLowerCase()
    const mqDigits = mq.replace(/\D/g, '')
    return rows.filter((p) => {
      if (!triBool(isPartyActive(p), activeFilter)) return false
      for (const [fk, fv] of Object.entries(facetFilters)) {
        if (!fv) continue
        const raw = p[fk]
        const cur = raw == null ? '' : String(raw).trim()
        if (cur !== fv) return false
      }
      if (mq) {
        const h = mobileFilterHaystack(p)
        const hNorm = h.replace(/\s/g, '')
        const mqNorm = mq.replace(/\s/g, '')
        const hDigits = h.replace(/\D/g, '')
        const matchText = h.includes(mq) || (mqNorm.length > 0 && hNorm.includes(mqNorm))
        const matchDigits =
          mqDigits.length >= 3 && hDigits.length > 0 && hDigits.includes(mqDigits)
        if (!matchText && !matchDigits) return false
      }
      if (!q) return true
      return searchHaystack(p).includes(q)
    })
  }, [rows, search, mobileFilter, activeFilter, facetFilters])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  useEffect(() => {
    if (page !== safePage) setPage(safePage)
  }, [page, safePage])

  const hasToken = Boolean(getBearerToken())

  const setFacet = (key: string, value: string) => {
    setFacetFilters((prev) => {
      const next = { ...prev }
      if (!value) delete next[key]
      else next[key] = value
      return next
    })
  }

  const showMobileCol = useMemo(
    () => MOBILE_KEY_LIST.some((logical) => datasetHasColumnCI(rows, logical)),
    [rows],
  )
  const showPhoneLandlineCol = useMemo(
    () => LANDLINE_KEY_LIST.some((logical) => datasetHasColumnCI(rows, logical)),
    [rows],
  )
  const distributorContactKeys = useMemo(
    () => (customerTable ? [] : distributorTableContactKeys(rows)),
    [rows, customerTable],
  )

  const tableColCount = useMemo(() => {
    let n = 2
    if (customerTable) {
      if (showMobileCol) n += 1
      if (showPhoneLandlineCol) n += 1
    } else {
      n += 1
      n += distributorContactKeys.length
    }
    n += 3
    if (!customerTable) n += 1
    n += 2
    return n
  }, [customerTable, showMobileCol, showPhoneLandlineCol, distributorContactKeys.length])

  const resetFilters = () => {
    setSearch('')
    setMobileFilter('')
    setActiveFilter('all')
    setFacetFilters({})
  }

  return (
    <div className={styles.page}>
      {!hasToken ? (
        <div className={`${styles.banner} ${styles.bannerHint}`}>
          Add <code>VITE_API_BEARER_TOKEN</code> to <code>.env.local</code> (see <code>.env.example</code>
          ). In dev, API calls use the Vite proxy at <code>/api</code> → <code>localhost:8000</code>.
        </div>
      ) : null}

      {error ? (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {error}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className={`${styles.filterCard} ${styles.pmFilterCard}`}>
        <div className={styles.filterGrid}>
          <div className={`${styles.field} ${styles.pmSearchField}`}>
            <label htmlFor="party-search" className={styles.pmSearchLabel}>
              Search
            </label>
            <input
              id="party-search"
              className={`${styles.searchInput} ${styles.pmSearchInput}`}
              placeholder="Search across all fields in the list…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="party-active">Active</label>
            <select
              id="party-active"
              className={styles.select}
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as Tri)}
            >
              <option value="all">All</option>
              <option value="yes">Active</option>
              <option value="no">Inactive</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="party-mobile-filter">Mobile number</label>
            <input
              id="party-mobile-filter"
              className={styles.searchInput}
              placeholder="Type digits or text to match mobile fields…"
              value={mobileFilter}
              onChange={(e) => setMobileFilter(e.target.value)}
              inputMode="tel"
              autoComplete="off"
            />
          </div>

          {facets.map((f) => (
            <div key={f.key} className={styles.field}>
              <label htmlFor={`party-facet-${f.key}`}>{f.label}</label>
              <select
                id={`party-facet-${f.key}`}
                className={styles.select}
                value={facetFilters[f.key] ?? ''}
                onChange={(e) => setFacet(f.key, e.target.value)}
              >
                <option value="">All</option>
                {f.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className={styles.filterMeta}>
          <span className={styles.chip}>
            Showing <strong>{pageItems.length}</strong> of <strong>{filtered.length}</strong> filtered (
            {rows.length} loaded) · <strong>{partyType}</strong>
          </span>
          <button type="button" className={styles.resetLink} onClick={resetFilters}>
            Reset filters
          </button>
        </div>
      </div>

      <div className={`${styles.tableWrap} ${styles.pmTableWrap}`}>
        {loading ? (
          <div className={styles.loading}>Loading party master…</div>
        ) : (
          <>
            <div className={styles.tableScroll}>
              <table className={`${styles.table} ${styles.pmTable}`}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    {customerTable ? (
                      <>
                        {showMobileCol ? <th>Mobile</th> : null}
                        {showPhoneLandlineCol ? <th>Phone</th> : null}
                      </>
                    ) : (
                      <>
                        <th>Code</th>
                        {distributorContactKeys.map((apiKey) => (
                          <th key={apiKey}>
                            <code className={styles.thApiKey}>{apiKey}</code>
                          </th>
                        ))}
                      </>
                    )}
                    <th>Email</th>
                    <th>City</th>
                    <th>State</th>
                    {!customerTable ? <th>GSTIN</th> : null}
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {!pageItems.length ? (
                    <tr>
                      <td
                        colSpan={tableColCount}
                        style={{
                          textAlign: 'center',
                          padding: '2rem',
                          color: 'var(--text-muted)',
                        }}
                      >
                        No parties match these filters.
                      </td>
                    </tr>
                  ) : null}
                  {pageItems.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.id}</strong>
                      </td>
                      <td className={styles.nameCell}>
                        <div className={styles.nameMain}>{displayName(row)}</div>
                      </td>
                      {customerTable ? (
                        <>
                          {showMobileCol ? <td>{displayMobile(row) || '—'}</td> : null}
                          {showPhoneLandlineCol ? <td>{displayPhoneLandline(row) || '—'}</td> : null}
                        </>
                      ) : (
                        <>
                          <td>{displayCode(row) || '—'}</td>
                          {distributorContactKeys.map((apiKey) => (
                            <td key={apiKey}>{cellByHeaderKey(row, apiKey) || '—'}</td>
                          ))}
                        </>
                      )}
                      <td>{strVal(row, 'email', 'contact_email') || '—'}</td>
                      <td>{strVal(row, 'city', 'district', 'town') || '—'}</td>
                      <td>{strVal(row, 'state', 'province', 'region') || '—'}</td>
                      {!customerTable ? (
                        <td>{strVal(row, 'gstin', 'gst_in', 'gst_no', 'gst_number') || '—'}</td>
                      ) : null}
                      <td>
                        {isPartyActive(row) ? (
                          <span className={`${styles.badge} ${styles.badgeOtc}`}>Active</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeOff}`}>Inactive</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.partyActionBtns}>
                          <button
                            type="button"
                            className={styles.linkBtn}
                            onClick={() => setDetail(row)}
                          >
                            View
                          </button>
                          {partyType === 'Distributor' ? (
                            <button
                              type="button"
                              className={styles.linkBtn}
                              onClick={() => setBillsFor(row)}
                            >
                              Bills
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <div className={styles.field} style={{ maxWidth: 120 }}>
                <label htmlFor="party-pagesize">Rows / page</label>
                <select
                  id="party-pagesize"
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

      {detail ? <PartyDetailModal row={detail} onClose={() => setDetail(null)} /> : null}
      {billsFor ? (
        <DistributorBillsModal
          partyId={billsFor.id}
          partyName={displayName(billsFor)}
          onClose={() => setBillsFor(null)}
        />
      ) : null}
    </div>
  )
}
