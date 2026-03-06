// Wrapper for protected routes: redirects to login when not authenticated
import { Navigate } from 'react-router-dom'
import type { ReactNode, JSX } from 'react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-lg text-gray-600 dark:text-slate-300">Loading...</div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}