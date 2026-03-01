import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Dashboard from '../pages/Dashboard'
import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'

/**
 * Renders the correct dashboard for the current user role.
 * Business / governmentservices → business dashboard (forms only); layout renders child routes via its own Outlet.
 * User → profile dashboard.
 */
export default function DashboardRouter() {
  const { user } = useAuth()
  const role = user?.role ? String(user.role).toLowerCase() : 'user'
  const isBusinessRole = role === 'business' || role === 'governmentservices'

  if (isBusinessRole) {
    return <BusinessDashboardLayout />
  }

  return <Outlet />
}

/**
 * Handles /dashboard index: redirect business to forms, show Dashboard for user.
 */
export function DashboardIndex() {
  const { user } = useAuth()
  const role = user?.role ? String(user.role).toLowerCase() : 'user'
  const isBusinessRole = role === 'business' || role === 'governmentservices'
  if (isBusinessRole) {
    return <Navigate to="/dashboard/forms" replace />
  }
  return <Dashboard />
}
