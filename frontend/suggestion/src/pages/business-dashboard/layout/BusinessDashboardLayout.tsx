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
  '/dashboard/pages': 'Pages',
  '/dashboard/pages/create': 'Create Page',
  '/dashboard/submissions': 'Submissions',
  '/dashboard/notifications': 'Notifications',
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
    if (/^\/dashboard\/pages\/[^/]+\/edit$/.test(location.pathname)) {
      return 'Edit Page'
    }
    return pageTitles[location.pathname] ?? 'Business Dashboard'
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex min-h-screen">
        <Sidebar items={navItems} />
        <div className="flex-1 flex flex-col bg-[#fafaf9] dark:bg-stone-950 lg:ml-0">
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
