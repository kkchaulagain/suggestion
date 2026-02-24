import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { businessmeapi } from '../utils/apipath'

interface User {
  _id: string
  name?: string
  email: string
  role?: 'business' | 'user' | 'governmentservices'
}

interface BusinessData {
  _id: string
  location: string
  pancardNumber: number
  description: string
  owner: User
  businessname?: string
}

export default function BusinessDashboard() {
  const navigate = useNavigate()
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(businessmeapi, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        const currentBusiness = response?.data?.data as BusinessData | undefined
        if (!currentBusiness) {
          setError('Unable to load your business details')
          return
        }

        setBusiness(currentBusiness)
      } catch (err) {
        setError('Failed to load business data')
        if (axios.isAxiosError(err)) {
          const status = err.response?.status
          if (status === 401) {
            localStorage.removeItem('isLoggedIn')
            localStorage.removeItem('token')
            navigate('/login', { replace: true })
          } else if (status === 403) {
            navigate('/dashboard', { replace: true })
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('token')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100">
        <p className="text-slate-600">Loading business dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-100 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-md">
          <h1 className="text-lg font-semibold text-red-600">{error}</h1>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 sm:p-10">
      <section className="mx-auto w-full max-w-5xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Business Portal</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">Business Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Manage your organization profile and track suggestions.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Logout
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Business Name</p>
            <p className="mt-2 text-base font-medium text-slate-800">{business?.businessname || 'N/A'}</p>
          </article>
        
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
            <p className="mt-2 text-base font-medium text-slate-800">{business?.location || 'N/A'}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">PAN Card Number</p>
            <p className="mt-2 text-base font-medium text-slate-800">{business?.pancardNumber ?? 'N/A'}</p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
            <p className="mt-2 text-base font-medium text-slate-800">{business?.description || 'N/A'}</p>
          </article>
        </div>
      </section>
    </main>
  )
}
