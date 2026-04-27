import { useState, type FormEvent } from 'react'
import { createBrand } from '../../services/brandMasterApi'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  brand_name: string
  is_active: boolean
}

const initialForm: FormState = {
  brand_name: '',
  is_active: true,
}

function buildPayload(f: FormState): { brand_name: string; is_active: boolean } {
  const brandName = f.brand_name.trim()
  if (!brandName) throw new Error('Brand name is required.')
  return {
    brand_name: brandName,
    is_active: f.is_active,
  }
}

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function AddBrandModal({ onClose, onCreated }: Props) {
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
      await createBrand(payload)
      setSuccess(true)
      setForm(initialForm)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create brand')
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
        aria-labelledby="add-brand-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="add-brand-title">Add Brand</h2>
            <p>Only <strong>brand name</strong> is required.</p>
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
                Brand created successfully!
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
                <h3 className={styles.sectionTitle}>Brand Info</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.fieldLabel} htmlFor="add-brand-name">
                      <span className={styles.fieldLabelTitle}>
                        Brand Name <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>brand_name</span>
                    </label>
                    <input
                      id="add-brand-name"
                      className={styles.searchInput}
                      value={form.brand_name}
                      onChange={(e) => patch('brand_name')(e.target.value)}
                      placeholder="e.g. Crocin"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <div className={styles.fieldHeader}>
                      <span className={styles.fieldLabelTitle}>Active</span>
                      <span className={styles.fieldLabelKey}>is_active</span>
                    </div>
                    <label className={styles.checkRow} htmlFor="add-brand-is_active">
                      <input
                        id="add-brand-is_active"
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
                {saving ? 'Saving…' : 'Add Brand'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
