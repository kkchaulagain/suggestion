import { NavLink } from 'react-router-dom'
import type { SidebarItem } from '../types/navigation'

interface SidebarProps {
  items: SidebarItem[]
}

export default function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 dark:border-slate-700 dark:bg-slate-800 lg:flex">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Suggestion Suite</p>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">QR Service Desk</h1>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path !== '/dashboard/forms'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-100'
              }`
            }
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
