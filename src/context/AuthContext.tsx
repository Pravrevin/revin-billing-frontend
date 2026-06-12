import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearBearerToken,
  setBearerToken,
} from '../lib/apiConfig'
import {
  loginRequest,
  type PermissionItem,
  type UserInfo,
} from '../services/authApi'

type AuthState = {
  isAuthenticated: boolean
  user: UserInfo | null
  permissions: PermissionItem[]
}

type AuthContextValue = AuthState & {
  isSuperadmin: boolean
  /** Resolves to the logged-in user on success, or throws with a message. */
  login: (username: string, password: string) => Promise<UserInfo>
  logout: () => void
}

const STATE_KEY = 'revin-bill-auth'

const AuthContext = createContext<AuthContextValue | null>(null)

const EMPTY: AuthState = { isAuthenticated: false, user: null, permissions: [] }

function loadStored(): AuthState {
  try {
    const raw = sessionStorage.getItem(STATE_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as AuthState
    if (parsed?.isAuthenticated && parsed.user) {
      return {
        isAuthenticated: true,
        user: parsed.user,
        permissions: Array.isArray(parsed.permissions) ? parsed.permissions : [],
      }
    }
  } catch {
    /* ignore */
  }
  return EMPTY
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadStored)

  const persist = useCallback((next: AuthState) => {
    setState(next)
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const login = useCallback(
    async (username: string, password: string): Promise<UserInfo> => {
      const result = await loginRequest(username.trim(), password)
      setBearerToken(result.access_token)
      persist({
        isAuthenticated: true,
        user: result.user,
        permissions: result.permissions || [],
      })
      return result.user
    },
    [persist],
  )

  const logout = useCallback(() => {
    clearBearerToken()
    setState(EMPTY)
    try {
      sessionStorage.removeItem(STATE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isSuperadmin: state.user?.role === 'superadmin',
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
