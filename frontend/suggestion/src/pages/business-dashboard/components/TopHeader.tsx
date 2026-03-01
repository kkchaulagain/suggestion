import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { businessmeapi } from '../../../utils/apipath'

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
        const token = localStorage.getItem('token')
        const response = await axios.get(businessmeapi, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (response.data?.success && response.data?.data) {
          setBusinessProfile(response.data.data as BusinessProfile)
        }
      } catch {
        setBusinessProfile(null)
      }
    }

    fetchBusinessProfile()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.setItem('isLoggedIn', 'false')
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 lg:hidden"
          >
            Menu
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{title}</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Business and government QR suggestion management</p>
          </div>
        </div>
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((current) => !current)}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:text-sm"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
          >
            Profile
          </button>
          {isProfileOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-12 w-72 rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
            >
              <div className="mb-2 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business Profile</p>
                <p className="mt-1 text-sm font-bold text-slate-900">
                  {businessProfile?.businessname || 'Business name unavailable'}
                </p>
                <p className="mt-2 text-xs text-slate-600">Location: {businessProfile?.location || 'N/A'}</p>
                <p className="mt-1 text-xs text-slate-600">PAN: {businessProfile?.pancardNumber ?? 'N/A'}</p>
                <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                  {businessProfile?.description || 'Description unavailable'}
                </p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
