import './App.css'
import Signup from './auth/Signup'
import Login from './auth/login'
import LandingPage from './pages/landing/LandingPage'
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
import PagesPage from './pages/business-dashboard/pages/PagesPage'
import CreatePagePage from './pages/business-dashboard/pages/CreatePagePage'
import SubmissionsPage from './pages/business-dashboard/pages/SubmissionsPage'
import BusinessOnboardingPage from './pages/business-dashboard/pages/BusinessOnboardingPage'
import PublicPageView from './pages/cms-public/PublicPageView'
import BusinessesPage from './pages/business-dashboard/pages/BusinessesPage'
import BusinessDetailPage from './pages/business-dashboard/pages/BusinessDetailPage'
import FormRenderLayout from './pages/feedback-form-render/FormRenderLayout'
import FormRenderPage from './pages/feedback-form-render/FormRenderPage'
import FormResultsPage from './pages/feedback-form-render/FormResultsPage'
import ProfilePage from './pages/business-dashboard/pages/ProfilePage'
import UsersPage from './pages/business-dashboard/pages/UsersPage'

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <Routes>
          <Route
            path="/"
            element={
              <GuestRoute>
                <LandingPage />
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
            <Route path="onboarding" element={<BusinessOnboardingPage />} />
            <Route path="forms" element={<FormsPage />} />
            <Route path="forms/create" element={<CreateFormPage />} />
            <Route path="forms/:formId/edit" element={<CreateFormPage />} />
            <Route path="pages" element={<PagesPage />} />
            <Route path="pages/create" element={<CreatePagePage />} />
            <Route path="pages/:pageId/edit" element={<CreatePagePage />} />
            <Route path="submissions" element={<SubmissionsPage />} />
            <Route path="businesses" element={<RoleGuard roles={['admin']}><BusinessesPage /></RoleGuard>} />
            <Route
              path="businesses/:businessId"
              element={
                <RoleGuard roles={['admin']}>
                  <BusinessDetailPage />
                </RoleGuard>
              }
            />
            <Route path="users" element={<RoleGuard roles={['admin']}><UsersPage /></RoleGuard>} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          {/* Legacy: redirect old business-dashboard URLs to main dashboard */}
          <Route path="/business-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/business-dashboard/forms" element={<Navigate to="/dashboard/forms" replace />} />
          <Route path="/business-dashboard/forms/create" element={<Navigate to="/dashboard/forms/create" replace />} />
          <Route path="/business-dashboard/forms/:formId/edit" element={<Navigate to="/dashboard/forms" replace />} />
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
            <Route path=":formId/results" element={<FormResultsPage />} />
          </Route>
          {/* Public CMS page: /c/:id/:slug (id = page ID, slug = page slug) */}
          <Route path="/c/:id/:slug" element={<PublicPageView />} />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
