import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  children: React.ReactNode
  /** When set, the user's role must match or they're redirected away. */
  requireRole?: 'superadmin' | 'pharmacy_user'
}

export function ProtectedRoute({ children, requireRole }: Props) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requireRole && user?.role !== requireRole) {
    // Send a logged-in user to the area that matches their role.
    const fallback = user?.role === 'superadmin' ? '/admin' : '/app/dashboard'
    return <Navigate to={fallback} replace />
  }

  return children
}
