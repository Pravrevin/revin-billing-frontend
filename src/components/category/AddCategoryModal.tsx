import { useState, type FormEvent } from 'react'
import { createCategory } from '../../services/categoryMasterApi'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  category_name: string
}

const initialForm: FormState = {
  category_name: '',
}

function buildPayload(f: FormState): { category_name: string } {
  const name = f.category_name.trim()
  if (!name) throw new Error('Category name is required.')
  return {
    category_name: name,
  }
}

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function AddCategoryModal({ onClose, onCreated }: Props) {
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
      await createCategory(payload)
      setSuccess(true)
      setForm(initialForm)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create category')
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
        aria-labelledby="add-category-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="add-category-title">Add Category</h2>
            <p>Only <strong>category name</strong> is required. Code is auto-generated (CAT0001, CAT0002…)</p>
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
                Category created successfully!
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
                <h3 className={styles.sectionTitle}>Category Info</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.fieldLabel} htmlFor="add-category-name">
                      <span className={styles.fieldLabelTitle}>
                        Category Name <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>category_name</span>
                    </label>
                    <input
                      id="add-category-name"
                      className={styles.searchInput}
                      value={form.category_name}
                      onChange={(e) => patch('category_name')(e.target.value)}
                      placeholder="e.g. Analgesics"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.modalFoot}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Add Category'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
