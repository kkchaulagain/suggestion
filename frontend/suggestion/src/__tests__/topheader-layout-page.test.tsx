import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from './test-router'
import axios from 'axios'

import TopHeader from '../pages/business-dashboard/components/TopHeader'
import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'
import FormsPage from '../pages/business-dashboard/pages/FormsPage'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function mockAxiosInterceptors() {
  ;(mockedAxios as unknown as {
    interceptors: {
      request: { use: jest.Mock; eject: jest.Mock }
      response: { use: jest.Mock; eject: jest.Mock }
    }
  }).interceptors = {
    request: { use: jest.fn(() => 1), eject: jest.fn() },
    response: { use: jest.fn(() => 1), eject: jest.fn() },
  }
}

interface MeApiResponse { data: { success: boolean; data: { _id: string; name: string; email: string; role: string } } }

describe('TopHeader', () => {
  test('renders title and theme toggle', () => {
    render(
      <ThemeProvider>
        <TopHeader title="Forms" />
      </ThemeProvider>,
    )
    expect(screen.getByRole('heading', { name: /Forms/i })).toBeInTheDocument()
    expect(screen.getByText(/Business and government QR suggestion management/i)).toBeInTheDocument()
  })
})

describe('BusinessDashboardLayout and page', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset()
    mockAxiosInterceptors()
  })

  test('renders fallback title when at unknown dashboard route', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
    } as MeApiResponse)

    render(
      <TestRouter initialEntries={['/dashboard/unknown']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<BusinessDashboardLayout />}>
                <Route path="unknown" element={<div>Unknown Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Business Dashboard/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Unknown Page/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /Main navigation/i })).toBeInTheDocument()
  })

  test('renders Submissions as page title when at /dashboard/submissions', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
    })

    render(
      <TestRouter initialEntries={['/dashboard/submissions']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<BusinessDashboardLayout />}>
                <Route path="submissions" element={<div>Submissions content</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Submissions/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Submissions content/i)).toBeInTheDocument()
  })

  test('renders Edit Page as title when at /dashboard/pages/:id/edit', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
    })

    render(
      <TestRouter initialEntries={['/dashboard/pages/page-123/edit']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<BusinessDashboardLayout />}>
                <Route path="pages/:pageId/edit" element={<div>Edit page content</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit Page/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Edit page content/i)).toBeInTheDocument()
  })

  interface FormsListResponse { data: { feedbackForms: Array<{ _id?: string; title?: string; fields?: Array<{ name: string; label: string; type: string }> }> } }
  test('renders FormsPage static sections', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
    } as MeApiResponse)
    mockedAxios.get.mockResolvedValueOnce({ data: { feedbackForms: [] } } as FormsListResponse)

    render(
      <TestRouter>
        <AuthProvider>
          <FormsPage />
        </AuthProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    expect(screen.getByRole('heading', { name: /Your Forms/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add Form/i })).toBeInTheDocument()
  })
})
