import { NavLink } from 'react-router-dom'
import type { SidebarItem } from '../types/navigation'
import { Button } from '../../../components/ui'

interface SidebarProps {
  items: SidebarItem[]
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ items, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen ? (
        <Button
          type="button"
          variant="ghost"
          aria-label="Close menu"
          className="fixed inset-0 z-30 !p-0 !min-w-full !min-h-full rounded-none bg-slate-900/40 lg:hidden"
          onClick={onClose}
        >
          <span className="sr-only">Close menu</span>
        </Button>
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white px-5 py-6 shadow-xl transition-transform duration-200 lg:static lg:translate-x-0 lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Suggestion Suite</p>
          <h1 className="mt-2 text-xl font-bold text-slate-900">QR Service Desk</h1>
        </div>
        <nav className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
