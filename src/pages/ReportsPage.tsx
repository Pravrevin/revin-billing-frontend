import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  fetchDailyReport,
  fetchGstReport,
  fetchInventoryReport,
  fetchProfitReport,
  fetchPurchaseReport,
  fetchSalesReport,
} from '../services/reportsApi'
import type {
  DailyPoint,
  DailyReport,
  GstReport,
  InventoryReport,
  ProfitReport,
  PurchaseReport,
  ReportType,
  SalesReport,
} from '../types/report'
import styles from './ReportsPage.module.css'

// ── Tab config ────────────────────────────────────────────────────────────────

type TabDef = { type: ReportType; icon: string; label: string; blurb: string; accent: string }

const TABS: TabDef[] = [
  { type: 'sales',     icon: '💰', label: 'Sales',     blurb: 'Revenue, bills & best sellers',     accent: '#2563eb' },
  { type: 'purchase',  icon: '📥', label: 'Purchase',  blurb: 'Spend, suppliers & inflow',         accent: '#16a34a' },
  { type: 'profit',    icon: '📈', label: 'Profit',    blurb: 'Margins & top earners',             accent: '#7c3aed' },
  { type: 'daily',     icon: '📅', label: 'Daily',     blurb: 'A single day at a glance',          accent: '#ea580c' },
  { type: 'gst',       icon: '🧾', label: 'GST',       blurb: 'Output, input & net payable',       accent: '#0891b2' },
  { type: 'inventory', icon: '📦', label: 'Inventory', blurb: 'Valuation, expiry & dead stock',    accent: '#4338ca' },
]

const RANGE_PRESETS: { key: string; label: string; days: number }[] = [
  { key: '7',  label: '7D',  days: 7 },
  { key: '30', label: '30D', days: 30 },
  { key: '90', label: '90D', days: 90 },
]

// ── Format helpers ──────────────────────────────────────────────────────────

const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const num0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

function money(v: number): string { return inr0.format(v || 0) }
function money2(v: number): string { return inr2.format(v || 0) }
function qty(v: number): string { return num0.format(v || 0) }

/** Compact currency for KPI hero values (e.g. ₹1.2L, ₹3.4Cr). */
function moneyCompact(v: number): string {
  const n = v || 0
  const abs = Math.abs(n)
  if (abs >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (abs >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`
  if (abs >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`
  return inr0.format(n)
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
}

function fmtDayLong(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_CLASS: Record<string, string> = {
  paid: styles.badgePaid,
  unpaid: styles.badgeUnpaid,
  partial: styles.badgePartial,
}
function statusBadge(status: string | null) {
  const key = (status || '').toLowerCase()
  const cls = STATUS_CLASS[key] ?? styles.badgeNeutral
  return <span className={cls}>{status || 'N/A'}</span>
}

// ── Reusable visual pieces ────────────────────────────────────────────────────

type KpiTone = 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'indigo' | 'rose' | 'slate'

function Kpi({ label, value, sub, tone = 'slate', icon }: {
  label: string; value: string; sub?: string; tone?: KpiTone; icon?: string
}) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi_${tone}`]}`}>
      <div className={styles.kpiTop}>
        <span className={styles.kpiLabel}>{label}</span>
        {icon && <span className={styles.kpiIcon}>{icon}</span>}
      </div>
      <div className={styles.kpiValue}>{value}</div>
      {sub && <div className={styles.kpiSub}>{sub}</div>}
    </div>
  )
}

