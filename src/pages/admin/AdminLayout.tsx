import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './admin.module.css'

export function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navlink} ${isActive ? styles.navlinkActive : ''}`

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <span className={styles.brand}>Revin Bill · Admin</span>
        <nav className={styles.navlinks}>
          <NavLink to="/admin/pharmacies" className={linkClass}>
            Pharmacies
          </NavLink>
          <NavLink to="/admin/insights" className={linkClass}>
            Insights
          </NavLink>
        </nav>
        <span className={styles.muted} style={{ color: '#cbd5e1' }}>
          {user?.full_name || user?.username}
        </span>
        <button type="button" className={styles.signout} onClick={handleLogout}>
          Sign out
        </button>
      </header>
      <div className={styles.content}>
        <Outlet />
      </div>
    </div>
  )
}
