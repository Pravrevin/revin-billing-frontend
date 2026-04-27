import { useState, type FormEvent } from 'react'
import { createPackagingMaster } from '../../services/packagingMasterApi'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  packing_type: string
  unit_primary: string
  unit_secondary: string
  is_active: boolean
}

const initialForm: FormState = {
  packing_type: '',
  unit_primary: '',
  unit_secondary: '',
  is_active: true,
}

function buildPayload(f: FormState): {
  packing_type: string
  unit_primary: string
  unit_secondary: string
  is_active: boolean
} {
  const packingType = f.packing_type.trim()
  const unitPrimary = f.unit_primary.trim()
  const unitSecondary = f.unit_secondary.trim()
  if (!packingType) throw new Error('Packing type is required.')
  if (!unitPrimary) throw new Error('Primary unit is required.')
  if (!unitSecondary) throw new Error('Secondary unit is required.')
  return {
    packing_type: packingType,
    unit_primary: unitPrimary,
    unit_secondary: unitSecondary,
    is_active: f.is_active,
  }
}

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function AddPackagingModal({ onClose, onCreated }: Props) {
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
      await createPackagingMaster(payload)
      setSuccess(true)
      setForm(initialForm)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create packaging')
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
        aria-labelledby="add-packaging-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="add-packaging-title">Create Packaging</h2>
            <p>
              Add packing type and units. All fields except active flag are required.
            </p>
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
                Packaging created successfully!
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
                <h3 className={styles.sectionTitle}>Packaging Info</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-packaging-type">
                      <span className={styles.fieldLabelTitle}>
                        Packing Type <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>packing_type</span>
                    </label>
                    <input
                      id="add-packaging-type"
                      className={styles.searchInput}
                      value={form.packing_type}
                      onChange={(e) => patch('packing_type')(e.target.value)}
                      placeholder="e.g. Strip"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-packaging-unit-primary">
                      <span className={styles.fieldLabelTitle}>
                        Primary Unit <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>unit_primary</span>
                    </label>
                    <input
                      id="add-packaging-unit-primary"
                      className={styles.searchInput}
                      value={form.unit_primary}
                      onChange={(e) => patch('unit_primary')(e.target.value)}
                      placeholder="e.g. Strip"
                      autoComplete="off"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-packaging-unit-secondary">
                      <span className={styles.fieldLabelTitle}>
                        Secondary Unit <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>unit_secondary</span>
                    </label>
                    <input
                      id="add-packaging-unit-secondary"
                      className={styles.searchInput}
                      value={form.unit_secondary}
                      onChange={(e) => patch('unit_secondary')(e.target.value)}
                      placeholder="e.g. Tablet"
                      autoComplete="off"
                    />
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <div className={styles.fieldHeader}>
                      <span className={styles.fieldLabelTitle}>Active</span>
                      <span className={styles.fieldLabelKey}>is_active</span>
                    </div>
                    <label className={styles.checkRow} htmlFor="add-packaging-is_active">
                      <input
                        id="add-packaging-is_active"
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
                {saving ? 'Saving…' : 'Create Packaging'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
