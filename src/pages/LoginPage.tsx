import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname

  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to={from || '/app/dashboard'} replace />
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const ok = login(mobile, password)
    if (!ok) {
      setError('Enter your mobile number and password to continue.')
      return
    }
    navigate(from || '/app/dashboard', { replace: true })
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
              Mobile number
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="e.g. 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
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
            <button type="submit" className={styles.submit}>
              Enter dashboard
            </button>
          </form>

          <p className={styles.hint}>
            Demo: use any mobile and password — both fields must be filled.
          </p>
        </div>
      </div>
    </div>
  )
}
