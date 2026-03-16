import { Navigate } from 'react-router-dom'
import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'
import { useAuth } from '../context/AuthContext'

const BUSINESS_ROLES = ['business', 'governmentservices'] as const

/**
 * Renders the business dashboard layout for all authenticated users.
 * Sidebar filters items by role (personal users see Forms, Submissions, Profile; admin sees all).
 */
export default function DashboardRouter() {
  return <BusinessDashboardLayout />
}

/**
 * Handles /dashboard index: redirect business users who have not completed onboarding to /dashboard/onboarding; others to /dashboard/forms.
 */
export function DashboardIndex() {
  const { user, business } = useAuth()
  const isBusinessUser = user?.role && BUSINESS_ROLES.includes(user.role as typeof BUSINESS_ROLES[number])
  const needsOnboarding = isBusinessUser && business != null && !business.onboardingCompleted
  if (needsOnboarding) {
    return <Navigate to="/dashboard/onboarding" replace />
  }
  return <Navigate to="/dashboard/forms" replace />
}

