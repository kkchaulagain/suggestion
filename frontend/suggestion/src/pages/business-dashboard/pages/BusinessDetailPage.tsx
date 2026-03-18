import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Plus } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { businessesListApi } from '../../../utils/apipath'
import { Button, Card, ErrorMessage, Input, Textarea, Select } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'
import { isSectionEnabled, type DetailSectionId } from './businessDetailPageConfig'

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

function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

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
  const [newNote, setNewNote] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [tagInput, setTagInput] = useState('')

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

  useEffect(() => {
    void load()
  }, [load])

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
    if (data.crm.tags.includes(t)) {
      setTagInput('')
      return
    }
    setTagInput('')
    void patch({ tags: [...data.crm.tags, t] })
  }

  if (!businessId) {
    return <ErrorMessage message="Missing business id." />
  }

  if (loading) {
    return (
      <Card>
        <EmptyState type="loading" message="Loading business…" />
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <ErrorMessage message={error || 'Not found'} />
        <Link to="/dashboard/businesses" className="mt-4 inline-block text-emerald-600 dark:text-emerald-400">
          Back to businesses
        </Link>
      </Card>
    )
  }

  const { business, crm } = data
  const enabled = (id: DetailSectionId) => isSectionEnabled(id)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/dashboard/businesses">
            <Button type="button" variant="ghost" size="sm" aria-label="Back to list">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{business.businessname}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">ID: {business.id}</p>
          </div>
        </div>
      </div>

      {patchError ? <ErrorMessage message={patchError} /> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        {enabled('overview') ? (
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Profile</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Core business fields</p>
            <div className="mt-4 space-y-3">
              <Input
                id="detail-name"
                label="Business name"
                value={profileDraft.businessname}
                onChange={(v) => setProfileDraft((p) => ({ ...p, businessname: v }))}
              />
              <Input
                id="detail-location"
                label="Location"
                value={profileDraft.location}
                onChange={(v) => setProfileDraft((p) => ({ ...p, location: v }))}
              />
              <Select
                id="detail-company-listing"
                label="Company listing"
                value={profileDraft.isPublicCompany ? 'public' : 'private'}
                onChange={(v) => setProfileDraft((p) => ({ ...p, isPublicCompany: v === 'public' }))}
                options={[
                  { value: 'private', label: 'Private company' },
                  { value: 'public', label: 'Public company' },
                ]}
              />
              <Input
                id="detail-pan"
                label="PAN / tax ID"
                value={profileDraft.pancardNumber}
                onChange={(v) => setProfileDraft((p) => ({ ...p, pancardNumber: v }))}
              />
              <Textarea
                id="detail-desc"
                label="Description"
                value={profileDraft.description}
                onChange={(v) => setProfileDraft((p) => ({ ...p, description: v }))}
                rows={4}
              />
              <Button type="button" variant="primary" size="sm" disabled={saving} onClick={saveProfile}>
                Save profile
              </Button>
            </div>
          </Card>
        ) : null}

        {enabled('overview') ? (
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Map &amp; location</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Structured data for maps. Public businesses with latitude &amp; longitude appear in{' '}
              <code className="rounded bg-slate-100 px-1 text-xs dark:bg-slate-800">GET /api/v1/business/map-pins</code>.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Input
                id="detail-maps-url"
                label="Google Maps URL"
                type="url"
                value={profileDraft.mapGoogleMapsUrl}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapGoogleMapsUrl: v }))}
                placeholder="https://maps.google.com/..."
              />
              <Input
                id="detail-reviews-url"
                label="Google Reviews URL"
                type="url"
                value={profileDraft.mapGoogleReviewsUrl}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapGoogleReviewsUrl: v }))}
                placeholder="https://..."
              />
              <Input
                id="detail-lat"
                label="Latitude"
                type="text"
                inputMode="decimal"
                value={profileDraft.mapLatitude}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapLatitude: v }))}
                placeholder="e.g. 27.7172"
              />
              <Input
                id="detail-lng"
                label="Longitude"
                type="text"
                inputMode="decimal"
                value={profileDraft.mapLongitude}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapLongitude: v }))}
                placeholder="e.g. 85.3240"
              />
              <Input
                id="detail-place-id"
                className="sm:col-span-2"
                label="Google Place ID (optional)"
                type="text"
                value={profileDraft.mapPlaceId}
                onChange={(v) => setProfileDraft((p) => ({ ...p, mapPlaceId: v }))}
                placeholder="ChIJ..."
              />
            </div>
            <Button type="button" variant="secondary" size="sm" className="mt-4" disabled={saving} onClick={saveProfile}>
              Save map &amp; profile
            </Button>
          </Card>
        ) : null}

        {enabled('tags') ? (
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tags</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {crm.tags.length === 0 ? (
                <span className="text-sm text-slate-500">No tags</span>
              ) : (
                crm.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-200 px-2 py-0.5 text-xs dark:bg-slate-700"
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                id="detail-tag"
                label="Add tag"
                value={tagInput}
                onChange={setTagInput}
                placeholder="e.g. priority"
              />
              <div className="flex items-end">
                <Button type="button" variant="secondary" size="sm" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </Card>
        ) : null}

        {enabled('customFields') && crm.customFields.length > 0 ? (
          <Card className="lg:col-span-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Custom fields</h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {crm.customFields.map((cf) => (
                <li key={cf.key} className="text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{cf.key}:</span>{' '}
                  <span className="text-slate-600 dark:text-slate-400">{String(cf.value ?? '')}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {enabled('notes') ? (
          <Card className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Notes</h3>
            <div className="mt-3 flex gap-2">
              <Textarea
                id="detail-note"
                label="New note"
                value={newNote}
                onChange={setNewNote}
                rows={2}
              />
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                  onClick={addNote}
                  data-testid="detail-add-note"
                >
                  Add note
                </Button>
              </div>
            </div>
            <ul className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              {crm.notes.length === 0 ? (
                <li className="text-sm text-slate-500">No notes yet.</li>
              ) : (
                [...crm.notes]
                  .reverse()
                  .map((n) => (
                    <li key={n.id} className="text-sm">
                      <p className="text-slate-800 dark:text-slate-200">{n.text}</p>
                      <p className="text-xs text-slate-500">{formatDate(n.createdAt)}</p>
                    </li>
                  ))
              )}
            </ul>
          </Card>
        ) : null}

        {enabled('tasks') ? (
          <Card>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Tasks</h3>
            <div className="mt-2 flex gap-2">
              <Input
                id="detail-task"
                label="New task"
                value={newTaskTitle}
                onChange={setNewTaskTitle}
              />
              <div className="flex items-end">
                <Button type="button" variant="secondary" size="sm" onClick={addTask}>
                  Add
                </Button>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {crm.tasks.length === 0 ? (
                <li className="text-sm text-slate-500">No tasks.</li>
              ) : (
                crm.tasks.map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={t.completed}
                      onChange={() => toggleTask(t.id, t.completed)}
                      className="mt-1"
                    />
                    <span className={t.completed ? 'text-slate-400 line-through' : ''}>{t.title}</span>
                  </li>
                ))
              )}
            </ul>
          </Card>
        ) : null}

        {enabled('timeline') ? (
          <Card className="lg:col-span-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Activity</h3>
            <ul className="mt-3 space-y-2">
              {crm.timeline.length === 0 ? (
                <li className="text-sm text-slate-500">No activity yet.</li>
              ) : (
                [...crm.timeline]
                  .reverse()
                  .map((ev) => (
                    <li key={ev.id} className="flex flex-wrap gap-2 border-b border-slate-100 py-2 text-sm dark:border-slate-800">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">{ev.eventType}</span>
                      <span className="text-slate-700 dark:text-slate-300">{ev.summary}</span>
                      <span className="text-xs text-slate-500">{formatDate(ev.createdAt)}</span>
                    </li>
                  ))
              )}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  )
}
