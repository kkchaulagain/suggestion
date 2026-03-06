import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/ui'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center dark:bg-slate-900">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md dark:bg-slate-800 dark:border dark:border-slate-700">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 dark:text-slate-100">Welcome Back 👋</h1>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 dark:bg-slate-700/50">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 dark:text-slate-400">Name</p>
            <h3 className="text-gray-800 font-medium dark:text-slate-200">{user?.name || 'N/A'}</h3>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 dark:bg-slate-700/50">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1 dark:text-slate-400">Email</p>
            <h3 className="text-gray-800 font-medium dark:text-slate-200">{user?.email || 'N/A'}</h3>
          </div>
        </div>
        <Button type="button" variant="danger" size="lg" className="mt-6 w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

export default Dashboard;
