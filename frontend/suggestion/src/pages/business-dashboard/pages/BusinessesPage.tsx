import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Check, Eye, Pencil, RefreshCw, Trash2, X } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import { businessesListApi } from '../../../utils/apipath'
import { Button, Card, Input, Textarea, ErrorMessage, Modal } from '../../../components/ui'
import { EmptyState } from '../../../components/layout'
import BusinessesTable from '../components/BusinessesTable'
import type { BusinessListItem } from '../types/business'

interface BusinessesResponse {
  businesses: BusinessListItem[]
}

interface BusinessDetailResponse {
  business: BusinessListItem
}

type ModalMode = 'view' | 'edit' | null

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessListItem | null>(null)
  const [editForm, setEditForm] = useState<Pick<BusinessListItem, 'businessname' | 'location' | 'pancardNumber' | 'description'>>({
    businessname: '',
    location: '',
    pancardNumber: 0,
    description: '',
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

  const openView = (business: BusinessListItem) => {
    setSelectedBusiness(business)
    setModalMode('view')
    setModalError('')
  }

  const openEdit = (business: BusinessListItem) => {
    setSelectedBusiness(business)
    setEditForm({
      businessname: business.businessname,
      location: business.location,
      pancardNumber: business.pancardNumber,
      description: business.description,
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
        prev.map((business) => (business.id === selectedBusiness.id ? response.data.business : business)),
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
      setBusinesses((prev) => prev.filter((candidate) => candidate.id !== business.id))
      if (selectedBusiness?.id === business.id) closeModal()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Failed to delete business.')
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registered Businesses</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => void loadBusinesses()}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <EmptyState type="loading" message="Loading businesses..." />
      ) : businesses.length === 0 ? (
        <EmptyState type="empty" message="No registered businesses yet." />
      ) : null}

      <BusinessesTable
        businesses={businesses}
        onView={openView}
        onEdit={openEdit}
        onDelete={(business) => {
          void handleDelete(business)
        }}
      />

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}

      {modalMode && selectedBusiness ? (
        <Modal
          isOpen
          onClose={closeModal}
          title={modalMode === 'view' ? 'Business details' : 'Edit business'}
        >
          {modalMode === 'view' ? (
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Name:</span> {selectedBusiness.businessname}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Location:</span> {selectedBusiness.location}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">PAN:</span> {selectedBusiness.pancardNumber ?? 'N/A'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">Description:</span>{' '}
                  {selectedBusiness.description || '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">ID:</span> {selectedBusiness.id} ·{' '}
                  <span className="font-semibold">Owner:</span> {selectedBusiness.owner}
                </p>
              </div>
            ) : (
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
                <Input
                  id="edit-pancard"
                  label="PAN number"
                  type="number"
                  value={editForm.pancardNumber ? String(editForm.pancardNumber) : ''}
                  onChange={(v) =>
                    setEditForm((f) => ({ ...f, pancardNumber: Number(v) || 0 }))
                  }
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
            )}

            {modalMode === 'view' ? (
              <div className="flex justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                  <X className="h-4 w-4" />
                  Close
                </Button>
              </div>
            ) : null}
        </Modal>
      ) : null}
    </Card>
  )
}
