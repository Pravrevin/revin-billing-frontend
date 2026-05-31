import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  SIDEBAR_SECTIONS,
  type MenuItem,
  type ModalAction,
  type SubItem,
  type SubSubItem,
  findMenuById,
} from '../../data/menus'
import styles from './AppLayout.module.css'

const DASHBOARD_PATH = '/app/dashboard'

export function AppLayout() {
  const { mobile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openMenuIds, setOpenMenuIds] = useState<Record<number, boolean>>({})
  const [openSubIds, setOpenSubIds] = useState<Record<string, boolean>>({})
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleMenu = (id: number) =>
    setOpenMenuIds((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleSub = (key: string) =>
    setOpenSubIds((prev) => ({ ...prev, [key]: !prev[key] }))

  const closeMobile = () => setMobileNavOpen(false)

  const triggerAction = (action: ModalAction) => {
    closeMobile()
    navigate(`${DASHBOARD_PATH}?action=${action}`)
  }

  const renderLeaf = (
    item: SubItem | SubSubItem,
    depth: number,
    keyPrefix: string,
  ) => {
    const className = depth === 1 ? styles.subLink : styles.subSubLink

    if (item.to) {
      return (
        <NavLink
          key={keyPrefix}
          to={item.to}
          end
          className={({ isActive }) =>
            `${className} ${isActive ? styles.active : ''}`
          }
          onClick={closeMobile}
        >
          <span className={styles.subIcon}>{item.icon}</span>
          <span className={styles.subLabel}>{item.label}</span>
          {item.star && <span className={styles.starDot} />}
        </NavLink>
      )
    }

    if (item.action) {
      return (
        <button
          key={keyPrefix}
          type="button"
          className={className}
          onClick={() => triggerAction(item.action!)}
        >
          <span className={styles.subIcon}>{item.icon}</span>
          <span className={styles.subLabel}>{item.label}</span>
          {item.star && <span className={styles.starDot} />}
        </button>
      )
    }

    return (
      <button
        key={keyPrefix}
        type="button"
        className={className}
        onClick={closeMobile}
      >
        <span className={styles.subIcon}>{item.icon}</span>
        <span className={styles.subLabel}>{item.label}</span>
        {item.star && <span className={styles.starDot} />}
      </button>
    )
  }

  const renderMenu = (menu: MenuItem) => {
    const isOpen = openMenuIds[menu.id] ?? false
    return (
      <div key={menu.id} className={styles.navGroup}>
        <button
          type="button"
          className={styles.navGroupBtn}
          onClick={() => toggleMenu(menu.id)}
          aria-expanded={isOpen}
        >
          <span className={styles.navIcon}>{menu.icon}</span>
          <span className={styles.groupLabel}>{menu.label}</span>
          <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
        </button>
        {isOpen && (
          <div className={styles.subNav}>
            {menu.subs.map((sub) => {
              const subKey = `${menu.id}-${sub.id}`
              if (sub.subs && sub.subs.length > 0) {
                const subOpen = openSubIds[subKey] ?? false
                return (
                  <div key={subKey} className={styles.subGroup}>
                    <button
                      type="button"
                      className={styles.subGroupBtn}
                      onClick={() => toggleSub(subKey)}
                      aria-expanded={subOpen}
                    >
                      <span className={styles.subIcon}>{sub.icon}</span>
                      <span className={styles.subLabel}>{sub.label}</span>
                      <span className={styles.chevron}>
                        {subOpen ? '▾' : '▸'}
                      </span>
                    </button>
                    {subOpen && (
                      <div className={styles.subSubNav}>
                        {sub.subs.map((leaf) =>
                          renderLeaf(leaf, 2, `${subKey}-${leaf.id}`),
                        )}
                      </div>
                    )}
                  </div>
                )
              }
              return renderLeaf(sub, 1, subKey)
            })}
          </div>
        )}
      </div>
    )
  }

  const dashboardActive =
    location.pathname === DASHBOARD_PATH ||
    location.pathname === DASHBOARD_PATH + '/'

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden />
          <div>
            <strong>Revin Bill</strong>
            <span className={styles.brandTag}>Medical billing</span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Main">
          <NavLink
            to={DASHBOARD_PATH}
            end
            className={`${styles.navLink} ${dashboardActive ? styles.active : ''}`}
            onClick={closeMobile}
          >
            <span className={styles.navIcon}>◆</span>
            <span className={styles.groupLabel}>Dashboard</span>
          </NavLink>

          {SIDEBAR_SECTIONS.map((section) => (
            <div key={section.label} className={styles.section}>
              <p className={styles.sectionHead}>{section.label}</p>
              {section.menuIds.map((id) => {
                const menu = findMenuById(id)
                return menu ? renderMenu(menu) : null
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.userHint}>{mobile}</p>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={closeMobile}
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
