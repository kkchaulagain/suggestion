import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'
import { businessesListApi } from '../../../utils/apipath'
import { Button, Card, Input, Label, ErrorMessage } from '../../../components/ui'

interface BusinessListItem {
  id: string
  owner: string
  businessname: string
  location: string
  pancardNumber: number
  description: string
}

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

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Registered Businesses</h3>
        <Button type="button" variant="secondary" size="sm" onClick={() => void loadBusinesses()}>
          Refresh
        </Button>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading businesses...</p> : null}
      {!loading && businesses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No registered businesses yet.</p>
      ) : null}

      <div className="mt-4 space-y-4">
        {businesses.map((business) => (
          <div key={business.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{business.businessname}</p>
                <p className="mt-1 text-sm text-slate-600">Location: {business.location}</p>
                {business.description ? (
                  <p className="mt-1 text-sm text-slate-600">{business.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-slate-500">
                  PAN: {business.pancardNumber ?? 'N/A'} · ID: {business.id}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => openView(business)}>
                  View
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(business)}>
                  Edit
                </Button>
                <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(business)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error ? <ErrorMessage message={error} className="mt-4" /> : null}

      {modalMode && selectedBusiness ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-lg font-bold text-slate-900">
              {modalMode === 'view' ? 'Business details' : 'Edit business'}
            </h2>

            {modalMode === 'view' ? (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Name:</span> {selectedBusiness.businessname}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Location:</span> {selectedBusiness.location}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">PAN:</span> {selectedBusiness.pancardNumber ?? 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Description:</span>{' '}
                  {selectedBusiness.description || '—'}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="font-semibold">ID:</span> {selectedBusiness.id} ·{' '}
                  <span className="font-semibold">Owner:</span> {selectedBusiness.owner}
                </p>
              </div>
            ) : (
              <form
                className="mt-4 space-y-4"
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
                <div>
                  <Label htmlFor="edit-description" size="sm" className="font-semibold text-slate-700">
                    Description
                  </Label>
                  <textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
                {modalError ? <ErrorMessage message={modalError} /> : null}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            )}

            {modalMode === 'view' ? (
              <div className="mt-4 flex justify-end">
                <Button type="button" variant="secondary" size="sm" onClick={closeModal}>
                  Close
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
