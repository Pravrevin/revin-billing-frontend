import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MENUS } from '../../data/menus'
import { globalInsights, type GlobalInsights, type MenuUsage } from '../../services/adminApi'
import styles from './admin.module.css'

const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function menuUsageLabel(u: MenuUsage): string {
  const menu = MENUS.find((m) => m.id === u.menu_id)
  if (!menu) return `Menu ${u.menu_id}`
  if (u.sub_id == null) return menu.label
  const sub = menu.subs.find((s) => s.id === u.sub_id)
  return `${menu.label} › ${sub?.label ?? `#${u.sub_id}`}`
}

export function InsightsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<GlobalInsights | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    globalInsights()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className={styles.muted}>Loading…</p>
  if (error) return <p className={styles.error}>{error}</p>
  if (!data) return null

  return (
    <div>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Insights</h1>
        <p className={styles.pageSub}>Performance across all pharmacies you manage.</p>
      </div>

      <div className={styles.card}>
        <div className={styles.metrics}>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Pharmacies</div>
            <div className={styles.metricValue}>{data.pharmacy_count}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Active</div>
            <div className={styles.metricValue}>{data.active_pharmacy_count}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Total sales</div>
            <div className={styles.metricValue}>{money(data.totals.sales_total)}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Total invoices</div>
            <div className={styles.metricValue}>{data.totals.sales_count}</div>
          </div>
          <div className={styles.metric}>
            <div className={styles.metricLabel}>Total purchases</div>
            <div className={styles.metricValue}>{money(data.totals.purchase_total)}</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Per-pharmacy performance</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Pharmacy</th>
              <th>Sales</th>
              <th>Invoices</th>
              <th>Purchases</th>
              <th>Items</th>
              <th>Users</th>
            </tr>
          </thead>
          <tbody>
            {data.per_pharmacy.map((p) => (
              <tr
                key={p.id}
                className={styles.rowLink}
                onClick={() => navigate(`/admin/pharmacies/${p.id}`)}
              >
                <td>
                  {p.name}{' '}
                  {!p.is_active && (
                    <span className={`${styles.badge} ${styles.badgeOff}`}>Disabled</span>
                  )}
                </td>
                <td>{money(p.sales_total)}</td>
                <td>{p.sales_count}</td>
                <td>{money(p.purchase_total)}</td>
                <td>{p.item_count}</td>
                <td>{p.user_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Most used menus (all pharmacies)</h2>
        {data.top_menus.length === 0 ? (
          <p className={styles.muted}>No menu activity recorded yet.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Menu</th>
                <th>Opens</th>
              </tr>
            </thead>
            <tbody>
              {data.top_menus.map((u, i) => (
                <tr key={i}>
                  <td>{menuUsageLabel(u)}</td>
                  <td>{u.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
