import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuthOptional } from '../../../context/AuthContext'
import { feedbackFormSubmissionsApi } from '../../../utils/apipath'
import { ThemeToggle } from '../../../components/ui'

interface TopHeaderProps {
  title: string
}

interface HeaderSubmissionNotification {
  _id: string
  formId: string
  formTitle: string
  submittedAt: string
  formSnapshot?: Array<{ name: string; label: string }>
  responses?: Record<string, string | string[]>
}

const ROLES_WITH_SUBMISSION_NOTIFICATIONS = new Set(['business', 'admin', 'governmentservices'])

function getStorageKey(userId: string | undefined): string {
  return `dashboard_submission_notifications_last_seen_${userId || 'anonymous'}`
}

function parseSafeDate(iso: string | undefined): number {
  if (!iso) return 0
  const parsed = new Date(iso).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatRelativeTime(iso: string): string {
  const ts = parseSafeDate(iso)
  if (!ts) return 'Just now'
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function getSubmitterName(notification: HeaderSubmissionNotification): string {
  const snapshot = Array.isArray(notification.formSnapshot) ? notification.formSnapshot : []
  const responses = notification.responses ?? {}
  const nameField = snapshot.find((field) => /(^|\s)name(\s|$)|submitter/i.test(field.label || field.name))
  const byField = nameField ? responses[nameField.name] : undefined
  const first = typeof byField === 'string' ? byField.trim() : Array.isArray(byField) ? String(byField[0] || '').trim() : ''
  if (first) return first
  for (const [key, value] of Object.entries(responses)) {
    if (!/name/i.test(key)) continue
    const text = typeof value === 'string' ? value.trim() : Array.isArray(value) ? String(value[0] || '').trim() : ''
    if (text) return text
  }
  return 'Anonymous'
}

export default function TopHeader({ title }: TopHeaderProps) {
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const getAuthHeaders = auth?.getAuthHeaders
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<HeaderSubmissionNotification[]>([])
  const [lastSeenAt, setLastSeenAt] = useState(0)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const isEligibleRole = !!user?.role && ROLES_WITH_SUBMISSION_NOTIFICATIONS.has(user.role)

  const authConfig = useMemo(
    () => ({
      withCredentials: true as const,
      headers: getAuthHeaders ? getAuthHeaders() : {},
    }),
    [getAuthHeaders],
  )

  const loadNotifications = useCallback(async () => {
    if (!isEligibleRole) {
      setNotifications([])
      return
    }

    try {
      const params = new URLSearchParams({ page: '1', pageSize: '10' })
      const response = await axios.get<{ submissions: HeaderSubmissionNotification[] }>(
        `${feedbackFormSubmissionsApi}?${params.toString()}`,
        authConfig,
      )
      const submissions = Array.isArray(response.data?.submissions) ? response.data.submissions : []
      setNotifications(submissions)
    } catch {
      setNotifications([])
    }
  }, [authConfig, isEligibleRole])

  useEffect(() => {
    if (!isEligibleRole) return
    const key = getStorageKey(user?._id)
    const stored = Number(localStorage.getItem(key) || '0')
    setLastSeenAt(Number.isFinite(stored) ? stored : 0)
  }, [isEligibleRole, user?._id])

  useEffect(() => {
    if (!isEligibleRole) return
    void loadNotifications()
    const id = window.setInterval(() => {
      void loadNotifications()
    }, 30000)
    return () => window.clearInterval(id)
  }, [isEligibleRole, loadNotifications])

  useEffect(() => {
    if (!isOpen || !isEligibleRole) return
    const latestTs = parseSafeDate(notifications[0]?.submittedAt) || Date.now()
    const key = getStorageKey(user?._id)
    localStorage.setItem(key, String(latestTs))
    setLastSeenAt(latestTs)
  }, [isOpen, isEligibleRole, notifications, user?._id])

  useEffect(() => {
    if (!isOpen) return
    const onDocClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [isOpen])

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) return notifications.length
    return notifications.filter((item) => parseSafeDate(item.submittedAt) > lastSeenAt).length
  }, [lastSeenAt, notifications])

  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-[#fafaf9] px-4 py-4 dark:border-stone-700/80 dark:bg-stone-950 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-medium tracking-tight text-stone-900 dark:text-stone-50 sm:text-xl">{title}</h2>
          <p className="hidden text-xs text-stone-500 dark:text-stone-400 sm:block sm:text-sm">Business and government QR suggestion management</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isEligibleRole ? (
            <div className="relative" ref={wrapperRef}>
              <button
                type="button"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 transition hover:border-stone-300 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-600 dark:hover:bg-stone-800"
                aria-label="Open submission notifications"
                onClick={() => setIsOpen((current) => !current)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </button>
              {isOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-stone-700 dark:bg-stone-900">
                  <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-700">
                    <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">New submissions</p>
                    <Link
                      to="/dashboard/submissions"
                      className="text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                      onClick={() => setIsOpen(false)}
                    >
                      View all
                    </Link>
                  </div>
                  {notifications.length > 0 ? (
                    <ul className="max-h-96 overflow-y-auto">
                      {notifications.map((item) => {
                        const isUnread = parseSafeDate(item.submittedAt) > lastSeenAt
                        return (
                          <li key={item._id}>
                            <Link
                              to={`/dashboard/submissions?formId=${encodeURIComponent(item.formId)}`}
                              className="block border-b border-stone-100 px-4 py-3 last:border-b-0 hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-800"
                              onClick={() => setIsOpen(false)}
                            >
                              <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                                New submission on {item.formTitle || 'Untitled Form'}
                              </p>
                              <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                                {getSubmitterName(item)} • {formatRelativeTime(item.submittedAt)}
                              </p>
                              {isUnread ? <span className="mt-1 inline-flex text-[11px] font-semibold text-emerald-600">Unread</span> : null}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="px-4 py-6 text-sm text-stone-500 dark:text-stone-400">No submissions yet.</p>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
