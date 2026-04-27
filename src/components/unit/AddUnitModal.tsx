import { useState, type FormEvent } from 'react'
import { createUnit } from '../../services/unitMasterApi'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  unit_name: string
  is_active: boolean
}

const initialForm: FormState = {
  unit_name: '',
  is_active: true,
}

function buildPayload(f: FormState): { unit_name: string; is_active: boolean } {
  const unitName = f.unit_name.trim()
  if (!unitName) throw new Error('Unit name is required.')
  return {
    unit_name: unitName,
    is_active: f.is_active,
  }
}

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function AddUnitModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const patch =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = buildPayload(form)
      await createUnit(payload)
      setSuccess(true)
      setForm(initialForm)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create unit')
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
        className={`${styles.modal} ${styles.modalWide}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-unit-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="add-unit-title">Add Unit</h2>
            <p>Only <strong>unit name</strong> is required.</p>
          </div>
          <button type="button" className={styles.closeX} onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {success ? (
          <>
            <div className={styles.modalBody}>
              <div
                className={styles.banner}
                style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}
              >
                Unit created successfully!
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button type="button" className={styles.btnGhost} onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => setSuccess(false)}
              >
                Add Another
              </button>
            </div>
          </>
        ) : (
          <form className={styles.modalForm} onSubmit={submit}>
            <div className={styles.modalBody}>
              {err ? <div className={`${styles.banner} ${styles.bannerError}`}>{err}</div> : null}

              <section>
                <h3 className={styles.sectionTitle}>Unit Info</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.fieldLabel} htmlFor="add-unit-name">
                      <span className={styles.fieldLabelTitle}>
                        Unit Name <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>unit_name</span>
                    </label>
                    <input
                      id="add-unit-name"
                      className={styles.searchInput}
                      value={form.unit_name}
                      onChange={(e) => patch('unit_name')(e.target.value)}
                      placeholder="e.g. Tablet"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <div className={styles.fieldHeader}>
                      <span className={styles.fieldLabelTitle}>Active</span>
                      <span className={styles.fieldLabelKey}>is_active</span>
                    </div>
                    <label className={styles.checkRow} htmlFor="add-unit-is_active">
                      <input
                        id="add-unit-is_active"
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => patch('is_active')(e.target.checked)}
                      />
                      <span>Yes</span>
                    </label>
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.modalFoot}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Add Unit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
