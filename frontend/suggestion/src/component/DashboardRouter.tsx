import { Navigate } from 'react-router-dom'
import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'

/**
 * Renders the business dashboard layout for all authenticated users.
 * Sidebar filters items by role (personal users see Forms, Submissions, Profile; admin sees all).
 */
export default function DashboardRouter() {
  return <BusinessDashboardLayout />
}

/**
 * Handles /dashboard index: redirect to forms for all users.
 */
export function DashboardIndex() {
  return <Navigate to="/dashboard/forms" replace />
}

