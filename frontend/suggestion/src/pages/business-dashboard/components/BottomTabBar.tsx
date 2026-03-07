import { NavLink } from 'react-router-dom'
import type { SidebarItem } from '../types/navigation'

/** Short labels for bottom tab bar so all fit on small screens without truncation. */
const shortLabels: Record<string, string> = {
  Forms: 'Forms',
  Submissions: 'Inbox',
  Businesses: 'Biz',
  Users: 'Users',
  Profile: 'Me',
}

interface BottomTabBarProps {
  items: SidebarItem[]
}

export default function BottomTabBar({ items }: BottomTabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="flex">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path !== '/dashboard/forms'}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2.5 min-h-[44px] justify-center transition ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex items-center justify-center shrink-0">
                  {isActive ? (
                    <span
                      className="absolute -top-2 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-emerald-600 dark:bg-emerald-400"
                      aria-hidden
                    />
                  ) : null}
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden />
                </span>
                <span className="text-[10px] font-semibold truncate max-w-[4rem] px-0.5" title={item.label}>
                  {shortLabels[item.label] ?? item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
