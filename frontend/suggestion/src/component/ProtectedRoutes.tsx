//Acts as a wrapper for protected routes, checks if user is logged in, if not redirects to login page
import { Navigate } from 'react-router-dom'
import type { ReactNode, JSX } from 'react'

export default function ProtectedRoute({ children }: { children: ReactNode }): JSX.Element {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}