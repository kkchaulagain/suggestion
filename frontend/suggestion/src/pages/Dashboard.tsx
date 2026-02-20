const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Welcome Back 👋</h1>
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Name</p>
            <h3 className="text-gray-800 font-medium">John Doe</h3>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <h3 className="text-gray-800 font-medium">john@example.com</h3>
          </div>
        </div>
        <button className="mt-6 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-xl transition-colors">
          Logout
        </button>
      </div>
    </div>
  )
}

export default Dashboard;