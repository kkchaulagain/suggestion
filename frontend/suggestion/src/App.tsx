import './App.css'
import Signup from './auth/Signup'
import Login from './auth/login'
import SuggestionForm from './pages/business/suggestionform'

import ProtectedRoute from './component/ProtectedRoutes'
import GuestRoute from './component/GuestRoute'
import RoleGuard from './component/RoleGuard'
import DashboardRouter, { DashboardIndex } from './component/DashboardRouter'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import FormsPage from './pages/business-dashboard/pages/FormsPage'
import CreateFormPage from './pages/business-dashboard/pages/CreateFormPage'
import SubmissionsPage from './pages/business-dashboard/pages/SubmissionsPage'
import BusinessesPage from './pages/business-dashboard/pages/BusinessesPage'
import FormRenderLayout from './pages/feedback-form-render/FormRenderLayout'
import FormRenderPage from './pages/feedback-form-render/FormRenderPage'
import ProfilePage from './pages/business-dashboard/pages/ProfilePage'
import UsersPage from './pages/business-dashboard/pages/UsersPage'

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
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
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="businesses" element={<RoleGuard roles={['admin']}><BusinessesPage /></RoleGuard>} />
            <Route path="users" element={<RoleGuard roles={['admin']}><UsersPage /></RoleGuard>} />
            <Route path="profile" element={<ProfilePage />} />
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
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
