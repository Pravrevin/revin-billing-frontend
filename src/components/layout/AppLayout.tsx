import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './AppLayout.module.css'

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: '◆' },
  { to: '/app/products', label: 'Product Master', icon: '◇' },
  { to: '/app/stock', label: 'Stock Master', icon: '▣' },
  {
    label: 'Parties',
    icon: '◎',
    children: [
      { to: '/app/parties/customers', label: 'Customer Master' },
      { to: '/app/parties/distributors', label: 'Distributor Master' },
    ],
  },
  { to: '/app/sales', label: 'Sales Master', icon: '▸' },
  { to: '/app/purchases', label: 'Purchase Master', icon: '◂' },
] as const

export function AppLayout() {
  const { mobile, logout } = useAuth()
  const navigate = useNavigate()
  const [groupsOpen, setGroupsOpen] = useState<Record<string, boolean>>({
    Parties: true,
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleGroup = (label: string) =>
    setGroupsOpen((prev) => ({ ...prev, [label]: !prev[label] }))

  return (
    <div className={styles.shell}>
      <aside className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden />
          <div>
            <strong>Revin Bill</strong>
            <span className={styles.brandTag}>Medical billing</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Main">
          {navItems.map((item) => {
            if ('children' in item) {
              const isOpen = groupsOpen[item.label] ?? true
              return (
                <div key={item.label} className={styles.navGroup}>
                  <button
                    type="button"
                    className={styles.navGroupBtn}
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.navIcon}>{item.icon}</span>
                    {item.label}
                    <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
                  </button>
                  {isOpen && (
                    <div className={styles.subNav}>
                      {item.children.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          end
                          className={({ isActive }) =>
                            `${styles.subLink} ${isActive ? styles.active : ''}`
                          }
                          onClick={() => setMobileNavOpen(false)}
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={() => setMobileNavOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.userHint}>{mobile}</p>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <div className={styles.mainWrap}>
        <header className={styles.topBar}>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            Menu
          </button>
          <div className={styles.topBarMeta}>
            <span className={styles.pill}>Secure session</span>
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
