import { useState, type FormEvent } from 'react'
import { SearchableSelect } from '../ui/SearchableSelect'
import { INDIA_STATES, INDIA_STATE_CITIES } from '../../data/indiaCities'
import { createPartyMaster } from '../../services/partyMasterApi'
import styles from '../../pages/ProductMasterPage.module.css'

type FormState = {
  party_name: string
  mobile: string
  email: string
  address: string
  state: string
  city: string
  pincode: string
  gstin: string
  drug_license_no: string
  pan_card: string
  credit_limit: string
  credit_days: string
  opening_balance: string
  is_active: boolean
  bank_name: string
  account_number: string
  ifsc_code: string
  bank_branch: string
  account_type: string
}

const initialForm: FormState = {
  party_name: '',
  mobile: '',
  email: '',
  address: '',
  state: '',
  city: '',
  pincode: '',
  gstin: '',
  drug_license_no: '',
  pan_card: '',
  credit_limit: '',
  credit_days: '',
  opening_balance: '',
  is_active: true,
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  bank_branch: '',
  account_type: '',
}

function buildPayload(f: FormState): Record<string, unknown> {
  const name = f.party_name.trim()
  if (!name) throw new Error('Party name is required.')

  const body: Record<string, unknown> = {
    party_name: name,
    party_type: 'Distributor',
    is_active: f.is_active,
  }

  const addStr = (key: string, v: string) => {
    const t = v.trim()
    if (t) body[key] = t
  }
  const addNum = (key: string, v: string) => {
    const t = v.trim()
    if (!t) return
    const n = Number.parseFloat(t)
    if (!Number.isNaN(n)) body[key] = n
  }
  const addInt = (key: string, v: string) => {
    const t = v.trim()
    if (!t) return
    const n = Number.parseInt(t, 10)
    if (!Number.isNaN(n)) body[key] = n
  }

  addStr('mobile', f.mobile)
  addStr('email', f.email)
  addStr('address', f.address)
  addStr('state', f.state)
  addStr('city', f.city)
  addStr('pincode', f.pincode)
  addStr('gstin', f.gstin)
  addStr('drug_license_no', f.drug_license_no)
  addStr('pan_card', f.pan_card)
  addNum('credit_limit', f.credit_limit)
  addInt('credit_days', f.credit_days)
  addNum('opening_balance', f.opening_balance)

  const bankName = f.bank_name.trim()
  const accountNumber = f.account_number.trim()
  const ifscCode = f.ifsc_code.trim()
  const bankBranch = f.bank_branch.trim()
  const accountType = f.account_type.trim()

  if (bankName || accountNumber || ifscCode || bankBranch || accountType) {
    const bankDetails: Record<string, string> = {}
    if (bankName) bankDetails.bank_name = bankName
    if (accountNumber) bankDetails.account_number = accountNumber
    if (ifscCode) bankDetails.ifsc_code = ifscCode
    if (bankBranch) bankDetails.branch = bankBranch
    if (accountType) bankDetails.account_type = accountType
    body.bank_details = bankDetails
  }

  return body
}

type Props = {
  onClose: () => void
  onCreated: () => void
}

