import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { businessmeapi } from '../../../utils/apipath'
import { Button, ThemeToggle } from '../../../components/ui'

interface TopHeaderProps {
  title: string
  onOpenSidebar: () => void
}

interface BusinessProfile {
  businessname?: string
  location?: string
  pancardNumber?: number
  description?: string
}

export default function TopHeader({ title, onOpenSidebar }: TopHeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout, getAuthHeaders } = useAuth()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        const response = await axios.get(businessmeapi, {
          withCredentials: true,
          headers: getAuthHeaders(),
        })

        if (response.data?.success && response.data?.data) {
          setBusinessProfile(response.data.data as BusinessProfile)
        }
      } catch {
        setBusinessProfile(null)
      }
    }

    fetchBusinessProfile()
  }, [getAuthHeaders])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onOpenSidebar}
            className="lg:hidden"
          >
            Menu
          </Button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 sm:text-xl">{title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Business and government QR suggestion management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="relative" ref={profileMenuRef}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setIsProfileOpen((current) => !current)}
            className="rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-800/60 sm:text-sm"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
          >
            Profile
          </Button>
          {isProfileOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-12 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="mb-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-700/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Business Profile</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                  {businessProfile?.businessname || 'Business name unavailable'}
                </p>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Location: {businessProfile?.location || 'N/A'}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">PAN: {businessProfile?.pancardNumber ?? 'N/A'}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                  {businessProfile?.description || 'Description unavailable'}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="md"
                role="menuitem"
                onClick={handleLogout}
                className="w-full justify-start text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/40"
              >
                Logout
              </Button>
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </header>
  )
}