/** SVG area + line chart from a daily series. Pure SVG, no deps. */
function TrendChart({ data, accent, valueFmt }: {
  data: DailyPoint[]; accent: string; valueFmt: (n: number) => string
}) {
  const W = 1000
  const H = 260
  const PAD = 8
  const pts = data.length ? data : [{ date: '', total: 0, count: 0 }]
  const max = Math.max(1, ...pts.map((p) => p.total))
  const step = pts.length > 1 ? (W - PAD * 2) / (pts.length - 1) : 0
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2)
  const x = (i: number) => PAD + i * step

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.total).toFixed(1)}`).join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
  const peak = pts.reduce((a, b) => (b.total > a.total ? b : a), pts[0])
  const peakIdx = pts.indexOf(peak)
  const gid = `g-${accent.replace('#', '')}`
  const total = pts.reduce((s, p) => s + p.total, 0)

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHead}>
        <div>
          <p className={styles.chartTitle}>Trend</p>
          <p className={styles.chartSub}>{pts.length} day{pts.length === 1 ? '' : 's'} · total {valueFmt(total)}</p>
        </div>
        <div className={styles.chartPeak}>
          <span>Peak</span>
          <strong>{valueFmt(peak.total)}</strong>
          <em>{fmtDate(peak.date)}</em>
        </div>
      </div>
      <svg className={styles.chartSvg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.32" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={PAD} x2={W - PAD} y1={H * g} y2={H * g} className={styles.chartGrid} />
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {pts.length > 1 && (
          <circle cx={x(peakIdx)} cy={y(peak.total)} r={5} fill="#fff" stroke={accent} strokeWidth={3} />
        )}
      </svg>
      <div className={styles.chartAxis}>
        <span>{fmtDate(pts[0].date)}</span>
        <span>{fmtDate(pts[pts.length - 1].date)}</span>
      </div>
    </div>
  )
}

/** Horizontal ranked bar list. */
function BarList({ title, rows, accent }: {
  title: string
  rows: { label: string; value: number; right: string; sub?: string }[]
  accent: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>{title}</p>
      {rows.length === 0 ? (
        <p className={styles.emptyNote}>No data for this period.</p>
      ) : (
        <ul className={styles.barList}>
          {rows.map((r, i) => (
            <li key={i} className={styles.barRow}>
              <div className={styles.barMeta}>
                <span className={styles.barRank} style={{ background: accent }}>{i + 1}</span>
                <span className={styles.barLabel} title={r.label}>{r.label}</span>
                <span className={styles.barRight}>{r.right}</span>
              </div>
              <div className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${(r.value / max) * 100}%`, background: accent }} />
              </div>
              {r.sub && <span className={styles.barSub}>{r.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** SVG donut for breakdowns. */
function Donut({ title, segments }: {
  title: string
  segments: { label: string; value: number; color: string; meta?: string }[]
}) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const R = 70
  const C = 2 * Math.PI * R
  let offset = 0
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>{title}</p>
      {total <= 0 ? (
        <p className={styles.emptyNote}>No data for this period.</p>
      ) : (
        <div className={styles.donutWrap}>
          <svg className={styles.donut} viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={R} className={styles.donutTrack} />
            {segments.map((s, i) => {
              const len = (s.value / total) * C
              const seg = (
                <circle
                  key={i}
                  cx="90" cy="90" r={R}
                  fill="none" stroke={s.color} strokeWidth="20"
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 90 90)"
                />
              )
              offset += len
              return seg
            })}
            <text x="90" y="84" className={styles.donutTotalLabel}>Total</text>
            <text x="90" y="104" className={styles.donutTotalValue}>{money(total)}</text>
          </svg>
          <ul className={styles.legend}>
            {segments.map((s, i) => (
              <li key={i}>
                <span className={styles.legendDot} style={{ background: s.color }} />
                <span className={styles.legendLabel}>{s.label}</span>
                <span className={styles.legendVal}>
                  {money(s.value)} · {total ? Math.round((s.value / total) * 100) : 0}%
                  {s.meta ? ` · ${s.meta}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

const PAY_COLORS = ['#16a34a', '#dc2626', '#ea580c', '#0891b2', '#7c3aed', '#64748b']

// ── Loaded data union ──────────────────────────────────────────────────────────

type Loaded =
  | { type: 'sales'; data: SalesReport }
  | { type: 'purchase'; data: PurchaseReport }
  | { type: 'profit'; data: ProfitReport }
  | { type: 'daily'; data: DailyReport }
  | { type: 'gst'; data: GstReport }
  | { type: 'inventory'; data: InventoryReport }

// ── Page ───────────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const navigate = useNavigate()
  const params = useParams<{ type?: string }>()
  const active: ReportType = (TABS.find((t) => t.type === params.type)?.type) ?? 'sales'
  const tab = TABS.find((t) => t.type === active)!

  const today = useMemo(() => new Date(), [])
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 29 * 864e5)))
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [day, setDay] = useState(() => isoDate(new Date()))

  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const close = useCallback(() => navigate('/app/dashboard'), [navigate])

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      let next: Loaded
      switch (active) {
        case 'sales':     next = { type: 'sales', data: await fetchSalesReport(from, to) }; break
        case 'purchase':  next = { type: 'purchase', data: await fetchPurchaseReport(from, to) }; break
        case 'profit':    next = { type: 'profit', data: await fetchProfitReport(from, to) }; break
        case 'daily':     next = { type: 'daily', data: await fetchDailyReport(day) }; break
        case 'gst':       next = { type: 'gst', data: await fetchGstReport(from, to) }; break
        case 'inventory': next = { type: 'inventory', data: await fetchInventoryReport() }; break
      }
      setLoaded(next)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not load report')
      setLoaded(null)
    } finally {
      setLoading(false)
    }
  }, [active, from, to, day])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  function applyPreset(days: number) {
    setFrom(isoDate(new Date(today.getTime() - (days - 1) * 864e5)))
    setTo(isoDate(today))
  }

  const usesRange = active !== 'inventory' && active !== 'daily'

  return (
    <div className={styles.overlay}>
      {/* Header */}
      <div className={styles.header} style={{ background: `linear-gradient(120deg, ${tab.accent}, #0c4a6e)` }}>
        <button type="button" className={styles.backBtn} onClick={close}>← Back</button>
        <div className={styles.headerTitle}>
          <h2>{tab.icon} {tab.label} Report</h2>
          <p>{tab.blurb}</p>
        </div>
        <button type="button" className={styles.closeBtn} onClick={close} aria-label="Close">×</button>
      </div>

      {/* Tab rail */}
      <div className={styles.tabRail}>
        {TABS.map((t) => (
          <button
            key={t.type}
            type="button"
            className={`${styles.tab} ${t.type === active ? styles.tabActive : ''}`}
            style={t.type === active ? { borderColor: t.accent, color: t.accent } : undefined}
            onClick={() => navigate(`/app/reports/${t.type}`)}
          >
            <span className={styles.tabIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        {usesRange ? (
          <div className={styles.toolbarRow}>
            <div className={styles.presetGroup}>
              {RANGE_PRESETS.map((p) => (
                <button key={p.key} type="button" className={styles.presetBtn} onClick={() => applyPreset(p.days)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className={styles.dateField}>
              <label>From</label>
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className={styles.dateField}>
              <label>To</label>
              <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        ) : active === 'daily' ? (
          <div className={styles.toolbarRow}>
            <div className={styles.dateField}>
              <label>Date</label>
              <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
            </div>
          </div>
        ) : (
          <div className={styles.toolbarRow}>
            <span className={styles.asOf}>Live snapshot · as of today</span>
          </div>
        )}
        <button type="button" className={styles.refreshBtn} onClick={() => void load()} disabled={loading}>
          {loading ? 'Loading…' : '↻ Refresh'}
        </button>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading}>
            <span className={styles.spinner} aria-hidden /> Loading {tab.label.toLowerCase()} report…
          </div>
        ) : err ? (
          <div className={styles.errorBox}>
            <p>{err}</p>
            <button type="button" className={styles.retryBtn} onClick={() => void load()}>Retry</button>
          </div>
        ) : loaded ? (
          <ReportBody loaded={loaded} accent={tab.accent} />
        ) : null}
      </div>
    </div>
  )
}

// ── Per-report bodies ───────────────────────────────────────────────────────────

function ReportBody({ loaded, accent }: { loaded: Loaded; accent: string }) {
  switch (loaded.type) {
    case 'sales':     return <SalesBody d={loaded.data} accent={accent} />
    case 'purchase':  return <PurchaseBody d={loaded.data} accent={accent} />
    case 'profit':    return <ProfitBody d={loaded.data} accent={accent} />
    case 'daily':     return <DailyBody d={loaded.data} accent={accent} />
    case 'gst':       return <GstBody d={loaded.data} accent={accent} />
    case 'inventory': return <InventoryBody d={loaded.data} accent={accent} />
  }
}

function SalesBody({ d, accent }: { d: SalesReport; accent: string }) {
  const s = d.summary
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="blue"   icon="💰" label="Net Sales"      value={moneyCompact(s.net_sales)}  sub={`${money2(s.net_sales)}`} />
        <Kpi tone="indigo" icon="🧾" label="Bills"          value={qty(s.bill_count)}           sub={`Avg ${money(s.avg_bill)}/bill`} />
        <Kpi tone="green"  icon="📦" label="Units Sold"     value={qty(s.qty_sold)}             sub="across all items" />
        <Kpi tone="purple" icon="👥" label="Customers"      value={qty(s.unique_customers)}     sub="unique buyers" />
        <Kpi tone="orange" icon="🏷️" label="Discount Given" value={moneyCompact(s.discount)}    sub="total concessions" />
        <Kpi tone="cyan"   icon="📊" label="Tax Collected"  value={moneyCompact(s.tax)}         sub="GST on sales" />
      </div>

      <TrendChart data={d.daily} accent={accent} valueFmt={money} />

      <div className={styles.twoCol}>
        <BarList
          title="🏆 Top Selling Items"
          accent={accent}
          rows={d.top_items.map((i) => ({ label: i.item_name, value: i.revenue, right: money(i.revenue), sub: `${qty(i.qty)} units` }))}
        />
        <Donut
          title="💳 Payment Status"
          segments={d.payment_breakdown.map((p, i) => ({ label: p.status, value: p.amount, color: PAY_COLORS[i % PAY_COLORS.length], meta: `${p.count} bills` }))}
        />
      </div>

      <Table
        title="🧾 Recent Bills"
        head={['Invoice', 'Date', 'Customer', 'Amount', 'Status']}
        rows={d.recent.map((r) => [
          r.invoice_no || `#${r.id}`,
          fmtDate(r.invoice_date),
          r.customer_name,
          <span className={styles.num}>{money2(r.net_amount)}</span>,
          statusBadge(r.payment_status),
        ])}
        empty="No bills in this period."
      />
    </>
  )
}

function PurchaseBody({ d, accent }: { d: PurchaseReport; accent: string }) {
  const s = d.summary
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="green"  icon="📥" label="Net Purchase"   value={moneyCompact(s.net_purchase)} sub={money2(s.net_purchase)} />
        <Kpi tone="indigo" icon="🧾" label="Bills"          value={qty(s.bill_count)}            sub={`Avg ${money(s.avg_bill)}/bill`} />
        <Kpi tone="blue"   icon="📦" label="Units Bought"   value={qty(s.qty_bought)}            sub="across all items" />
        <Kpi tone="cyan"   icon="🏭" label="Suppliers"      value={qty(s.unique_suppliers)}      sub="unique vendors" />
        <Kpi tone="orange" icon="🏷️" label="Discount"       value={moneyCompact(s.discount)}     sub="vendor concessions" />
        <Kpi tone="purple" icon="📊" label="Input Tax"      value={moneyCompact(s.tax)}          sub="GST on purchases" />
      </div>

      <TrendChart data={d.daily} accent={accent} valueFmt={money} />

      <div className={styles.twoCol}>
        <BarList
          title="🏭 Top Suppliers"
          accent={accent}
          rows={d.top_suppliers.map((x) => ({ label: x.name, value: x.amount, right: money(x.amount), sub: `${x.bills} bills` }))}
        />
        <BarList
          title="📦 Most Purchased Items"
          accent={accent}
          rows={d.top_items.map((x) => ({ label: x.item_name, value: x.amount, right: money(x.amount), sub: `${qty(x.qty)} units` }))}
        />
      </div>

      <Table
        title="📥 Recent Purchases"
        head={['Invoice', 'Date', 'Supplier', 'Amount']}
        rows={d.recent.map((r) => [
          r.invoice_no || `#${r.id}`,
          fmtDate(r.invoice_date),
          r.supplier_name,
          <span className={styles.num}>{money2(r.net_amount)}</span>,
        ])}
        empty="No purchases in this period."
      />
    </>
  )
}

function ProfitBody({ d, accent }: { d: ProfitReport; accent: string }) {
  const s = d.summary
  const tone: KpiTone = s.gross_profit >= 0 ? 'green' : 'rose'
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="blue"   icon="💵" label="Revenue (ex-tax)" value={moneyCompact(s.revenue)} sub={money2(s.revenue)} />
        <Kpi tone="orange" icon="🧱" label="Cost of Goods"    value={moneyCompact(s.cost)}    sub={money2(s.cost)} />
        <Kpi tone={tone}   icon="📈" label="Gross Profit"     value={moneyCompact(s.gross_profit)} sub={money2(s.gross_profit)} />
        <Kpi tone="purple" icon="％" label="Margin"           value={`${s.margin_pct}%`}      sub={`${qty(s.lines)} sale lines`} />
      </div>

      <TrendChart data={d.daily} accent={accent} valueFmt={money} />

      <Table
        title="🏆 Most Profitable Items"
        head={['Item', 'Qty', 'Revenue', 'Cost', 'Profit', 'Margin']}
        rows={d.top_items.map((r) => [
          r.item_name,
          qty(r.qty),
          <span className={styles.num}>{money2(r.revenue)}</span>,
          <span className={styles.num}>{money2(r.cost)}</span>,
          <span className={`${styles.num} ${r.profit >= 0 ? styles.pos : styles.neg}`}>{money2(r.profit)}</span>,
          <span className={r.margin_pct >= 0 ? styles.pos : styles.neg}>{r.margin_pct}%</span>,
        ])}
        empty="No sales to compute profit in this period."
      />
    </>
  )
}

function DailyBody({ d, accent }: { d: DailyReport; accent: string }) {
  const s = d.summary
  const cashTone: KpiTone = s.net_cash >= 0 ? 'green' : 'rose'
  return (
    <>
      <p className={styles.dayHeadline} style={{ borderColor: accent }}>📅 {fmtDayLong(d.day)}</p>
      <div className={styles.kpiGrid}>
        <Kpi tone="blue"   icon="💰" label="Sales"          value={moneyCompact(s.sales_net)}   sub={`${s.sales_bills} bills`} />
        <Kpi tone="green"  icon="📥" label="Purchases"      value={moneyCompact(s.purchase_net)} sub={`${s.purchase_bills} bills`} />
        <Kpi tone={cashTone} icon="💵" label="Net Cash Flow" value={moneyCompact(s.net_cash)}   sub="sales − purchases" />
        <Kpi tone="cyan"   icon="🧾" label="Tax Collected"  value={moneyCompact(s.sales_tax)}   sub="GST on the day" />
      </div>

      <div className={styles.twoCol}>
        <BarList
          title="🏆 Top Sellers Today"
          accent={accent}
          rows={d.top_items.map((i) => ({ label: i.item_name, value: i.revenue, right: money(i.revenue), sub: `${qty(i.qty)} units` }))}
        />
        <Donut
          title="💳 Payment Status"
          segments={d.payment_breakdown.map((p, i) => ({ label: p.status, value: p.amount, color: PAY_COLORS[i % PAY_COLORS.length], meta: `${p.count} bills` }))}
        />
      </div>

      <Table
        title="🧾 Bills on this Day"
        head={['Invoice', 'Customer', 'Amount', 'Status']}
        rows={d.bills.map((r) => [
          r.invoice_no || `#${r.id}`,
          r.customer_name,
          <span className={styles.num}>{money2(r.net_amount)}</span>,
          statusBadge(r.payment_status),
        ])}
        empty="No bills recorded on this day."
      />
    </>
  )
}

function GstBody({ d, accent }: { d: GstReport; accent: string }) {
  const s = d.summary
  const payTone: KpiTone = s.net_payable >= 0 ? 'orange' : 'green'
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="blue"   icon="⬆️" label="Output GST (Sales)"     value={moneyCompact(s.output_gst)} sub={money2(s.output_gst)} />
        <Kpi tone="green"  icon="⬇️" label="Input GST (Purchases)"  value={moneyCompact(s.input_gst)}  sub={money2(s.input_gst)} />
        <Kpi tone={payTone} icon="🏛️" label={s.net_payable >= 0 ? 'Net GST Payable' : 'Net GST Credit'} value={moneyCompact(Math.abs(s.net_payable))} sub="output − input" />
      </div>

      <div className={styles.twoCol}>
        <GstSlabTable title="⬆️ Output GST — Sales by Slab" slabs={d.output_slabs} accent={accent} />
        <GstSlabTable title="⬇️ Input GST — Purchases by Slab" slabs={d.input_slabs} accent={accent} />
      </div>
    </>
  )
}

function GstSlabTable({ title, slabs, accent }: { title: string; slabs: GstReport['output_slabs']; accent: string }) {
  const totalTax = slabs.reduce((a, b) => a + b.tax, 0)
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>{title}</p>
      {slabs.length === 0 ? (
        <p className={styles.emptyNote}>No taxable transactions in this period.</p>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr><th>GST %</th><th>Taxable</th><th>CGST</th><th>SGST</th><th>Total Tax</th></tr>
            </thead>
            <tbody>
              {slabs.map((s, i) => (
                <tr key={i}>
                  <td><span className={styles.gstChip} style={{ background: `${accent}1a`, color: accent }}>{s.rate}%</span></td>
                  <td className={styles.num}>{money2(s.taxable)}</td>
                  <td className={styles.num}>{money2(s.cgst)}</td>
                  <td className={styles.num}>{money2(s.sgst)}</td>
                  <td className={`${styles.num} ${styles.strong}`}>{money2(s.tax)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr><td>Total</td><td colSpan={3} /><td className={`${styles.num} ${styles.strong}`}>{money2(totalTax)}</td></tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

function InventoryBody({ d, accent }: { d: InventoryReport; accent: string }) {
  const s = d.summary
  return (
    <>
      <div className={styles.kpiGrid}>
        <Kpi tone="indigo" icon="🏷️" label="Stock Value (Cost)" value={moneyCompact(s.stock_value_cost)} sub={money2(s.stock_value_cost)} />
        <Kpi tone="blue"   icon="🛒" label="Stock Value (MRP)"  value={moneyCompact(s.stock_value_mrp)}  sub={money2(s.stock_value_mrp)} />
        <Kpi tone="green"  icon="📈" label="Potential Margin"   value={moneyCompact(s.potential_margin)} sub="MRP − Cost" />
        <Kpi tone="cyan"   icon="📦" label="Items in Stock"     value={qty(s.items_in_stock)}            sub={`${s.batches} batches`} />
        <Kpi tone="slate"  icon="🔢" label="Total Quantity"     value={qty(s.total_qty)}                 sub="units on hand" />
        <Kpi tone="orange" icon="⏳" label="Near Expiry"        value={qty(s.near_expiry)}               sub="within 30 days" />
        <Kpi tone="rose"   icon="🚫" label="Expired Batches"    value={qty(s.expired)}                   sub="clear these out" />
        <Kpi tone="purple" icon="📉" label="Out of Stock"       value={qty(s.out_of_stock)}              sub="zero-qty batches" />
      </div>

      <div className={styles.twoCol}>
        <BarList
          title="💎 Highest-Value Items"
          accent={accent}
          rows={d.top_value_items.map((i) => ({ label: i.item_name, value: i.value, right: money(i.value), sub: `${qty(i.qty)} units` }))}
        />
        <BarList
          title="🗂️ Stock Value by Category"
          accent={accent}
          rows={d.category_breakdown.map((c) => ({ label: c.category, value: c.value, right: money(c.value) }))}
        />
      </div>
    </>
  )
}

// ── Generic table ────────────────────────────────────────────────────────────

function Table({ title, head, rows, empty }: {
  title: string
  head: string[]
  rows: ReactNode[][]
  empty: string
}) {
  return (
    <div className={styles.panel}>
      <p className={styles.panelTitle}>{title}</p>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className={styles.emptyCell} colSpan={head.length}>{empty}</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
