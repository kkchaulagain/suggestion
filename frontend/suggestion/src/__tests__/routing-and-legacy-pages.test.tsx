import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import ProtectedRoute from '../component/ProtectedRoutes'
import BusinessDashboard from '../pages/business/businessdashboard'
import SuggestionForm from '../pages/business/suggestionform'
import { AuthProvider } from '../context/AuthContext'

jest.mock('../App.css', () => ({}))
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../auth/Signup', () => ({
  __esModule: true,
  default: () => <div>Signup Page</div>,
}))

jest.mock('../auth/login', () => ({
  __esModule: true,
  default: () => <div>Login Page</div>,
}))

jest.mock('../pages/Dashboard', () => ({
  __esModule: true,
  default: () => <div>User Dashboard Page</div>,
}))

jest.mock('../pages/business-dashboard/layout/BusinessDashboardLayout', () => {
  const { Outlet } = jest.requireActual('react-router-dom')
  return {
    __esModule: true,
    default: () => (
      <div>
        Business Layout
        <Outlet />
      </div>
    ),
  }
})

jest.mock('../pages/business-dashboard/pages/FormsPage', () => ({
  __esModule: true,
  default: () => <div>Forms Listing Page</div>,
}))

jest.mock('../pages/business-dashboard/pages/CreateFormPage', () => ({
  __esModule: true,
  default: () => <div>Create Form Page</div>,
}))

jest.mock('../pages/business-dashboard/pages/SubmissionsPage', () => ({
  __esModule: true,
  default: () => <div>Submissions Page</div>,
}))

jest.mock('../pages/business-dashboard/pages/BusinessesPage', () => ({
  __esModule: true,
  default: () => <div>Businesses Page</div>,
}))

jest.mock('../pages/business-dashboard/pages/UsersPage', () => ({
  __esModule: true,
  default: () => <div>Users Page</div>,
}))

const App = require('../App').default

describe('ProtectedRoute component', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedAxios.get.mockReset()
  })

  test('renders children when user is logged in', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'user' } },
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div>Private Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Private Content')).toBeInTheDocument()
    })
  })

  test('redirects to login when user is not logged in', () => {
    render(
      <MemoryRouter
        initialEntries={['/dashboard']}
      >
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Private Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Route</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Private Content')).not.toBeInTheDocument()
    expect(screen.getByText('Login Route')).toBeInTheDocument()
  })
})

describe('App routing', () => {
  beforeEach(() => {
    localStorage.clear()
    mockedAxios.get.mockReset()
  })

  test('renders signup on root route', () => {
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(screen.getByText('Signup Page')).toBeInTheDocument()
  })

  test('renders login route directly', () => {
    window.history.pushState({}, '', '/login')
    render(<App />)

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  test('renders protected dashboard when logged in', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'user' } },
    })
    window.history.pushState({}, '', '/dashboard')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('User Dashboard Page')).toBeInTheDocument()
    })
  })

  test('redirects protected dashboard to login when logged out', () => {
    window.history.pushState({}, '', '/dashboard')
    render(<App />)

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  test('redirects /business-dashboard to main dashboard and shows forms for business', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' },
      },
    })
    window.history.pushState({}, '', '/business-dashboard')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Business Layout')).toBeInTheDocument()
      expect(screen.getByText('Forms Listing Page')).toBeInTheDocument()
    })
  })

  test('renders submissions route at /dashboard/submissions when business user', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' },
      },
    })
    window.history.pushState({}, '', '/dashboard/submissions')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Business Layout')).toBeInTheDocument()
      expect(screen.getByText('Submissions Page')).toBeInTheDocument()
    })
  })

  test('renders /business-form for logged in users', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'user' } },
    })
    window.history.pushState({}, '', '/business-form')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Suggestion Form Builder/i })).toBeInTheDocument()
    })
  })

  test('renders Users page at /dashboard/users when admin', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    window.history.pushState({}, '', '/dashboard/users')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Business Layout')).toBeInTheDocument()
      expect(screen.getByText('Users Page')).toBeInTheDocument()
    })
  })

  test('business user at /dashboard/businesses is redirected and does not see Businesses page', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Biz', email: 'b@b.com', role: 'business' } },
    })
    window.history.pushState({}, '', '/dashboard/businesses')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Business Layout')).toBeInTheDocument()
    })
    expect(screen.queryByText('Businesses Page')).not.toBeInTheDocument()
  })

  test('renders Businesses page at /dashboard/businesses when admin', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    window.history.pushState({}, '', '/dashboard/businesses')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Business Layout')).toBeInTheDocument()
      expect(screen.getByText('Businesses Page')).toBeInTheDocument()
    })
  })

  test('admin user gets business dashboard layout', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    window.history.pushState({}, '', '/dashboard')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Business Layout')).toBeInTheDocument()
      expect(screen.getByText('Forms Listing Page')).toBeInTheDocument()
    })
  })
})

describe('Legacy business pages', () => {
  test('businessdashboard redirects to main dashboard forms route', () => {
    render(
      <MemoryRouter
        initialEntries={['/old-business-dashboard']}
      >
        <Routes>
          <Route path="/old-business-dashboard" element={<BusinessDashboard />} />
          <Route path="/dashboard/forms" element={<div>Main Dashboard Forms Route</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Main Dashboard Forms Route')).toBeInTheDocument()
  })

  test('suggestion form page shows migration guidance text', () => {
    render(
      <MemoryRouter>
        <SuggestionForm />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /Suggestion Form Builder/i })).toBeInTheDocument()
    expect(screen.getByText(/available at/i)).toBeInTheDocument()
    expect(screen.getByText(/\/dashboard\/forms/i)).toBeInTheDocument()
  })
})
