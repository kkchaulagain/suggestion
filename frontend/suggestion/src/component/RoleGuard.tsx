import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../context/AuthContext'

interface RoleGuardProps {
  roles: UserRole[]
  children: ReactNode
}

/**
 * Redirects to /dashboard if the current user is not authenticated or does not have one of the required roles.
 */
export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role ?? ('' as UserRole))) {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}
