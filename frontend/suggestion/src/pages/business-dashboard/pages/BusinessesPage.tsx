import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../../../context/AuthContext'
import { businessesListApi } from '../../../utils/apipath'

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

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<BusinessListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Registered Businesses</h3>
        <button
          type="button"
          onClick={() => void loadBusinesses()}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700"
        >
          Refresh
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500">Loading businesses...</p> : null}
      {!loading && businesses.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No registered businesses yet.</p>
      ) : null}

      <div className="mt-4 space-y-4">
        {businesses.map((business) => (
          <div key={business.id} className="rounded-xl border border-slate-200 p-4">
            <p className="text-base font-semibold text-slate-900">{business.businessname}</p>
            <p className="mt-1 text-sm text-slate-600">Location: {business.location}</p>
            {business.description ? (
              <p className="mt-1 text-sm text-slate-600">{business.description}</p>
            ) : null}
            <p className="mt-2 text-xs text-slate-500">
              PAN: {business.pancardNumber ?? 'N/A'} · ID: {business.id}
            </p>
          </div>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}
    </section>
  )
}
