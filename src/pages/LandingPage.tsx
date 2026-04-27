import { Link } from 'react-router-dom'
import styles from './LandingPage.module.css'

export function LandingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden />
      <header className={styles.header}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark} />
          <span className={styles.logoText}>Revin Bill</span>
        </div>
        <Link to="/login" className={styles.headerCta}>
          Sign in
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Medical distribution &amp; retail</p>
          <h1 className={styles.title}>
            Billing clarity for{' '}
            <span className={styles.titleAccent}>pharmacies</span> &amp; clinics
          </h1>
          <p className={styles.lead}>
            Track products, stock, parties, sales, and purchases in one calm,
            compliant workspace built for healthcare teams.
          </p>
          <div className={styles.ctaRow}>
            <Link to="/login" className={styles.primaryBtn}>
              Open console
            </Link>
            <a href="#features" className={styles.ghostBtn}>
              Explore modules
            </a>
          </div>
          <ul className={styles.trust}>
            <li>HIPAA-minded workflows</li>
            <li>Batch &amp; expiry aware</li>
            <li>GST-ready ledgers</li>
          </ul>
        </div>
        <div className={styles.heroCard} aria-hidden>
          <div className={styles.cardGlow} />
          <div className={styles.mockUi}>
            <div className={styles.mockBar} />
            <div className={styles.mockRows}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.mockChart}>
              <div className={styles.mockBar1} />
              <div className={styles.mockBar2} />
              <div className={styles.mockBar3} />
            </div>
          </div>
          <p className={styles.cardCaption}>Live inventory pulse</p>
        </div>
      </section>

      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything your counter needs</h2>
        <div className={styles.grid}>
          {[
            {
              t: 'Product & stock',
              d: 'SKU, batches, MRP, and rack locations in sync.',
            },
            {
              t: 'Parties hub',
              d: 'Customers and distributors with credit and routes.',
            },
            {
              t: 'Sales & purchase',
              d: 'Fast billing flows with audit-friendly trails.',
            },
          ].map((f) => (
            <article key={f.t} className={styles.featureCard}>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Revin Bill</span>
        <span className={styles.footerDot}>·</span>
        <span>Built for medical billing teams</span>
      </footer>
    </div>
  )
}
