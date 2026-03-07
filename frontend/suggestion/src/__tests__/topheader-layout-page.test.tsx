import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import TopHeader from '../pages/business-dashboard/components/TopHeader'
import BusinessDashboardLayout from '../pages/business-dashboard/layout/BusinessDashboardLayout'
import FormsPage from '../pages/business-dashboard/pages/FormsPage'
import { AuthProvider } from '../context/AuthContext'
import { ThemeProvider } from '../context/ThemeContext'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

interface MeApiResponse { data: { success: boolean; data: { _id: string; name: string; email: string; role: string } } }
interface BusinessProfileApiResponse { data: { success: boolean; data: { businessname?: string; location?: string; pancardNumber?: number; description?: string } } }

describe('TopHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockNavigate.mockReset()
    localStorage.clear()
    localStorage.setItem('auth_token', 'fake-token')
  })

  test('closes profile menu on outside click and logs out', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' },
        },
      } as MeApiResponse)
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            businessname: 'Acme Traders',
            location: 'Kathmandu',
            pancardNumber: 12345678,
            description: 'Retail store',
          },
        },
      } as BusinessProfileApiResponse)

    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Open profile menu/i }))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Open profile menu/i }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Logout/i }))

    expect(localStorage.getItem('auth_token')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('keeps profile null when business profile fetch fails', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' },
        },
      } as MeApiResponse)
      .mockRejectedValueOnce(new Error('request failed'))

    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Open profile menu/i }))

    expect(screen.getByText(/Business name unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/Location: N\/A/i)).toBeInTheDocument()
  })
})

describe('BusinessDashboardLayout and page', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset()
  })

  test('renders fallback title when at unknown dashboard route', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
      } as MeApiResponse)
      .mockResolvedValueOnce({ data: { success: true, data: {} } } as BusinessProfileApiResponse)

    render(
      <MemoryRouter initialEntries={['/dashboard/unknown']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<BusinessDashboardLayout />}>
                <Route path="unknown" element={<div>Unknown Page</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Business Dashboard/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Unknown Page/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /Main navigation/i })).toBeInTheDocument()
  })

  test('renders Submissions as page title when at /dashboard/submissions', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
      })
      .mockResolvedValueOnce({ data: { success: true, data: {} } })

    render(
      <MemoryRouter initialEntries={['/dashboard/submissions']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/dashboard" element={<BusinessDashboardLayout />}>
                <Route path="submissions" element={<div>Submissions content</div>} />
              </Route>
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Submissions/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Submissions content/i)).toBeInTheDocument()
  })

  interface FormsListResponse { data: { feedbackForms: Array<{ _id?: string; title?: string; fields?: Array<{ name: string; label: string; type: string }> }> } }
  test('renders FormsPage static sections', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
      } as MeApiResponse)
      .mockResolvedValueOnce({ data: { feedbackForms: [] } } as FormsListResponse)

    render(
      <MemoryRouter>
        <AuthProvider>
          <FormsPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    expect(screen.getByRole('heading', { name: /Saved Forms/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Refresh/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Make Form/i })).toBeInTheDocument()
  })
})
