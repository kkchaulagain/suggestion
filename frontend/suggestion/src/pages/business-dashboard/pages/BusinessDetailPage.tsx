import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Star,
  Tag,
  X,
  ClipboardList,
  Activity,
} from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { businessesListApi } from '../../../utils/apipath'
import { Badge, Button, ErrorMessage, Input, Modal, Select, Textarea } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BusinessListItem {
  id: string
  owner: string
  type?: string
  businessname: string
  location?: string
  pancardNumber?: string | number
  description: string
  isPublicCompany?: boolean
  mapLocation?: {
    googleMapsUrl?: string
    googleReviewsUrl?: string
    latitude?: number
    longitude?: number
    placeId?: string
  }
}

export interface CrmNote {
  id: string
  text: string
  createdAt: string
}
export interface CrmTask {
  id: string
  title: string
  completed: boolean
  dueDate?: string
  createdAt: string
}
export interface CrmTimeline {
  id: string
  eventType: string
  summary: string
  createdAt: string
}
export interface CustomFieldRow {
  key: string
  value: unknown
  fieldType: string
}
export interface BusinessDetailResponse {
  ok: boolean
  business: BusinessListItem
  crm: {
    tags: string[]
    customFields: CustomFieldRow[]
    notes: CrmNote[]
    tasks: CrmTask[]
    timeline: CrmTimeline[]
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function timeAgo(iso?: string) {
  if (!iso) return '—'
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(iso)
  } catch {
    return iso ?? '—'
  }
}

const EVENT_COLORS: Record<string, string> = {
  note: 'text-sky-600 bg-sky-50 dark:text-sky-400 dark:bg-sky-900/20',
  task: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20',
  profile: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20',
  tags: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  timeline: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',
}
function eventColor(type: string) {
  return EVENT_COLORS[type] ?? 'text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-700'
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'notes' | 'tasks' | 'activity'

const TABS: { id: TabId; label: string; icon: typeof MessageSquare }[] = [
  { id: 'notes', label: 'Notes', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
  { id: 'activity', label: 'Activity', icon: Activity },
]

// ─── Sidebar info row ─────────────────────────────────────────────────────────

function InfoRow({ label, value, link }: { label: string; value?: string | number | null; link?: string }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex flex-col gap-0.5 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400 truncate"
        >
          {String(value)}
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      ) : (
        <span className="text-sm text-slate-700 dark:text-slate-200 leading-snug break-words">{String(value)}</span>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BusinessDetailPage() {
  const { businessId } = useParams<{ businessId: string }>()
  const { getAuthHeaders } = useAuth()
  const authConfig = useMemo(
    () => ({ withCredentials: true, headers: getAuthHeaders() }),
    [getAuthHeaders],
  )
  const authConfigRef = useRef(authConfig)
  authConfigRef.current = authConfig

  const [data, setData] = useState<BusinessDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [patchError, setPatchError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('notes')
  const [editOpen, setEditOpen] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const [profileDraft, setProfileDraft] = useState({
    businessname: '',
    location: '',
    pancardNumber: '',
    description: '',
    isPublicCompany: false,
    mapGoogleMapsUrl: '',
    mapGoogleReviewsUrl: '',
    mapLatitude: '',
    mapLongitude: '',
    mapPlaceId: '',
  })

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!businessId) return
    setLoading(true)
    setError('')
    try {
      const res = await axios.get<BusinessDetailResponse>(
        `${businessesListApi}/${businessId}/detail`,
        authConfigRef.current,
      )
      setData(res.data)
      const b = res.data.business
      const m = b.mapLocation
      setProfileDraft({
        businessname: b.businessname ?? '',
        location: String(b.location ?? ''),
        pancardNumber: String(b.pancardNumber ?? ''),
        description: b.description ?? '',
        isPublicCompany: b.isPublicCompany ?? false,
        mapGoogleMapsUrl: m?.googleMapsUrl ?? '',
        mapGoogleReviewsUrl: m?.googleReviewsUrl ?? '',
        mapLatitude: m?.latitude != null && !Number.isNaN(m.latitude) ? String(m.latitude) : '',
        mapLongitude: m?.longitude != null && !Number.isNaN(m.longitude) ? String(m.longitude) : '',
        mapPlaceId: m?.placeId ?? '',
      })
    } catch {
      setError('Could not load business.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [businessId])

  useEffect(() => { void load() }, [load])

  // ── Patch ───────────────────────────────────────────────────────────────────

  const patch = async (body: Record<string, unknown>) => {
    if (!businessId) return
    setPatchError('')
    setSaving(true)
    try {
      const res = await axios.patch<BusinessDetailResponse>(
        `${businessesListApi}/${businessId}/detail`,
        body,
        authConfigRef.current,
      )
      setData(res.data)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPatchError(msg || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = () => {
    void patch({
      profile: {
        businessname: profileDraft.businessname.trim(),
        location: profileDraft.location.trim(),
        pancardNumber: profileDraft.pancardNumber.trim(),
        description: profileDraft.description.trim(),
        isPublicCompany: profileDraft.isPublicCompany,
        mapLocation: {
          googleMapsUrl: profileDraft.mapGoogleMapsUrl.trim(),
          googleReviewsUrl: profileDraft.mapGoogleReviewsUrl.trim(),
          placeId: profileDraft.mapPlaceId.trim(),
          latitude: profileDraft.mapLatitude.trim(),
          longitude: profileDraft.mapLongitude.trim(),
        },
      },
    })
    setEditOpen(false)
  }

  const addNote = () => {
    const t = newNote.trim()
    if (!t) return
    setNewNote('')
    void patch({ addNote: { text: t } })
  }

  const addTask = () => {
    const t = newTaskTitle.trim()
    if (!t) return
    setNewTaskTitle('')
    void patch({ addTask: { title: t } })
  }

  const toggleTask = (taskId: string, completed: boolean) => {
    void patch({ updateTask: { taskId, completed: !completed } })
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (!t || !data) return
    if (data.crm.tags.includes(t)) { setTagInput(''); return }
    setTagInput('')
    void patch({ tags: [...data.crm.tags, t] })
  }

  // ── Loading / error states ──────────────────────────────────────────────────

  if (!businessId) return <ErrorMessage message="Missing business id." />

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 dark:border-rose-900 dark:bg-rose-900/10">
        <ErrorMessage message={error || 'Not found'} />
        <Link to="/dashboard/businesses" className="mt-4 inline-block text-sm text-emerald-600 hover:underline dark:text-emerald-400">
          ← Back to businesses
        </Link>
      </div>
    )
  }

  const { business, crm } = data
  const pendingTasks = crm.tasks.filter((t) => !t.completed).length
  const completedTasks = crm.tasks.length - pendingTasks
  const tabCounts: Record<TabId, number> = {
    notes: crm.notes.length,
    tasks: crm.tasks.length,
    activity: crm.timeline.length,
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen space-y-0">

      {/* ── Hero header ─────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard/businesses">
              <Button variant="ghost" size="sm" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            {/* Logo avatar */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {business.businessname}
                </h1>
                <Badge variant={business.isPublicCompany ? 'info' : 'neutral'}>
                  {business.isPublicCompany ? 'Public' : 'Private'}
                </Badge>
                <Badge variant={business.type === 'personal' ? 'warning' : 'success'}>
                  {business.type ?? 'commercial'}
                </Badge>
                {crm.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    <Tag className="h-2.5 w-2.5" />
                    {tag}
                  </span>
                ))}
                {crm.tags.length > 3 && (
                  <span className="text-xs text-slate-400">+{crm.tags.length - 3}</span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {business.location ? `${business.location} · ` : ''}
                ID: {business.id.slice(-8)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {patchError ? (
              <span className="text-xs text-rose-500">{patchError}</span>
            ) : null}
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : null}
            <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-0 lg:flex-row">

        {/* ── Left sidebar ──────────────────────────────────────────────── */}
        <aside className="w-full shrink-0 border-b border-slate-200 bg-slate-50/60 dark:border-slate-700 dark:bg-slate-900/40 lg:w-72 lg:border-b-0 lg:border-r lg:min-h-[calc(100vh-57px)]">
          <div className="p-5">

            {/* Quick stats row */}
            <div className="mb-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{crm.notes.length}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Notes</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-lg font-bold text-violet-600 dark:text-violet-400">{pendingTasks}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Open</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-center dark:border-slate-700 dark:bg-slate-800">
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">Done</p>
              </div>
            </div>

            {/* Core info */}
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-1 dark:border-slate-700 dark:bg-slate-800">
              <InfoRow label="Description" value={business.description} />
              <InfoRow label="Location" value={business.location} />
              <InfoRow label="PAN / Tax ID" value={business.pancardNumber} />
              <InfoRow label="Listing" value={business.isPublicCompany ? 'Public company' : 'Private company'} />
              <InfoRow label="Type" value={business.type ?? 'commercial'} />
            </div>

            {/* Map & location */}
            {business.mapLocation && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-1 dark:border-slate-700 dark:bg-slate-800">
                <p className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Map & Location</p>
                {business.mapLocation.googleMapsUrl ? (
                  <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <a
                      href={business.mapLocation.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      <MapPin className="h-3.5 w-3.5" /> Open in Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
                {business.mapLocation.googleReviewsUrl ? (
                  <div className="py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <a
                      href={business.mapLocation.googleReviewsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-amber-600 hover:underline dark:text-amber-400"
                    >
                      <Star className="h-3.5 w-3.5" /> View Reviews
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ) : null}
                {business.mapLocation.latitude != null && business.mapLocation.longitude != null ? (
                  <div className="py-2.5">
                    <span className="text-[11px] text-slate-400">Coordinates</span>
                    <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {business.mapLocation.latitude}, {business.mapLocation.longitude}
                    </p>
                  </div>
                ) : null}
              </div>
            )}

            {/* Custom fields */}
            {crm.customFields.length > 0 ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-1 dark:border-slate-700 dark:bg-slate-800">
                <p className="py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Custom Fields</p>
                {crm.customFields.map((cf) => (
                  <div key={cf.key} className="border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{cf.key}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{String(cf.value ?? '')}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Tags */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tags</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {crm.tags.length === 0 ? (
                  <span className="text-xs text-slate-400">No tags yet</span>
                ) : (
                  crm.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    >
                      {tag}
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-1.5">
                <input
                  className="flex-1 rounded-lg border border-slate-200 bg-transparent px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:text-slate-200"
                  placeholder="Add tag…"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main panel ────────────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Tab bar */}
          <div className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <nav className="flex px-6">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      active
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                    {tabCounts[tab.id] > 0 ? (
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {tabCounts[tab.id]}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab content */}
          <div className="p-6">

            {/* ── Notes tab ────────────────────────────────────────────── */}
            {activeTab === 'notes' ? (
              <div className="space-y-4">
                {/* Add note */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">New note</p>
                  <Textarea
                    id="detail-note"
                    label=""
                    value={newNote}
                    onChange={setNewNote}
                    rows={3}
                    placeholder="Type a note and press Add…"
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={saving || !newNote.trim()}
                      onClick={addNote}
                      data-testid="detail-add-note"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Add note
                    </Button>
                  </div>
                </div>

                {/* Notes list */}
                {crm.notes.length === 0 ? (
                  <EmptyState type="empty" message="No notes yet. Add the first one above." />
                ) : (
                  <div className="space-y-3">
                    {[...crm.notes].reverse().map((n) => (
                      <div key={n.id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">{n.text}</p>
                        <p className="mt-2 text-[11px] text-slate-400">{formatDate(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* ── Tasks tab ────────────────────────────────────────────── */}
            {activeTab === 'tasks' ? (
              <div className="space-y-4">
                {/* Add task */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">New task</p>
                  <div className="flex gap-2">
                    <Input
                      id="detail-task"
                      label=""
                      value={newTaskTitle}
                      onChange={setNewTaskTitle}
                      placeholder="Task title…"
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={saving || !newTaskTitle.trim()}
                        onClick={addTask}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Task summary bar */}
                {crm.tasks.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Circle className="h-3 w-3 text-violet-500" />
                      {pendingTasks} pending
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      {completedTasks} done
                    </span>
                  </div>
                )}

                {crm.tasks.length === 0 ? (
                  <EmptyState type="empty" message="No tasks yet." />
                ) : (
                  <div className="space-y-2">
                    {crm.tasks.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                          t.completed
                            ? 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleTask(t.id, t.completed)}
                          className="mt-0.5 shrink-0"
                          aria-label={t.completed ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {t.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300 hover:text-emerald-400 dark:text-slate-600" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${t.completed ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                            {t.title}
                          </p>
                          {t.dueDate ? (
                            <p className="mt-0.5 text-[11px] text-slate-400">Due: {formatDate(t.dueDate)}</p>
                          ) : (
                            <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(t.createdAt)}</p>
                          )}
                        </div>
                        {t.completed ? (
                          <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* ── Activity tab ──────────────────────────────────────────── */}
            {activeTab === 'activity' ? (
              <div>
                {crm.timeline.length === 0 ? (
                  <EmptyState type="empty" message="No activity yet." />
                ) : (
                  <div className="relative space-y-0 pl-6">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" aria-hidden />
                    {[...crm.timeline].reverse().map((ev) => (
                      <div key={ev.id} className="relative mb-4 last:mb-0">
                        {/* Dot */}
                        <span className={`absolute -left-5 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${eventColor(ev.eventType)}`}>
                          {ev.eventType.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${eventColor(ev.eventType)}`}>
                              {ev.eventType}
                            </span>
                            <span className="text-sm text-slate-700 dark:text-slate-300">{ev.summary}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-400">{timeAgo(ev.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

          </div>
        </main>
      </div>

      {/* ── Edit dialog ─────────────────────────────────────────────────── */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit business" size="xl">
        <div className="max-h-[75vh] overflow-y-auto pr-1 space-y-6">

          {/* Section: Core profile */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Building2 className="h-3.5 w-3.5" /> Core profile
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="edit-name"
                label="Business name"
                value={profileDraft.businessname}
                onChange={(v) => setProfileDraft((p) => ({ ...p, businessname: v }))}
                className="sm:col-span-2"
              />
              <Input
                id="edit-location"
                label="Location / address"
                value={profileDraft.location}
                onChange={(v) => setProfileDraft((p) => ({ ...p, location: v }))}
              />
              <Input
                id="edit-pan"
                label="PAN / tax ID"
                value={profileDraft.pancardNumber}
                onChange={(v) => setProfileDraft((p) => ({ ...p, pancardNumber: v }))}
              />
              <Select
                id="edit-listing"
                label="Company listing"
                value={profileDraft.isPublicCompany ? 'public' : 'private'}
                onChange={(v) => setProfileDraft((p) => ({ ...p, isPublicCompany: v === 'public' }))}
                options={[
                  { value: 'private', label: 'Private company' },
                  { value: 'public', label: 'Public company' },
                ]}
              />
              <Textarea
                id="edit-desc"
                label="Description"
                value={profileDraft.description}
                onChange={(v) => setProfileDraft((p) => ({ ...p, description: v }))}
                rows={3}
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Section: Map & location */}
          <div>
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> Map &amp; location
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-600 normal-case tracking-normal dark:bg-sky-900/30 dark:text-sky-400">
                Powers public map pins
              </span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                id="edit-maps-url"
                label="Google Maps URL"
                type="url"
                value={profileDraft.mapGoogleMapsUrl}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapGoogleMapsUrl: v }))}
                placeholder="https://maps.google.com/..."
              />
              <Input
                id="edit-reviews-url"
                label="Google Reviews URL"
                type="url"
                value={profileDraft.mapGoogleReviewsUrl}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapGoogleReviewsUrl: v }))}
                placeholder="https://..."
              />
              <Input
                id="edit-lat"
                label="Latitude"
                type="text"
                inputMode="decimal"
                value={profileDraft.mapLatitude}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapLatitude: v }))}
                placeholder="e.g. 27.7172"
              />
              <Input
                id="edit-lng"
                label="Longitude"
                type="text"
                inputMode="decimal"
                value={profileDraft.mapLongitude}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapLongitude: v }))}
                placeholder="e.g. 85.3240"
              />
              <Input
                id="edit-place-id"
                label="Google Place ID (optional)"
                type="text"
                value={profileDraft.mapPlaceId}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapPlaceId: v }))}
                placeholder="ChIJ..."
                className="sm:col-span-2"
              />
            </div>
          </div>

          {/* Section: Web presence hint */}
          {(profileDraft.mapGoogleMapsUrl || profileDraft.mapGoogleReviewsUrl) && (
            <div className="flex flex-wrap gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10">
              {profileDraft.mapGoogleMapsUrl && (
                <a
                  href={profileDraft.mapGoogleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  <MapPin className="h-3.5 w-3.5" /> Preview Maps
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profileDraft.mapGoogleReviewsUrl && (
                <a
                  href={profileDraft.mapGoogleReviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-amber-700 hover:underline dark:text-amber-400"
                >
                  <Star className="h-3.5 w-3.5" /> Preview Reviews
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {profileDraft.mapGoogleMapsUrl && (
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(profileDraft.businessname)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-sky-700 hover:underline dark:text-sky-400"
                >
                  <Globe className="h-3.5 w-3.5" /> Google Search
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Dialog actions */}
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-700">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(false)}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={saving} onClick={saveProfile}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
