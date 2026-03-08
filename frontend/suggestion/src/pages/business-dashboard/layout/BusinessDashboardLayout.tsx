import { useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import BottomTabBar from '../components/BottomTabBar'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import { sidebarItems } from '../types/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard/forms': 'Forms',
  '/dashboard/forms/create': 'Create Form',
  '/dashboard/submissions': 'Submissions',
  '/dashboard/businesses': 'Businesses',
  '/dashboard/users': 'Users',
  '/dashboard/profile': 'Profile',
}

export default function BusinessDashboardLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const currentRole = user?.role ?? ''

  const navItems = useMemo(() => {
    return sidebarItems.filter(
      (item) => !item.requiredRoles || item.requiredRoles.includes(currentRole),
    )
  }, [currentRole])

  const pageTitle = useMemo(() => {
    if (/^\/dashboard\/forms\/[^/]+\/edit$/.test(location.pathname)) {
      return 'Edit Form'
    }
    return pageTitles[location.pathname] ?? 'Business Dashboard'
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-slate-100">
      <div className="flex min-h-screen">
        <Sidebar items={navItems} />
        <div className="flex-1 flex flex-col lg:ml-0">
          <TopHeader title={pageTitle} />
          <main className="flex-1 p-4 pb-20 sm:p-6 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomTabBar items={navItems} />
    </div>
  )
}
