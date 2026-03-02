import './App.css'
import Signup from './auth/Signup'
import Login from './auth/login'
import SuggestionForm from './pages/business/suggestionform'

import ProtectedRoute from './component/ProtectedRoutes'
import GuestRoute from './component/GuestRoute'
import DashboardRouter, { DashboardIndex } from './component/DashboardRouter'
import { AuthProvider } from './context/AuthContext'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import FormsPage from './pages/business-dashboard/pages/FormsPage'
import CreateFormPage from './pages/business-dashboard/pages/CreateFormPage'
import BusinessesPage from './pages/business-dashboard/pages/BusinessesPage'
import FormRenderLayout from './pages/feedback-form-render/FormRenderLayout'
import FormRenderPage from './pages/feedback-form-render/FormRenderPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            }
          />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <Signup />
              </GuestRoute>
            }
          />
          {/* Main dashboard: business users see forms, regular users see profile */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardIndex />} />
            <Route path="forms" element={<FormsPage />} />
            <Route path="forms/create" element={<CreateFormPage />} />
            <Route path="businesses" element={<BusinessesPage />} />
          </Route>
          {/* Legacy: redirect old business-dashboard URLs to main dashboard */}
          <Route path="/business-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/business-dashboard/forms" element={<Navigate to="/dashboard/forms" replace />} />
          <Route path="/business-dashboard/forms/create" element={<Navigate to="/dashboard/forms/create" replace />} />
          <Route
            path="/business-form"
            element={
              <ProtectedRoute>
                <SuggestionForm />
              </ProtectedRoute>
            }
          />
          {/* Public form render: no auth, minimal layout */}
          <Route path="/feedback-forms" element={<FormRenderLayout />}>
            <Route path=":formId" element={<FormRenderPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
