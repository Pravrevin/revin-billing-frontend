import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { login, isAuthenticated, isSuperadmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (isAuthenticated) {
    const home = isSuperadmin ? '/admin' : '/app/dashboard'
    return <Navigate to={from || home} replace />
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter your username and password to continue.')
      return
    }
    setBusy(true)
    try {
      const user = await login(username, password)
      const home = user.role === 'superadmin' ? '/admin' : '/app/dashboard'
      navigate(from || home, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.decor} aria-hidden />
        <div className={styles.card}>
          <Link to="/" className={styles.back}>
            ← Home
          </Link>
          <div className={styles.brandBlock}>
            <span className={styles.mark} />
            <div>
              <h1 className={styles.title}>Welcome back</h1>
              <p className={styles.sub}>Sign in to Revin Bill medical console</p>
            </div>
          </div>

          <form className={styles.form} onSubmit={onSubmit} noValidate>
            <label className={styles.label}>
              Username
              <input
                type="text"
                autoComplete="username"
                placeholder="e.g. admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
              />
            </label>
            <label className={styles.label}>
              Password
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
              />
            </label>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? 'Signing in…' : 'Enter dashboard'}
            </button>
          </form>

          <p className={styles.hint}>
            Use the credentials provided by your administrator.
          </p>
        </div>
      </div>
    </div>
  )
}
