import { useState, type FormEvent } from 'react'
import { createPartyMaster } from '../../services/partyMasterApi'
import type { PartyMaster } from '../../types/partyMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type Props = {
  onClose: () => void
  onCreated: (customer: PartyMaster) => void
  /** Pre-fill name or mobile from what was typed in the search box. */
  initialName?: string
  initialMobile?: string
}

/** Compact "create a customer on the fly" modal used from the Sales Bill screen. */
export function QuickAddCustomerModal({ onClose, onCreated, initialName, initialMobile }: Props) {
  const [name, setName] = useState(initialName ?? '')
  const [mobile, setMobile] = useState(initialMobile ?? '')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!name.trim()) {
      setErr('Customer name is required.')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        party_name: name.trim(),
        party_type: 'Customer',
        is_active: true,
      }
      if (mobile.trim()) body.mobile = mobile.trim()
      if (email.trim()) body.email = email.trim()
      if (city.trim()) body.city = city.trim()
      const created = await createPartyMaster(body)
      onCreated(created)
      onClose()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Failed to create customer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qac-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="qac-title">Add Customer</h2>
            <p>Only <strong>name</strong> is required. Mobile helps you find them next time.</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <form className={styles.modalForm} onSubmit={submit}>
          <div className={styles.modalBody}>
            {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}
            <div className={styles.formGrid}>
              <div className={`${styles.formField} ${styles.formFieldFull}`}>
                <label htmlFor="qac-name">Customer Name *</label>
                <input id="qac-name" className={styles.searchInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" autoFocus />
              </div>
              <div className={styles.formField}>
                <label htmlFor="qac-mobile">Mobile</label>
                <input id="qac-mobile" className={styles.searchInput} type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="e.g. 9123456789" />
              </div>
              <div className={styles.formField}>
                <label htmlFor="qac-email">Email</label>
                <input id="qac-email" className={styles.searchInput} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="optional" />
              </div>
              <div className={styles.formField}>
                <label htmlFor="qac-city">City</label>
                <input id="qac-city" className={styles.searchInput} value={city} onChange={(e) => setCity(e.target.value)} placeholder="optional" />
              </div>
            </div>
          </div>
          <div className={styles.modalFoot}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Saving…' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
