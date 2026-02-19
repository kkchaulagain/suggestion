import { useEffect, useState } from 'react'
import './App.css'
import Signup from './pages/Signup'
import Login from './pages/login'

function App() {
  const [path, setPath] = useState(window.location.pathname.toLowerCase())

  useEffect(() => {
    const onPathChange = () => setPath(window.location.pathname.toLowerCase())
    window.addEventListener('popstate', onPathChange)
    return () => window.removeEventListener('popstate', onPathChange)
  }, [])

  if (path === '/login') {
    return <Login />
  }

  if (path === '/signup' || path === '/') {
    return <Signup />
  }

  return <Login />
}

export default App
