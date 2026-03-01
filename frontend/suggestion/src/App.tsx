import './App.css'
import Signup from './auth/Signup'
import Login from './auth/login'
import Dashboard from './pages/Dashboard'
import SuggestionForm from './pages/business/suggestionform'

import ProtectedRoute from './component/ProtectedRoutes'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import BusinessDashboardLayout from './pages/business-dashboard/layout/BusinessDashboardLayout'


import FormsPage from './pages/business-dashboard/pages/FormsPage'
import CreateFormPage from './pages/business-dashboard/pages/CreateFormPage'


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business-dashboard"
          element={
            <ProtectedRoute>
              <BusinessDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="forms" replace />} />
          <Route path="forms" element={<FormsPage />} />
          <Route path="forms/create" element={<CreateFormPage />} />

        </Route>
        <Route
          path="/business-form"
          element={
            <ProtectedRoute>
              <SuggestionForm />
            </ProtectedRoute>
          }
        />
       
      </Routes>
    </BrowserRouter>
  )
}

export default App
