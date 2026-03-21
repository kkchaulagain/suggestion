import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { Check, Pencil, RefreshCw, Trash2, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { businessesListApi } from '../../../utils/apipath'
import { Button, Card, Input, Textarea, Select, ErrorMessage, Modal } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'
import BusinessCreateWizard from '../components/BusinessCreateWizard'

export interface BusinessListItem {
  id: string
  owner: string
  businessname: string
  location: string
  pancardNumber: number | string
  description: string
  isPublicCompany?: boolean
}

interface BusinessesResponse {
  businesses: BusinessListItem[]
}

interface BusinessDetailResponse {
  business: BusinessListItem
}

type ModalMode = 'edit' | null
type ViewMode = 'list' | 'create'

export default function BusinessesPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessListItem | null>(null)
  const [editForm, setEditForm] = useState<
    Pick<BusinessListItem, 'businessname' | 'location' | 'pancardNumber' | 'description' | 'isPublicCompany'>
  >({
    businessname: '',
    location: '',
    pancardNumber: 0,
    description: '',
    isPublicCompany: false,
  })
  const [modalError, setModalError] = useState('')
  const [saving, setSaving] = useState(false)
  const { getAuthHeaders } = useAuth()

  const authHeaders = useMemo(
    () => ({
      withCredentials: true,
      headers: getAuthHeaders(),
    }),
    [getAuthHeaders],
  )
  const authHeadersRef = useRef(authHeaders)
  authHeadersRef.current = authHeaders

  const loadBusinesses = useCallback(async () => {
    const headers = authHeadersRef.current
    try {
      setLoading(true)
      setError('')
      const response = await axios.get<BusinessesResponse>(businessesListApi, headers)
      setBusinesses(response.data.businesses ?? [])
    } catch {
      setError('Unable to load businesses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBusinesses()
  }, [loadBusinesses])

  const openEdit = (business: BusinessListItem) => {
    setSelectedBusiness(business)
    setEditForm({
      businessname: business.businessname,
      location: business.location,
      pancardNumber: business.pancardNumber,
      description: business.description,
      isPublicCompany: business.isPublicCompany ?? false,
    })
    setModalMode('edit')
    setModalError('')
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedBusiness(null)
    setModalError('')
  }

  const handleSaveEdit = async () => {
    if (!selectedBusiness) return
    setSaving(true)
    setModalError('')
    try {
      const response = await axios.put<BusinessDetailResponse>(
        `${businessesListApi}/${selectedBusiness.id}`,
        editForm,
        authHeadersRef.current,
      )
      setBusinesses((prev) =>
        prev.map((b) => (b.id === selectedBusiness.id ? response.data.business : b)),
      )
      closeModal()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setModalError(msg || 'Failed to update business.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (business: BusinessListItem) => {
    if (!window.confirm(`Delete "${business.businessname}"? This cannot be undone.`)) return
    setModalError('')
    try {
      await axios.delete(`${businessesListApi}/${business.id}`, authHeadersRef.current)
      setBusinesses((prev) => prev.filter((b) => b.id !== business.id))
      if (selectedBusiness?.id === business.id) closeModal()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to delete business.')
    }
  }

  const handleCreateSuccess = () => {
    setViewMode('list')
    void loadBusinesses()
  }

  if (viewMode === 'create') {
    return (
      <Card>
        <BusinessCreateWizard
          authConfig={authHeaders}
          onCancel={() => setViewMode('list')}
          onSuccess={handleCreateSuccess}
        />
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registered Businesses</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={() => setViewMode('create')}>
            Add business
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void loadBusinesses()} aria-label="Refresh list">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <EmptyState type="loading" message="Loading businesses..." />
      ) : businesses.length === 0 ? (
        <EmptyState type="empty" message="No registered businesses yet." />
      ) : null}

      <div className="mt-4 space-y-4">
        {businesses.map((business) => (
          <div
            key={business.id}
            className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 dark:bg-slate-800/50"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{business.businessname}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Location: {business.location}</p>
                {business.description ? (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{business.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  PAN: {business.pancardNumber ?? 'N/A'} · ID: {business.id}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/dashboard/businesses/${business.id}`)}
                >
                  View
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(business)}>
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(business)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}

      {modalMode === 'edit' && selectedBusiness ? (
        <Modal isOpen onClose={closeModal} title="Edit business">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              void handleSaveEdit()
            }}
          >
            <Input
              id="edit-businessname"
              label="Business name"
              type="text"
              value={editForm.businessname}
              onChange={(v) => setEditForm((f) => ({ ...f, businessname: v }))}
            />
            <Input
              id="edit-location"
              label="Location"
              type="text"
              value={editForm.location}
              onChange={(v) => setEditForm((f) => ({ ...f, location: v }))}
            />
            <Select
              id="edit-company-listing"
              label="Company listing"
              value={editForm.isPublicCompany ? 'public' : 'private'}
              onChange={(v) => setEditForm((f) => ({ ...f, isPublicCompany: v === 'public' }))}
              options={[
                { value: 'private', label: 'Private company' },
                { value: 'public', label: 'Public company' },
              ]}
            />
            <Input
              id="edit-pancard"
              label="PAN number"
              type="number"
              value={editForm.pancardNumber ? String(editForm.pancardNumber) : ''}
              onChange={(v) => setEditForm((f) => ({ ...f, pancardNumber: Number(v) || 0 }))}
            />
            <Textarea
              id="edit-description"
              label="Description"
              value={editForm.description}
              onChange={(v) => setEditForm((f) => ({ ...f, description: v }))}
              rows={3}
            />
            {modalError ? <ErrorMessage message={modalError} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>
                <Check className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Card>
  )
}
