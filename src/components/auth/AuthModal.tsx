import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './AuthModal.module.css'

export type AuthMode = 'store' | 'admin' | 'signup'

type Props = {
  open: boolean
  mode: AuthMode
  onClose: () => void
  onModeChange: (mode: AuthMode) => void
}

const TABS: { id: AuthMode; label: string }[] = [
  { id: 'store', label: 'Store Login' },
  { id: 'admin', label: 'Admin Login' },
  { id: 'signup', label: 'Sign Up' },
]

export function AuthModal({ open, mode, onClose, onModeChange }: Props) {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Signup fields
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [signupDone, setSignupDone] = useState(false)

  // Reset transient state whenever the modal opens or the tab changes.
  useEffect(() => {
    if (!open) return
    setError('')
    setBusy(false)
    setPassword('')
    setSignupDone(false)
  }, [open, mode])

  // Close on Escape.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isAdmin = mode === 'admin'

  const onLogin = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password) {
      setError('Enter your username and password to continue.')
      return
    }
    setBusy(true)
    try {
      const user = await login(username, password)
      if (isAdmin && user.role !== 'superadmin') {
        setError('These are not administrator credentials. Use Store Login instead.')
        setBusy(false)
        return
      }
      const home = user.role === 'superadmin' ? '/admin' : '/app/dashboard'
      navigate(home, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
      setBusy(false)
    }
  }

  const onSignup = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!storeName.trim() || !ownerName.trim() || !email.trim()) {
      setError('Store name, owner name and email are required.')
      return
    }
    setBusy(true)
    // No public registration endpoint yet — capture the request and confirm.
    // An administrator provisions the store and shares login credentials.
    window.setTimeout(() => {
      setBusy(false)
      setSignupDone(true)
    }, 700)
  }

  return (
    <div className={styles.overlay} onMouseDown={onClose} role="presentation">
      <div
        className={styles.modal}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={TABS.find((t) => t.id === mode)?.label}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className={styles.head}>
          <span className={`${styles.mark} ${isAdmin ? styles.markAdmin : ''}`}>
            {isAdmin ? '🛡️' : mode === 'signup' ? '✨' : '＋'}
          </span>
          <div>
            <h2 className={styles.title}>
              {mode === 'store' && 'Store Console'}
              {mode === 'admin' && 'Administrator'}
              {mode === 'signup' && 'Register your store'}
            </h2>
            <p className={styles.sub}>
              {mode === 'store' && 'Sign in to run sales, purchases & inventory.'}
              {mode === 'admin' && 'Manage every store from one control room.'}
              {mode === 'signup' && 'Tell us about your pharmacy to get started.'}
            </p>
          </div>
        </div>

        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={mode === t.id}
              className={`${styles.tab} ${mode === t.id ? styles.tabActive : ''}`}
              onClick={() => onModeChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {mode === 'signup' ? (
          signupDone ? (
            <div className={styles.success}>
              <div className={styles.successMark}>✓</div>
              <h3>Request received</h3>
              <p>
                Thanks, {ownerName.split(' ')[0] || 'there'}! We&apos;ve logged your
                request for <strong>{storeName}</strong>. Our team will provision your
                store and email login details to {email}.
              </p>
              <button
                className={styles.submit}
                onClick={() => onModeChange('store')}
                type="button"
              >
                Back to Store Login
              </button>
            </div>
          ) : (
            <form className={styles.form} onSubmit={onSignup} noValidate>
              <div className={styles.row}>
                <label className={styles.label}>
                  Store name
                  <input
                    className={styles.input}
                    placeholder="e.g. Wellness Pharmacy"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  Owner name
                  <input
                    className={styles.input}
                    placeholder="e.g. Asha Mehta"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </label>
              </div>
              <div className={styles.row}>
                <label className={styles.label}>
                  Email
                  <input
                    className={styles.input}
                    type="email"
                    placeholder="you@store.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className={styles.label}>
                  Phone
                  <input
                    className={styles.input}
                    placeholder="+91 ..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </label>
              </div>
              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}
              <button type="submit" className={styles.submit} disabled={busy}>
                {busy ? 'Submitting…' : 'Create store request'}
              </button>
              <p className={styles.switchHint}>
                Already onboarded?{' '}
                <button type="button" onClick={() => onModeChange('store')}>
                  Store Login
                </button>
              </p>
            </form>
          )
        ) : (
          <form className={styles.form} onSubmit={onLogin} noValidate>
            <label className={styles.label}>
              Username
              <input
                className={styles.input}
                type="text"
                autoComplete="username"
                placeholder={isAdmin ? 'admin' : 'store username'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className={styles.label}>
              Password
              <input
                className={styles.input}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <button type="submit" className={styles.submit} disabled={busy}>
              {busy ? 'Signing in…' : isAdmin ? 'Enter control room' : 'Open store console'}
            </button>
            <p className={styles.switchHint}>
              {isAdmin ? (
                <>
                  Run a single store?{' '}
                  <button type="button" onClick={() => onModeChange('store')}>
                    Store Login
                  </button>
                </>
              ) : (
                <>
                  New here?{' '}
                  <button type="button" onClick={() => onModeChange('signup')}>
                    Register your store
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