export function AddSupplierModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const patch =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))

  function handleStateChange(val: string) {
    setForm((prev) => ({ ...prev, state: val, city: '' }))
  }

  const cityOptions = form.state ? (INDIA_STATE_CITIES[form.state] ?? []) : []

  const inp = (k: keyof FormState, placeholder: string, type = 'text') => (
    <input
      id={`add-supplier-${k}`}
      className={styles.searchInput}
      type={type}
      value={String(form[k])}
      onChange={(e) => patch(k)(e.target.value as FormState[typeof k])}
      placeholder={placeholder}
      autoComplete="off"
    />
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setErr(null)
    setSaving(true)
    try {
      const payload = buildPayload(form)
      await createPartyMaster(payload)
      setSuccess(true)
      setForm(initialForm)
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to create supplier')
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
        aria-labelledby="add-supplier-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHead}>
          <div className={styles.modalHeadMain}>
            <h2 id="add-supplier-title">Add Supplier</h2>
            <p>Only <strong>party name</strong> is required. All other fields are optional.</p>
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
                Supplier created successfully!
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
                <h3 className={styles.sectionTitle}>Basic Info</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-party_name">
                      <span className={styles.fieldLabelTitle}>
                        Party Name <span className={styles.keyRequired}>*</span>
                      </span>
                      <span className={styles.fieldLabelKey}>party_name</span>
                    </label>
                    <input
                      id="add-supplier-party_name"
                      className={styles.searchInput}
                      value={form.party_name}
                      onChange={(e) => patch('party_name')(e.target.value)}
                      placeholder="e.g. Medsup Pharma Distributors"
                      autoComplete="off"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-mobile">
                      <span className={styles.fieldLabelTitle}>Mobile</span>
                      <span className={styles.fieldLabelKey}>mobile</span>
                    </label>
                    {inp('mobile', 'e.g. 9123456789', 'tel')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-email">
                      <span className={styles.fieldLabelTitle}>Email</span>
                      <span className={styles.fieldLabelKey}>email</span>
                    </label>
                    {inp('email', 'e.g. supplier@example.com', 'email')}
                  </div>
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Address</h3>
                <div className={styles.formGrid}>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-address">
                      <span className={styles.fieldLabelTitle}>Address</span>
                      <span className={styles.fieldLabelKey}>address</span>
                    </label>
                    {inp('address', 'e.g. 45, Industrial Area')}
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-state">
                      <span className={styles.fieldLabelTitle}>State</span>
                      <span className={styles.fieldLabelKey}>state</span>
                    </label>
                    <SearchableSelect
                      id="add-supplier-state"
                      options={INDIA_STATES}
                      value={form.state}
                      onChange={handleStateChange}
                      placeholder="Search & select state…"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-city">
                      <span className={styles.fieldLabelTitle}>City</span>
                      <span className={styles.fieldLabelKey}>city</span>
                    </label>
                    <SearchableSelect
                      id="add-supplier-city"
                      options={cityOptions}
                      value={form.city}
                      onChange={(val) => patch('city')(val)}
                      placeholder={form.state ? 'Search & select city…' : 'Select state first'}
                      disabled={!form.state}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-pincode">
                      <span className={styles.fieldLabelTitle}>Pincode</span>
                      <span className={styles.fieldLabelKey}>pincode</span>
                    </label>
                    {inp('pincode', 'e.g. 641001')}
                  </div>
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Compliance</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-gstin">
                      <span className={styles.fieldLabelTitle}>GSTIN</span>
                      <span className={styles.fieldLabelKey}>gstin</span>
                    </label>
                    {inp('gstin', 'e.g. 33AABCM1234R1ZY')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-drug_license_no">
                      <span className={styles.fieldLabelTitle}>Drug License No.</span>
                      <span className={styles.fieldLabelKey}>drug_license_no</span>
                    </label>
                    {inp('drug_license_no', 'e.g. TN-DL-2024-00123')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-pan_card">
                      <span className={styles.fieldLabelTitle}>PAN Card</span>
                      <span className={styles.fieldLabelKey}>pan_card</span>
                    </label>
                    {inp('pan_card', 'e.g. AABCM1234R')}
                  </div>
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Credit & Balance</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-credit_limit">
                      <span className={styles.fieldLabelTitle}>Credit Limit (₹)</span>
                      <span className={styles.fieldLabelKey}>credit_limit</span>
                    </label>
                    {inp('credit_limit', 'e.g. 200000', 'number')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-credit_days">
                      <span className={styles.fieldLabelTitle}>Credit Days</span>
                      <span className={styles.fieldLabelKey}>credit_days</span>
                    </label>
                    {inp('credit_days', 'e.g. 30', 'number')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-opening_balance">
                      <span className={styles.fieldLabelTitle}>Opening Balance (₹)</span>
                      <span className={styles.fieldLabelKey}>opening_balance</span>
                    </label>
                    {inp('opening_balance', 'e.g. 15000', 'number')}
                  </div>
                  <div className={`${styles.formField} ${styles.formFieldFull}`}>
                    <div className={styles.fieldHeader}>
                      <span className={styles.fieldLabelTitle}>Active</span>
                      <span className={styles.fieldLabelKey}>is_active</span>
                    </div>
                    <label className={styles.checkRow} htmlFor="add-supplier-is_active">
                      <input
                        id="add-supplier-is_active"
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => patch('is_active')(e.target.checked)}
                      />
                      <span>Yes</span>
                    </label>
                  </div>
                </div>
              </section>

              <section>
                <h3 className={styles.sectionTitle}>Bank Details</h3>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-bank_name">
                      <span className={styles.fieldLabelTitle}>Bank Name</span>
                      <span className={styles.fieldLabelKey}>bank_details.bank_name</span>
                    </label>
                    {inp('bank_name', 'e.g. State Bank of India')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-account_number">
                      <span className={styles.fieldLabelTitle}>Account Number</span>
                      <span className={styles.fieldLabelKey}>bank_details.account_number</span>
                    </label>
                    {inp('account_number', 'e.g. 1234567890')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-ifsc_code">
                      <span className={styles.fieldLabelTitle}>IFSC Code</span>
                      <span className={styles.fieldLabelKey}>bank_details.ifsc_code</span>
                    </label>
                    {inp('ifsc_code', 'e.g. SBIN0001234')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-bank_branch">
                      <span className={styles.fieldLabelTitle}>Branch</span>
                      <span className={styles.fieldLabelKey}>bank_details.branch</span>
                    </label>
                    {inp('bank_branch', 'e.g. Coimbatore Main Branch')}
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel} htmlFor="add-supplier-account_type">
                      <span className={styles.fieldLabelTitle}>Account Type</span>
                      <span className={styles.fieldLabelKey}>bank_details.account_type</span>
                    </label>
                    {inp('account_type', 'e.g. Current')}
                  </div>
                </div>
              </section>
            </div>

            <div className={styles.modalFoot}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={saving}>
                {saving ? 'Saving…' : 'Add Supplier'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
