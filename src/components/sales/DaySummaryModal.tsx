import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchDaySummary } from '../../services/daySummaryApi'
import type { DaySummary, DaySummaryPoint } from '../../types/daySummary'
import pm from '../../pages/ProductMasterPage.module.css'
import rs from '../../pages/ReportsPage.module.css'

// ── format helpers ────────────────────────────────────────────────────────────
const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const numfmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

function money(v: number) { return inr0.format(v || 0) }
function money2(v: number) { return inr2.format(v || 0) }
function qty(v: number) { return numfmt.format(v || 0) }
function moneyCompact(v: number) {
  const x = v || 0, abs = Math.abs(x)
  if (abs >= 1e7) return `${x < 0 ? '-' : ''}₹${(abs / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `${x < 0 ? '-' : ''}₹${(abs / 1e5).toFixed(2)} L`
  if (abs >= 1e3) return `${x < 0 ? '-' : ''}₹${(abs / 1e3).toFixed(1)} K`
  return inr0.format(x)
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDate(s: string | null) {
  if (!s) return '—'
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s.slice(0, 10) : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}
function fmtLong(s: string) {
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

const STATUS_CLASS: Record<string, string> = { paid: rs.badgePaid, unpaid: rs.badgeUnpaid, partial: rs.badgePartial }
function statusBadge(s: string | null) {
  const k = (s || '').toLowerCase()
  return <span className={STATUS_CLASS[k] ?? rs.badgeNeutral}>{s || 'N/A'}</span>
}

const PAY_COLORS = ['#16a34a', '#dc2626', '#ea580c', '#0891b2', '#7c3aed', '#64748b']

type Tone = 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'indigo' | 'rose' | 'slate'
function Kpi({ label, value, sub, tone = 'slate', icon }: { label: string; value: string; sub?: string; tone?: Tone; icon?: string }) {
  return (
    <div className={`${rs.kpi} ${rs[`kpi_${tone}`]}`}>
      <div className={rs.kpiTop}><span className={rs.kpiLabel}>{label}</span>{icon && <span className={rs.kpiIcon}>{icon}</span>}</div>
      <div className={rs.kpiValue}>{value}</div>
      {sub && <div className={rs.kpiSub}>{sub}</div>}
    </div>
  )
}

function TrendChart({ data }: { data: DaySummaryPoint[] }) {
  const W = 1000, H = 240, PAD = 8
  const pts = data.length ? data : [{ date: '', sales: 0, returns: 0, net: 0, bills: 0 }]
  const max = Math.max(1, ...pts.map((p) => p.net))
  const step = pts.length > 1 ? (W - PAD * 2) / (pts.length - 1) : 0
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const x = (i: number) => PAD + i * step
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.net).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
  const peak = pts.reduce((a, b) => (b.net > a.net ? b : a), pts[0])
  const total = pts.reduce((s, p) => s + p.net, 0)
  return (
    <div className={rs.chartCard}>
      <div className={rs.chartHead}>
        <div><p className={rs.chartTitle}>Net Sales Trend</p><p className={rs.chartSub}>{pts.length} days · total {money(total)}</p></div>
        <div className={rs.chartPeak}><span>Best day</span><strong>{money(peak.net)}</strong><em>{fmtDate(peak.date)}</em></div>
      </div>
      <svg className={rs.chartSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Net sales trend">
        <defs><linearGradient id="ds-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb" stopOpacity="0.32" /><stop offset="100%" stopColor="#2563eb" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1={PAD} x2={W - PAD} y1={H * g} y2={H * g} className={rs.chartGrid} />)}
        <path d={area} fill="url(#ds-grad)" />
        <path d={line} fill="none" stroke="#2563eb" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className={rs.chartAxis}><span>{fmtDate(pts[0].date)}</span><span>{fmtDate(pts[pts.length - 1].date)}</span></div>
    </div>
  )
}

function Donut({ title, segments }: { title: string; segments: { label: string; value: number; color: string; meta?: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 70, C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className={rs.panel}>
      <p className={rs.panelTitle}>{title}</p>
      {total <= 0 ? <p className={rs.emptyNote}>No data for this period.</p> : (
        <div className={rs.donutWrap}>
          <svg className={rs.donut} viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={R} className={rs.donutTrack} />
            {segments.map((s, i) => {
              const len = (s.value / total) * C
              const seg = <circle key={i} cx="90" cy="90" r={R} fill="none" stroke={s.color} strokeWidth="20" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)" />
              offset += len
              return seg
            })}
            <text x="90" y="84" className={rs.donutTotalLabel}>Total</text>
            <text x="90" y="104" className={rs.donutTotalValue}>{money(total)}</text>
          </svg>
          <ul className={rs.legend}>
            {segments.map((s, i) => (
              <li key={i}>
                <span className={rs.legendDot} style={{ background: s.color }} />
                <span className={rs.legendLabel}>{s.label}</span>
                <span className={rs.legendVal}>{money(s.value)} · {total ? Math.round((s.value / total) * 100) : 0}%{s.meta ? ` · ${s.meta}` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function BarList({ title, rows }: { title: string; rows: { label: string; value: number; right: string; sub?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className={rs.panel}>
      <p className={rs.panelTitle}>{title}</p>
      {rows.length === 0 ? <p className={rs.emptyNote}>No data for this period.</p> : (
        <ul className={rs.barList}>
          {rows.map((r, i) => (
            <li key={i} className={rs.barRow}>
              <div className={rs.barMeta}>
                <span className={rs.barRank} style={{ background: '#2563eb' }}>{i + 1}</span>
                <span className={rs.barLabel} title={r.label}>{r.label}</span>
                <span className={rs.barRight}>{r.right}</span>
              </div>
              <div className={rs.barTrack}><span className={rs.barFill} style={{ width: `${(r.value / max) * 100}%`, background: '#2563eb' }} /></div>
              {r.sub && <span className={rs.barSub}>{r.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Modal ───────────────────────────────────────────────────────────────────────

type Mode = 'day' | 'range'

export function DaySummaryModal({ onClose }: { onClose: () => void }) {
  const today = useMemo(() => new Date(), [])
  const [mode, setMode] = useState<Mode>('day')
  const [day, setDay] = useState(() => isoDate(new Date()))
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 6 * 864e5)))
  const [to, setTo] = useState(() => isoDate(new Date()))

  const [data, setData] = useState<DaySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const fromEff = mode === 'day' ? day : from
  const toEff = mode === 'day' ? day : to

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setData(await fetchDaySummary(fromEff, toEff))
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load day summary')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [fromEff, toEff])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function setRangeDays(days: number) {
    setFrom(isoDate(new Date(today.getTime() - (days - 1) * 864e5)))
    setTo(isoDate(today))
  }
  function setThisMonth() {
    setFrom(isoDate(new Date(today.getFullYear(), today.getMonth(), 1)))
    setTo(isoDate(today))
  }

  const s = data?.summary
  const heading = data
    ? data.range.single_day ? fmtLong(data.range.from) : `${fmtDate(data.range.from)} → ${fmtDate(data.range.to)}`
    : ''

  return (
    <div className={pm.overlayFullscreen}>
      <div className={pm.fsHeader}>
        <button type="button" className={pm.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={pm.fsHeaderTitle}>
          <h2>📅 Day Summary</h2>
          <p>Sales digest for any date or range — net of returns</p>
        </div>
        <button type="button" className={pm.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      {/* Toolbar */}
      <div className={pm.fsFilters}>
        <div className={pm.fsFilterRow}>
          <div className={pm.fsFilterField}>
            <label>View</label>
            <div style={{ display: 'inline-flex', border: '1px solid var(--border-strong)', borderRadius: 8, overflow: 'hidden' }}>
              {(['day', 'range'] as Mode[]).map((mname) => (
                <button key={mname} type="button" onClick={() => setMode(mname)}
                  style={{
                    padding: '0.45rem 0.9rem', border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.84rem', cursor: 'pointer',
                    background: mode === mname ? 'var(--medical-mid)' : '#fff', color: mode === mname ? '#fff' : 'var(--medical-deep)',
                  }}>
                  {mname === 'day' ? 'Single day' : 'Date range'}
                </button>
              ))}
            </div>
          </div>

          {mode === 'day' ? (
            <>
              <div className={pm.fsFilterField}>
                <label htmlFor="ds-day">Date</label>
                <input id="ds-day" type="date" value={day} max={isoDate(today)} onChange={(e) => setDay(e.target.value)} />
              </div>
              <div className={pm.fsFilterField}>
                <label>Quick</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button type="button" className={rs.tab} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.7rem' }} onClick={() => setDay(isoDate(today))}>Today</button>
                  <button type="button" className={rs.tab} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.7rem' }} onClick={() => setDay(isoDate(new Date(today.getTime() - 864e5)))}>Yesterday</button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={pm.fsFilterField}><label htmlFor="ds-from">From</label><input id="ds-from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></div>
              <div className={pm.fsFilterField}><label htmlFor="ds-to">To</label><input id="ds-to" type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></div>
              <div className={pm.fsFilterField}>
                <label>Quick</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button type="button" className={rs.tab} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.7rem' }} onClick={() => setRangeDays(7)}>7D</button>
                  <button type="button" className={rs.tab} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.7rem' }} onClick={() => setRangeDays(30)}>30D</button>
                  <button type="button" className={rs.tab} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '0.4rem 0.7rem' }} onClick={setThisMonth}>This month</button>
                </div>
              </div>
            </>
          )}
        </div>
        {data && <div className={pm.fsFilterMeta}><span className={pm.chip}><strong>{heading}</strong></span></div>}
      </div>

      {/* Body */}
      <div className={pm.fsBody}>
        {loading ? (
          <div className={rs.loading}><span className={rs.spinner} aria-hidden /> Loading summary…</div>
        ) : err ? (
          <div className={rs.errorBox}><p>{err}</p><button type="button" className={rs.retryBtn} onClick={() => void load()}>Retry</button></div>
        ) : data && s ? (
          <>
            <div className={rs.kpiGrid}>
              <Kpi tone="blue"   icon="💰" label="Net Sales"   value={moneyCompact(s.net_sales)}  sub={money2(s.net_sales)} />
              <Kpi tone="indigo" icon="🧾" label="Bills"       value={qty(s.bill_count)}           sub={`Avg ${money(s.avg_bill)}/bill`} />
              <Kpi tone="green"  icon="📦" label="Items Sold"  value={qty(s.items_sold)}           sub={`${qty(s.unique_customers)} customers`} />
              <Kpi tone="rose"   icon="↩️" label="Returns"     value={moneyCompact(s.returns)}     sub={`${s.return_count} returns · ${qty(s.items_returned)} items`} />
              <Kpi tone="cyan"   icon="💵" label="Collected"   value={moneyCompact(s.collected)}   sub="receipts in period" />
              <Kpi tone="orange" icon="🏷️" label="Discount"    value={moneyCompact(s.discount)}    sub="given to customers" />
              <Kpi tone="purple" icon="📊" label="Tax"         value={moneyCompact(s.tax)}         sub="GST on sales" />
              <Kpi tone="slate"  icon="🧮" label="Gross Sales" value={moneyCompact(s.gross_sales)} sub="before returns" />
            </div>

            {!data.range.single_day && <TrendChart data={data.daily} />}

            <div className={rs.twoCol}>
              <Donut title="💳 Payment Status" segments={data.payment_status.map((p, i) => ({ label: p.status, value: p.amount, color: PAY_COLORS[i % PAY_COLORS.length], meta: `${p.count} bills` }))} />
              {data.payment_modes.length > 0 ? (
                <BarList title="🏦 Collected by Mode" rows={data.payment_modes.map((m) => ({ label: m.mode, value: m.amount, right: money(m.amount), sub: `${m.count} receipts` }))} />
              ) : (
                <BarList title="🏆 Top Items" rows={data.top_items.map((t) => ({ label: t.item_name, value: t.revenue, right: money(t.revenue), sub: `${qty(t.qty)} units` }))} />
              )}
            </div>

            {data.payment_modes.length > 0 && (
              <BarList title="🏆 Top Items" rows={data.top_items.map((t) => ({ label: t.item_name, value: t.revenue, right: money(t.revenue), sub: `${qty(t.qty)} units` }))} />
            )}

            {/* Bills */}
            <div className={rs.panel}>
              <p className={rs.panelTitle}>🧾 Bills ({data.bills.length})</p>
              <div className={rs.tableScroll}>
                <table className={rs.table}>
                  <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Items</th><th>Discount</th><th>Tax</th><th>Net</th><th>Mode</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.bills.length === 0 ? (
                      <tr><td className={rs.emptyCell} colSpan={9}>No bills in this period.</td></tr>
                    ) : data.bills.map((b) => (
                      <tr key={b.id}>
                        <td><strong>{b.invoice_no}</strong></td>
                        <td>{fmtDate(b.invoice_date)}</td>
                        <td>{b.customer_name}</td>
                        <td className={rs.num}>{b.items}</td>
                        <td className={rs.num}>{money2(b.discount)}</td>
                        <td className={rs.num}>{money2(b.tax)}</td>
                        <td className={`${rs.num} ${rs.strong}`}>{money2(b.net)}</td>
                        <td>{b.payment_mode || '—'}</td>
                        <td>{statusBadge(b.payment_status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Returns */}
            {data.returns.length > 0 && (
              <div className={rs.panel}>
                <p className={rs.panelTitle}>↩️ Returns ({data.returns.length})</p>
                <div className={rs.tableScroll}>
                  <table className={rs.table}>
                    <thead><tr><th>Return No</th><th>Date</th><th>Customer</th><th>Reason</th><th>Value</th><th>Refunded</th></tr></thead>
                    <tbody>
                      {data.returns.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.return_no}</strong></td>
                          <td>{fmtDate(r.return_date)}</td>
                          <td>{r.customer_name}</td>
                          <td>{r.reason || '—'}</td>
                          <td className={rs.num}>{money2(r.amount)}</td>
                          <td className={`${rs.num} ${rs.neg}`}>{money2(r.refund_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
