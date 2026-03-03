import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
import { sidebarItems } from '../types/navigation'

const pageTitles: Record<string, string> = {
  '/dashboard/forms': 'Forms',
  '/dashboard/forms/create': 'Create Form',
  '/dashboard/submissions': 'Submissions',
  '/dashboard/businesses': 'Businesses',
}

export default function BusinessDashboardLayout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const pageTitle = useMemo(() => {
    return pageTitles[location.pathname] ?? 'Business Dashboard'
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar items={sidebarItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 lg:ml-0">
          <TopHeader title={pageTitle} onOpenSidebar={() => setIsSidebarOpen(true)} />
          <main className="p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
