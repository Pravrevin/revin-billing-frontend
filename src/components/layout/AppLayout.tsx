import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { logMenuAccess } from '../../services/authApi'
import { AiAssistant } from '../assistant/AiAssistant'
import {
  SIDEBAR_SECTIONS,
  TILE_COLORS,
  buildPermissionSet,
  canSeeMenu,
  canSeeSub,
  findMenuById,
  type MenuItem,
  type ModalAction,
  type SubItem,
  type SubSubItem,
} from '../../data/menus'
import { DASHBOARD_ICON, NAV_ICONS, NavGlyph } from './navIcons'
import { ShortcutsHelp } from './ShortcutsHelp'
import { SHORTCUTS, shortcutHint } from '../../data/shortcuts'
import { useEffect, type CSSProperties } from 'react'
import styles from './AppLayout.module.css'

const DASHBOARD_PATH = '/app/dashboard'

export function AppLayout() {
  const { user, permissions, isSuperadmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openMenuIds, setOpenMenuIds] = useState<Record<number, boolean>>({})
  const [openSubIds, setOpenSubIds] = useState<Record<string, boolean>>({})
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Marg-style global keyboard shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault()
        setHelpOpen((v) => !v)
        return
      }
      // Don't hijack typing in fields.
      const t = e.target as HTMLElement | null
      const typing = !!t && (
        t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' ||
        t.tagName === 'SELECT' || t.isContentEditable
      )
      if (typing || !e.altKey || e.ctrlKey || e.metaKey) return
      const sc = SHORTCUTS.find((s) => s.code === e.code)
      if (!sc) return
      e.preventDefault()
      setHelpOpen(false)
      setMobileNavOpen(false)
      if (sc.to) navigate(sc.to)
      else if (sc.action) navigate(`${DASHBOARD_PATH}?action=${sc.action}`)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const ps = useMemo(() => buildPermissionSet(permissions), [permissions])

  // Superadmin can see everything; pharmacy users are limited to their grants.
  const showMenu = (menuId: number) => isSuperadmin || canSeeMenu(ps, menuId)
  const showSub = (menuId: number, subId: number) =>
    isSuperadmin || canSeeSub(ps, menuId, subId)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleMenu = (id: number) =>
    setOpenMenuIds((prev) => ({ ...prev, [id]: !prev[id] }))

  const toggleSub = (key: string) =>
    setOpenSubIds((prev) => ({ ...prev, [key]: !prev[key] }))

  const closeMobile = () => setMobileNavOpen(false)

  const onLeafClick = (menuId: number, subId: number) => {
    logMenuAccess(menuId, subId)
    closeMobile()
  }

  const triggerAction = (action: ModalAction, menuId: number, subId: number) => {
    onLeafClick(menuId, subId)
    navigate(`${DASHBOARD_PATH}?action=${action}`)
  }

  const renderLeaf = (
    item: SubItem | SubSubItem,
    depth: number,
    keyPrefix: string,
    menuId: number,
    subId: number,
  ) => {
    const className = depth === 1 ? styles.subLink : styles.subSubLink
    const hint = shortcutHint(item)

    if (item.to) {
      return (
        <NavLink
          key={keyPrefix}
          to={item.to}
          end
          className={({ isActive }) =>
            `${className} ${isActive ? styles.active : ''}`
          }
          onClick={() => onLeafClick(menuId, subId)}
        >
          <span className={styles.subIcon}>{item.icon}</span>
          <span className={styles.subLabel}>{item.label}</span>
          {hint && <kbd className={styles.leafKbd}>{hint}</kbd>}
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
          onClick={() => triggerAction(item.action!, menuId, subId)}
        >
          <span className={styles.subIcon}>{item.icon}</span>
          <span className={styles.subLabel}>{item.label}</span>
          {hint && <kbd className={styles.leafKbd}>{hint}</kbd>}
          {item.star && <span className={styles.starDot} />}
        </button>
      )
    }

    return (
      <button
        key={keyPrefix}
        type="button"
        className={className}
        onClick={() => onLeafClick(menuId, subId)}
      >
        <span className={styles.subIcon}>{item.icon}</span>
        <span className={styles.subLabel}>{item.label}</span>
        {item.star && <span className={styles.starDot} />}
      </button>
    )
  }

  const renderMenu = (menu: MenuItem) => {
    const visibleSubs = menu.subs.filter((sub) => showSub(menu.id, sub.id))
    if (visibleSubs.length === 0) return null

    const isOpen = openMenuIds[menu.id] ?? false
    const accent = TILE_COLORS[menu.color] ?? '#0d9488'
    return (
      <div key={menu.id} className={styles.navGroup}>
        <button
          type="button"
          className={`${styles.navGroupBtn} ${isOpen ? styles.groupOpen : ''}`}
          style={{ '--mc': accent } as CSSProperties}
          onClick={() => toggleMenu(menu.id)}
          aria-expanded={isOpen}
        >
          <span className={styles.navIcon}>
            <NavGlyph>{NAV_ICONS[menu.id]}</NavGlyph>
          </span>
          <span className={styles.groupLabel}>{menu.label}</span>
          <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
        {isOpen && (
          <div className={styles.subNav}>
            {visibleSubs.map((sub) => {
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
                          renderLeaf(leaf, 2, `${subKey}-${leaf.id}`, menu.id, sub.id),
                        )}
                      </div>
                    )}
                  </div>
                )
              }
              return renderLeaf(sub, 1, subKey, menu.id, sub.id)
            })}
          </div>
        )}
      </div>
    )
  }

  const dashboardActive =
    location.pathname === DASHBOARD_PATH ||
    location.pathname === DASHBOARD_PATH + '/'

  const pharmacyName = user?.pharmacy?.name
  const footerName = user?.full_name || user?.username || ''

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.sidebar} ${mobileNavOpen ? styles.sidebarOpen : ''} ${collapsed ? styles.sidebarCollapsed : ''}`}
      >
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            ＋
          </span>
          <div>
            <strong>Revin Bill</strong>
            <span className={styles.brandTag}>
              {pharmacyName || 'Medical billing'}
            </span>
          </div>
        </div>

        <nav className={styles.nav} aria-label="Main">
          <NavLink
            to={DASHBOARD_PATH}
            end
            className={`${styles.navLink} ${dashboardActive ? styles.active : ''}`}
            style={{ '--mc': '#22d3ee' } as CSSProperties}
            onClick={closeMobile}
          >
            <span className={styles.navIcon}>
              <NavGlyph>{DASHBOARD_ICON}</NavGlyph>
            </span>
            <span className={styles.groupLabel}>Dashboard</span>
          </NavLink>

          {SIDEBAR_SECTIONS.map((section) => {
            const menus = section.menuIds
              .filter((id) => showMenu(id))
              .map((id) => findMenuById(id))
              .filter((m): m is MenuItem => Boolean(m))
            // Render the section only if it has at least one rendered menu.
            const rendered = menus.map((menu) => renderMenu(menu)).filter(Boolean)
            if (rendered.length === 0) return null
            return (
              <div key={section.label} className={styles.section}>
                <p className={styles.sectionHead}>{section.label}</p>
                {rendered}
              </div>
            )
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <p className={styles.userHint}>
            {footerName}
            {pharmacyName ? ` · ${pharmacyName}` : ''}
          </p>
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
            className={styles.sidebarToggle}
            aria-label={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            aria-pressed={collapsed}
            title={collapsed ? 'Show sidebar' : 'Hide sidebar'}
            onClick={() => setCollapsed((v) => !v)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
              {collapsed ? <path d="m13 9 3 3-3 3" /> : <path d="m16 9-3 3 3 3" />}
            </svg>
          </button>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen((v) => !v)}
          >
            Menu
          </button>
          <div className={styles.topBarMeta}>
            <button
              type="button"
              className={styles.shortcutsBtn}
              onClick={() => setHelpOpen(true)}
              title="Keyboard shortcuts (F1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M9 13h6" />
              </svg>
              <span className={styles.shortcutsLabel}>Shortcuts</span>
              <kbd className={styles.shortcutsKbd}>F1</kbd>
            </button>
            <span className={styles.pill}>Secure session</span>
          </div>
        </header>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      <AiAssistant />

      {helpOpen && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  )
}
