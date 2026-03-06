import { Navigate } from 'react-router-dom'
import type { ReactNode, JSX } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * Renders children only when the user is NOT authenticated.
 * If the user is logged in, redirects to the appropriate dashboard based on role.
 */
export default function GuestRoute({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-lg text-gray-600 dark:text-slate-300">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
