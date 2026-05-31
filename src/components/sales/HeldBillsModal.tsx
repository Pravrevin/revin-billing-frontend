import { useCallback, useEffect, useState } from 'react'
import { deleteHeldBill, fetchHeldBills } from '../../services/heldBillApi'
import type { HeldBill } from '../../types/heldBill'
import type { Sale } from '../../types/sales'
import { SalesBillingModal } from './SalesBillingModal'
import styles from '../../pages/ProductMasterPage.module.css'

function num(v: unknown): number {
  const n = Number.parseFloat(String(v ?? ''))
  return Number.isNaN(n) ? 0 : n
}
function inr(v: unknown): string {
  return `₹${num(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtWhen(s: string | null | undefined): string {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function HeldBillsModal({ onClose, onResumedSale }: {
  onClose: () => void
  onResumedSale?: (s: Sale) => void
}) {
  const [bills, setBills] = useState<HeldBill[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [resume, setResume] = useState<HeldBill | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      setBills(await fetchHeldBills())
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load held bills')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !resume) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, resume])

  async function discard(b: HeldBill) {
    setBusyId(b.id)
    try {
      await deleteHeldBill(b.id)
      await load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to discard')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className={styles.overlayFullscreen}>
      <div className={styles.fsHeader}>
        <button type="button" className={styles.fsHeaderBack} onClick={onClose}>← Back</button>
        <div className={styles.fsHeaderTitle}>
          <h2>⏸ Hold Bills</h2>
          <p>Parked bills waiting to be resumed — stock is only deducted when you process them</p>
        </div>
        <button type="button" className={styles.fsCloseBtn} onClick={onClose} aria-label="Close">×</button>
      </div>

      <div className={styles.fsBody}>
        {err ? <div className={`${styles.banner} ${styles.bannerError}`} style={{ marginBottom: '1rem' }}>{err}</div> : null}

        {loading ? (
          <div className={styles.loading}>Loading held bills…</div>
        ) : bills.length === 0 ? (
          <div
            style={{
              padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)',
              background: '#fff', border: '1px dashed var(--border-strong)', borderRadius: 16,
            }}
          >
            <div style={{ fontSize: '2.2rem' }}>🗒️</div>
            <h3 style={{ margin: '0.5rem 0 0.25rem', color: 'var(--text-strong)' }}>No bills on hold</h3>
            <p style={{ margin: 0 }}>Use “⏸ Hold Bill” inside a sales bill to park it here for later.</p>
          </div>
        ) : (
          <div className={styles.fsTableWrap}>
            <div className={styles.tableScroll}>
              <table className={styles.fsTable}>
                <thead>
                  <tr>
                    <th>Hold No</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Note</th>
                    <th>Held At</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.hold_no ?? `#${b.id}`}</strong></td>
                      <td>{b.customer_name || 'Walk-in'}</td>
                      <td className={styles.amtCell}>{b.item_count ?? b.payload?.rows?.filter((r) => r.item_id).length ?? 0}</td>
                      <td className={styles.amtCell}><strong>{inr(b.net_amount)}</strong></td>
                      <td style={{ color: 'var(--text-muted)', maxWidth: 220 }}>{b.note || '—'}</td>
                      <td>{fmtWhen(b.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={styles.btnPrimarySm}
                            onClick={() => setResume(b)}
                            disabled={busyId === b.id}
                          >
                            ▶ Resume
                          </button>
                          <button
                            type="button"
                            className={styles.linkBtnWarn}
                            style={{ border: '1px solid #fecaca', borderRadius: 8, padding: '0.3rem 0.6rem', background: '#fff' }}
                            onClick={() => void discard(b)}
                            disabled={busyId === b.id}
                          >
                            {busyId === b.id ? '…' : 'Discard'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {resume ? (
        <SalesBillingModal
          initialDraft={resume.payload}
          resumeHoldId={resume.id}
          onClose={() => setResume(null)}
          onCreated={(s) => { setResume(null); onResumedSale?.(s); void load() }}
          onHeld={() => { setResume(null); void load() }}
        />
      ) : null}
    </div>
  )
}
