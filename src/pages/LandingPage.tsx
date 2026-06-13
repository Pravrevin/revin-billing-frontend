import { useState, type CSSProperties, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthModal, type AuthMode } from '../components/auth/AuthModal'
import styles from './LandingPage.module.css'

const ICONS: Record<string, ReactNode> = {
  sales: (
    <>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </>
  ),
  purchase: (
    <>
      <path d="M1 6h13v9H1z" />
      <path d="M14 9h4l3 3v3h-7z" />
      <circle cx="5.5" cy="17.5" r="1.6" />
      <circle cx="17.5" cy="17.5" r="1.6" />
    </>
  ),
  inventory: (
    <>
      <path d="M12 2 2 7l10 5 10-5-10-5z" />
      <path d="m2 12 10 5 10-5" />
      <path d="m2 17 10 5 10-5" />
    </>
  ),
  parties: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </>
  ),
  customers: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  stores: (
    <>
      <path d="M3 9 4.5 4h15L21 9" />
      <path d="M3 9h18v1.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" />
      <path d="M4.5 11v10h15V11" />
      <path d="M9.5 21v-5h5v5" />
    </>
  ),
}

const MODULES = [
  {
    id: 'sales',
    c: '#0d9488',
    t: 'Sales',
    d: 'Lightning-fast counter billing with held bills, returns & day summary.',
  },
  {
    id: 'purchase',
    c: '#0284c7',
    t: 'Purchase',
    d: 'Log distributor bills, upload invoices and track supplier payments.',
  },
  {
    id: 'inventory',
    c: '#6366f1',
    t: 'Inventory',
    d: 'Batches, MRP, expiry alerts and rack-level stock that stays in sync.',
  },
  {
    id: 'parties',
    c: '#d97706',
    t: 'Parties',
    d: 'Customers & distributors with ledgers, credit limits and routes.',
  },
  {
    id: 'customers',
    c: '#e11d48',
    t: 'Customers',
    d: 'Quick-add profiles, purchase history and loyalty at the counter.',
  },
  {
    id: 'stores',
    c: '#059669',
    t: 'Multiple stores',
    d: 'Run a whole chain — switch outlets and roll up reports in one console.',
  },
]

export function LandingPage({ initialAuth }: { initialAuth?: AuthMode }) {
  const { isAuthenticated, isSuperadmin } = useAuth()
  const [authOpen, setAuthOpen] = useState(Boolean(initialAuth))
  const [authMode, setAuthMode] = useState<AuthMode>(initialAuth ?? 'store')

  if (isAuthenticated) {
    return <Navigate to={isSuperadmin ? '/admin' : '/app/dashboard'} replace />
  }

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.bgGrid} aria-hidden />
      <div className={styles.bgOrbs} aria-hidden />

      <header className={styles.header}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark}>＋</span>
          <span className={styles.logoText}>Revin Bill</span>
        </div>
        <div className={styles.headerCtas}>
          <button className={styles.ghostBtn} onClick={() => openAuth('admin')}>
            Admin
          </button>
          <button className={styles.solidBtn} onClick={() => openAuth('store')}>
            Store Login
          </button>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <h1 className={styles.title}>
            The complete OS for your{' '}
            <span className={styles.titleAccent}>medical store</span>
          </h1>
          <p className={styles.lead}>
            Sales, purchases, inventory, parties and customers — beautifully unified.
            Manage a single pharmacy or an entire chain from one calm workspace.
          </p>
          <div className={styles.ctaRow}>
            <button className={styles.primaryBtn} onClick={() => openAuth('store')}>
              Open store console
            </button>
            <button className={styles.outlineBtn} onClick={() => openAuth('signup')}>
              Register your store
            </button>
          </div>
          <ul className={styles.trust}>
            <li>Batch &amp; expiry aware</li>
            <li>GST-ready ledgers</li>
            <li>Multi-store rollups</li>
          </ul>
        </div>

        {/* Pure-CSS 3D medical store scene */}
        <div className={styles.scene} aria-hidden>
          <div className={styles.stage}>
            <div className={styles.shop}>
              <div className={styles.awning} />
              <div className={styles.shopFace}>
                <div className={styles.signboard}>
                  <span className={styles.cross}>＋</span>
                  <span className={styles.signText}>PHARMACY</span>
                </div>
                <div className={styles.windows}>
                  <div className={styles.shelf}>
                    <span /><span /><span /><span />
                  </div>
                  <div className={styles.shelf}>
                    <span /><span /><span /><span />
                  </div>
                  <div className={styles.door}>
                    <span className={styles.doorCross}>＋</span>
                  </div>
                </div>
              </div>
              <div className={styles.shopSide} />
              <div className={styles.shopGround} />
            </div>

            <div className={`${styles.chip} ${styles.chip1}`}>🧾 Sales</div>
            <div className={`${styles.chip} ${styles.chip2}`}>📦 Purchase</div>
            <div className={`${styles.chip} ${styles.chip3}`}>📊 Inventory</div>
            <div className={`${styles.chip} ${styles.chip4}`}>🤝 Parties</div>
            <div className={`${styles.chip} ${styles.chip5}`}>🏬 Multi-store</div>
          </div>
          <div className={styles.sceneShadow} />
        </div>
      </section>

      <section id="modules" className={styles.modules}>
        <p className={styles.sectionEyebrow}>Everything in one shop</p>
        <h2 className={styles.sectionTitle}>One platform, every workflow</h2>
        <p className={styles.sectionLead}>
          Six tightly-connected modules that cover your pharmacy from the supplier
          door to the customer&apos;s hand.
        </p>
        <div className={styles.grid}>
          {MODULES.map((m) => (
            <article
              key={m.t}
              className={styles.moduleCard}
              style={{ '--c': m.c } as CSSProperties}
            >
              <span className={styles.moduleIcon}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {ICONS[m.id]}
                </svg>
              </span>
              <div className={styles.moduleBody}>
                <h3>{m.t}</h3>
                <p>{m.d}</p>
              </div>
              <span className={styles.moduleArrow} aria-hidden>
                →
              </span>
            </article>
          ))}
        </div>
      </section>

      <section id="stores" className={styles.storesBand}>
        <div className={styles.storesInner}>
          <div>
            <h2 className={styles.bandTitle}>From a single shop to a whole chain</h2>
            <p className={styles.bandLead}>
              Spin up new outlets in seconds, keep their stock and ledgers isolated,
              then roll everything up into one owner&apos;s dashboard.
            </p>
            <button className={styles.primaryBtn} onClick={() => openAuth('admin')}>
              Open admin control room
            </button>
          </div>
          <div className={styles.storesStat}>
            <div className={styles.statBox}>
              <strong>∞</strong>
              <span>Stores</span>
            </div>
            <div className={styles.statBox}>
              <strong>1</strong>
              <span>Console</span>
            </div>
            <div className={styles.statBox}>
              <strong>6</strong>
              <span>Core modules</span>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Revin Bill</span>
        <span className={styles.footerDot}>·</span>
        <span>Built for medical billing teams</span>
      </footer>

      <AuthModal
        open={authOpen}
        mode={authMode}
        onClose={() => setAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  )
}
