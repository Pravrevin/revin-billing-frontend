import { useState } from 'react'
import { createUser, updateUser, type AdminUser } from '../../services/adminApi'
import styles from './admin.module.css'

type Props = {
  pharmacyId: number
  /** When set, the modal edits this user (reset password / rename) instead of creating. */
  editUser?: AdminUser
  onClose: () => void
  onSaved: () => void
}

export function UserFormModal({ pharmacyId, editUser, onClose, onSaved }: Props) {
  const isEdit = Boolean(editUser)
  const [username, setUsername] = useState(editUser?.username ?? '')
  const [fullName, setFullName] = useState(editUser?.full_name ?? '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async () => {
    setError('')
    if (!isEdit && (!username.trim() || !password)) {
      setError('Username and password are required.')
      return
    }
    setSaving(true)
    try {
      if (isEdit && editUser) {
        await updateUser(editUser.id, {
          full_name: fullName.trim() || undefined,
          password: password ? password : undefined,
        })
      } else {
        await createUser(pharmacyId, {
          username: username.trim(),
          password,
          full_name: fullName.trim() || undefined,
        })
      }
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save user.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <h3 className={styles.modalTitle}>{isEdit ? `Edit ${editUser?.username}` : 'Add user'}</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className={styles.field} style={{ marginBottom: '0.75rem' }}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            value={username}
            disabled={isEdit}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. citycare.cashier"
          />
        </div>
        <div className={styles.field} style={{ marginBottom: '0.75rem' }}>
          <label className={styles.label}>Full name</label>
          <input
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="optional"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>
            {isEdit ? 'New password (leave blank to keep)' : 'Password'}
          </label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions} style={{ marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button className={styles.btnGhost} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.btn} onClick={onSubmit} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save' : 'Create user'}
          </button>
        </div>
      </div>
    </div>
  )
}
