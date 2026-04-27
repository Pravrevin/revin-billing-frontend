import { useEffect, useState, type FormEvent } from 'react'
import { createSubCategory, fetchCategories } from '../../services/categoryMasterApi'
import type { CategoryMaster } from '../../types/categoryMaster'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  sub_category_name: string
  category_id: number | ''
  description: string
  is_active: boolean
}

const initialForm: FormState = {
  sub_category_name: '',
  category_id: '',
  description: '',
  is_active: true,
}

function buildPayload(f: FormState): { sub_category_name: string; category_id: number; description?: string; is_active: boolean } {
  const name = f.sub_category_name.trim()
  if (!name) throw new Error('Sub-category name is required.')
  if (!f.category_id) throw new Error('Parent category is required.')
  return {
    sub_category_name: name,
    category_id: Number(f.category_id),
    ...(f.description.trim() ? { description: f.description.trim() } : {}),
    is_active: f.is_active,
  }
}

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function AddSubCategoryModal({ onClose, onCreated }: Props) {
  const [categories, setCategories] = useState<CategoryMaster[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [loadingCats, setLoadingCats] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const patch =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  useEffect(() => {
    let cancelled = false
    async function loadCategories() {
      setLoadingCats(true)
      try {
        const data = await fetchCategories()
        if (!cancelled) setCategories(data)
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Could not load categories')
      } finally {
        if (!cancelled) setLoadingCats(false)
      }
    }
    void loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = buildPayload(form)
      await createSubCategory(payload)
      setSuccess(true)
      setForm(initialForm)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create sub-category')
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
        aria-labelledby="add-sub-category-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="add-sub-category-title">Add Sub-Category</h2>
            <p>
              Add sub-category under a parent category. Code is auto-generated.
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
                Sub-category created successfully!
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
                <h3 className={styles.sectionTitle}>Sub-Category Info</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-sub-category-parent">
                      <span className={styles.fieldLabelTitle}>
                        Parent Category <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>category_id</span>
                    </label>
                    <select
                      id="add-sub-category-parent"
                      className={styles.select}
                      value={form.category_id}
                      onChange={(e) => patch('category_id')(e.target.value ? Number(e.target.value) : '')}
                      disabled={loadingCats}
                    >
                      <option value="">{loadingCats ? 'Loading categories…' : 'Select category…'}</option>
                      {categories.filter((c) => c.is_active).map((c) => (
                        <option key={c.id} value={c.id}>{c.category_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-sub-category-name">
                      <span className={styles.fieldLabelTitle}>
                        Sub-Category Name <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>sub_category_name</span>
                    </label>
                    <input
                      id="add-sub-category-name"
                      className={styles.searchInput}
                      value={form.sub_category_name}
                      onChange={(e) => patch('sub_category_name')(e.target.value)}
                      placeholder="e.g. Topical Analgesics"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.fieldLabel} htmlFor="add-sub-category-description">
                      <span className={styles.fieldLabelTitle}>Description</span>
                      <span className={styles.fieldLabelKey}>description</span>
                    </label>
                    <textarea
                      id="add-sub-category-description"
                      className={styles.searchInput}
                      value={form.description}
                      onChange={(e) => patch('description')(e.target.value)}
                      placeholder="Pain relief creams, gels, and patches"
                      rows={3}
                    />
                  </div>

                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <div className={styles.fieldHeader}>
                      <span className={styles.fieldLabelTitle}>Active</span>
                      <span className={styles.fieldLabelKey}>is_active</span>
                    </div>
                    <label className={styles.checkRow} htmlFor="add-sub-category-is_active">
                      <input
                        id="add-sub-category-is_active"
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
              <button type="submit" className={styles.btnPrimary} disabled={saving || loadingCats}>
                {saving ? 'Saving…' : 'Add Sub-Category'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
