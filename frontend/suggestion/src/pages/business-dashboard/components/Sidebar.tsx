import { NavLink } from 'react-router-dom'
import type { SidebarItem } from '../types/navigation'

interface SidebarProps {
  items: SidebarItem[]
}

export default function Sidebar({ items }: SidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-stone-200/80 bg-[#fafaf9] px-5 py-6 dark:border-stone-700/80 dark:bg-stone-950 lg:flex">
      <div className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-widest text-stone-400 dark:text-stone-500">Suggestion Suite</p>
        <h1 className="mt-2 text-lg font-medium tracking-tight text-stone-900 dark:text-stone-50">QR Service Desk</h1>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path !== '/dashboard/forms'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100'
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
