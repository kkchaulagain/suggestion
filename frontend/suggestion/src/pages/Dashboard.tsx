import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { meapi } from '../utils/apipath'

interface User {
  _id: string;
  name: string;
  email: string;
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.get(meapi, {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        
        if (response.data.success) {
          setUser(response.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch user', err)
        setError('Failed to load user data')
        // If unauthorized, maybe redirect to login?
        // But ProtectedRoute handles the initial check.
        // If the token is invalid, we might want to clear it.
        if (axios.isAxiosError(err) && err.response?.status === 401) {
             localStorage.removeItem('isLoggedIn')
             localStorage.removeItem('token')
             navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('token')
    // Ideally call a logout endpoint to clear cookie too
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
     return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md text-center">
            <h1 className="text-xl text-red-500 mb-4">{error}</h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              Retry
            </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back 👋</h1>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Name</p>
            <h3 className="text-gray-800 font-medium">{user?.name || 'N/A'}</h3>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <h3 className="text-gray-800 font-medium">{user?.email || 'N/A'}</h3>
          </div>
        </div>
        <button
          type="button"
          className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-xl transition-colors"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Dashboard;
