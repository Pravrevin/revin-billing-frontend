import { useCallback, useEffect, useState } from 'react'
import { fetchItemMasters } from '../services/itemMasterApi'
import type { ItemMaster } from '../types/itemMaster'
import styles from './ProductMasterPage.module.css'

function scheduleBadgeClass(schedule: string): string {
  const s = schedule?.toUpperCase() || ''
  if (s === 'H' || s.includes('H1')) return styles.badgeH
  if (s === 'OTC') return styles.badgeOtc
  return styles.badgeRx
}

export function ItemMasterHistoryPage() {
  const [items, setItems] = useState<ItemMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchItemMasters()
      const sorted = [...data].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
      setItems(sorted)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load items')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.titleBlock}>
          <h1>Items History</h1>
          <p>All items sorted by most recently updated. Shows creation and last modification timestamps.</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.btnMuted} onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className={`${styles.banner} ${styles.bannerError}`}>
          {error}{' '}
          <button type="button" className={styles.resetLink} onClick={() => void load()}>
            Retry
          </button>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loading}>Loading history…</div>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Code</th>
                  <th>Item Name</th>
                  <th>Brand / Generic</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {!items.length ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}
                    >
                      No items found.
                    </td>
                  </tr>
                ) : null}
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{idx + 1}</td>
                    <td>
                      <strong>{item.item_code}</strong>
                      {item.sku_code ? (
                        <div className={styles.nameSub}>{item.sku_code}</div>
                      ) : null}
                    </td>
                    <td className={styles.nameCell}>
                      <div className={styles.nameMain}>{item.item_name}</div>
                      <div className={styles.nameSub}>{item.dosage_form} · {item.strength}</div>
                    </td>
                    <td>
                      <div>{item.brand_name || '—'}</div>
                      <div className={styles.nameSub}>{item.generic_name || '—'}</div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${scheduleBadgeClass(item.schedule_type)}`}>
                        {item.schedule_type || '—'}
                      </span>
                    </td>
                    <td>
                      {item.is_active ? (
                        <span className={`${styles.badge} ${styles.badgeOtc}`}>Active</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeOff}`}>Inactive</span>
                      )}
                    </td>
                    <td className={styles.nameSub}>
                      {new Date(item.created_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className={styles.nameSub}>
                      {new Date(item.updated_at).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && items.length > 0 ? (
        <div className={styles.filterMeta} style={{ marginTop: '0.75rem' }}>
          <span className={styles.chip}>
            <strong>{items.length}</strong> items total
          </span>
        </div>
      ) : null}
    </div>
  )
}
