import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MENUS } from '../../data/menus'
import {
  getPharmacy,
  listPharmacyUsers,
  pharmacyInsights,
  updatePharmacy,
  updateUser,
  type AdminUser,
  type MenuUsage,
  type Pharmacy,
  type PharmacyInsights,
} from '../../services/adminApi'
import { PermissionsEditor } from './PermissionsEditor'
import { UserFormModal } from './UserFormModal'
import styles from './admin.module.css'

const money = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function menuUsageLabel(u: MenuUsage): string {
  const menu = MENUS.find((m) => m.id === u.menu_id)
  if (!menu) return `Menu ${u.menu_id}`
  if (u.sub_id == null) return menu.label
  const sub = menu.subs.find((s) => s.id === u.sub_id)
  return `${menu.label} › ${sub?.label ?? `#${u.sub_id}`}`
}

export function PharmacyDetailPage() {
  const { id } = useParams()
  const pharmacyId = Number(id)

  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [insights, setInsights] = useState<PharmacyInsights | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [showAdd, setShowAdd] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [permUser, setPermUser] = useState<AdminUser | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      getPharmacy(pharmacyId),
      listPharmacyUsers(pharmacyId),
      pharmacyInsights(pharmacyId),
    ])
      .then(([p, u, ins]) => {
        setPharmacy(p)
        setUsers(u)
        setInsights(ins)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [pharmacyId])

  useEffect(load, [load])

  const togglePharmacy = async () => {
    if (!pharmacy) return
    try {
      const updated = await updatePharmacy(pharmacy.id, { is_active: !pharmacy.is_active })
      setPharmacy(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update pharmacy.')
    }
  }

  const toggleUser = async (u: AdminUser) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update user.')
    }
  }

  if (loading) return <p className={styles.muted}>Loading…</p>
  if (!pharmacy) return <p className={styles.error}>{error || 'Pharmacy not found.'}</p>

  const m = insights?.metrics

  return (
    <div>
      <div className={styles.pageHead}>
        <Link to="/admin/pharmacies" className={styles.muted}>
          ← All pharmacies
        </Link>
        <h1 className={styles.pageTitle} style={{ marginTop: '0.4rem' }}>
          {pharmacy.name}{' '}
          <span className={`${styles.badge} ${pharmacy.is_active ? styles.badgeOn : styles.badgeOff}`}>
            {pharmacy.is_active ? 'Active' : 'Disabled'}
          </span>
        </h1>
        <p className={styles.pageSub}>
          {pharmacy.code ? `Code ${pharmacy.code} · ` : ''}
          {pharmacy.phone || 'No phone'}
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      {m && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Performance</h2>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Sales total</div>
              <div className={styles.metricValue}>{money(m.sales_total)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Invoices</div>
              <div className={styles.metricValue}>{m.sales_count}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Purchases</div>
              <div className={styles.metricValue}>{money(m.purchase_total)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Expenses</div>
              <div className={styles.metricValue}>{money(m.expense_total)}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Items</div>
              <div className={styles.metricValue}>{m.item_count}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>Users</div>
              <div className={styles.metricValue}>{m.user_count}</div>
            </div>
          </div>

          {insights && insights.top_menus.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '0.95rem', margin: '0 0 0.5rem' }}>Most used menus</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Menu</th>
                    <th>Opens</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.top_menus.map((u, i) => (
                    <tr key={i}>
                      <td>{menuUsageLabel(u)}</td>
                      <td>{u.hits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className={styles.cardTitle} style={{ margin: 0 }}>Users</h2>
          <div className={styles.actions}>
            <button className={styles.btnGhost} onClick={togglePharmacy}>
              {pharmacy.is_active ? 'Disable pharmacy' : 'Enable pharmacy'}
            </button>
            <button className={styles.btn} onClick={() => setShowAdd(true)}>
              + Add user
            </button>
          </div>
        </div>

        {users.length === 0 ? (
          <p className={styles.muted} style={{ marginTop: '0.75rem' }}>
            No users yet. Add one and assign menu access.
          </p>
        ) : (
          <table className={styles.table} style={{ marginTop: '0.75rem' }}>
            <thead>
              <tr>
                <th>Username</th>
                <th>Name</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.username}</td>
                  <td>{u.full_name || '—'}</td>
                  <td>
                    <span className={`${styles.badge} ${u.is_active ? styles.badgeOn : styles.badgeOff}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.btnGhost} onClick={() => setPermUser(u)}>
                        Permissions
                      </button>
                      <button className={styles.btnGhost} onClick={() => setEditUser(u)}>
                        Edit
                      </button>
                      <button
                        className={`${styles.btnGhost} ${u.is_active ? '' : ''}`}
                        onClick={() => toggleUser(u)}
                      >
                        {u.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <UserFormModal
          pharmacyId={pharmacyId}
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}
      {editUser && (
        <UserFormModal
          pharmacyId={pharmacyId}
          editUser={editUser}
          onClose={() => setEditUser(null)}
          onSaved={load}
        />
      )}
      {permUser && (
        <PermissionsEditor
          userId={permUser.id}
          username={permUser.username}
          onClose={() => setPermUser(null)}
          onSaved={load}
        />
      )}
    </div>
  )
}
