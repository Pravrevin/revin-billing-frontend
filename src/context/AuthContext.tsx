import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type AuthState = {
  mobile: string
  isAuthenticated: boolean
}

type AuthContextValue = AuthState & {
  login: (mobile: string, password: string) => boolean
  logout: () => void
}

const STORAGE_KEY = 'revin-bill-auth'

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStored(): AuthState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { mobile: '', isAuthenticated: false }
    const parsed = JSON.parse(raw) as AuthState
    if (parsed?.isAuthenticated && typeof parsed.mobile === 'string') {
      return { mobile: parsed.mobile, isAuthenticated: true }
    }
  } catch {
    /* ignore */
  }
  return { mobile: '', isAuthenticated: false }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStored)

  const login = useCallback((mobile: string, password: string) => {
    const m = mobile.trim()
    const p = password.trim()
    if (!m || !p) return false
    const next = { mobile: m, isAuthenticated: true }
    setState(next)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return true
  }, [])

  const logout = useCallback(() => {
    setState({ mobile: '', isAuthenticated: false })
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
    }),
    [state, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
