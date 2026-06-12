import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createPharmacy,
  listPharmacies,
  type Pharmacy,
} from '../../services/adminApi'
import styles from './admin.module.css'

export function PharmaciesPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<Pharmacy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    listPharmacies()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const onCreate = async () => {
    if (!name.trim()) {
      setError('Pharmacy name is required.')
      return
    }
    setCreating(true)
    setError('')
    try {
      await createPharmacy({
        name: name.trim(),
        code: code.trim() || undefined,
        phone: phone.trim() || undefined,
      })
      setName('')
      setCode('')
      setPhone('')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create pharmacy.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div>
      <div className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Pharmacies</h1>
        <p className={styles.pageSub}>Onboard a client, then add its users and menu access.</p>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Add a pharmacy</h2>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Pharmacy name *</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City Care Pharmacy"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Code</label>
            <input
              className={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CITY01"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Phone</label>
            <input
              className={styles.input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="optional"
            />
          </div>
          <button className={styles.btn} onClick={onCreate} disabled={creating}>
            {creating ? 'Adding…' : 'Add pharmacy'}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>All pharmacies</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No pharmacies yet. Add your first client above.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Users</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className={styles.rowLink}
                  onClick={() => navigate(`/admin/pharmacies/${p.id}`)}
                >
                  <td>{p.name}</td>
                  <td>{p.code || '—'}</td>
                  <td>{p.user_count}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${p.is_active ? styles.badgeOn : styles.badgeOff}`}
                    >
                      {p.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
