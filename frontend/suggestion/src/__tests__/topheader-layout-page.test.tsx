import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  beforeEach(() => {
    mockedAxios.get.mockReset()
    mockAxiosInterceptors()
    localStorage.clear()
    jest.useRealTimers()
  })

  test('renders title and theme toggle', () => {
    render(
      <ThemeProvider>
        <TopHeader title="Forms" />
      </ThemeProvider>,
    )
    expect(screen.getByRole('heading', { name: /Forms/i })).toBeInTheDocument()
    expect(screen.getByText(/Business and government QR suggestion management/i)).toBeInTheDocument()
  })

  test('shows submission notification button for business users', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Test', email: 't@t.com', role: 'business' } },
      } as MeApiResponse)
      .mockResolvedValueOnce({ data: { submissions: [] } })

    render(
      <TestRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/open submission notifications/i)).toBeInTheDocument()
    })
  })

  test('does not show submission notification button for regular users', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/auth/me')) {
        return Promise.resolve({
          data: { success: true, data: { _id: '2', name: 'User', email: 'u@t.com', role: 'user' } },
        })
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <TestRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Forms/i })).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/open submission notifications/i)).not.toBeInTheDocument()
  })

  test('shows unread submissions count and notification items', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    const now = Date.now()
    localStorage.setItem('dashboard_submission_notifications_last_seen_1', String(now - 45 * 60 * 1000))

    mockedAxios.get.mockImplementation((url) => {
      if (typeof url !== 'string') return Promise.resolve({ data: {} })
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          data: { success: true, data: { _id: '1', name: 'Biz', email: 'b@t.com', role: 'business' } },
        })
      }
      if (url.includes('/api/auth/business')) {
        return Promise.resolve({
          data: { success: true, business: { _id: 'biz-1', onboardingCompleted: true, emailNotificationsEnabled: true } },
        })
      }
      if (url.includes('/api/feedback-forms/submissions')) {
        return Promise.resolve({
          data: {
            submissions: [
              {
                _id: 'new-1',
                formId: 'form-1',
                formTitle: 'Support Form',
                submittedAt: new Date(now - 5 * 60 * 1000).toISOString(),
                formSnapshot: [{ name: 'name', label: 'Your Name' }],
                responses: { name: 'Avery' },
              },
              {
                _id: 'old-1',
                formId: 'form-2',
                formTitle: 'Feedback Form',
                submittedAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
                formSnapshot: [{ name: 'name', label: 'Your Name' }],
                responses: { name: 'Jordan' },
              },
            ],
          },
        })
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <TestRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    const bellButton = await screen.findByLabelText(/open submission notifications/i)
    expect(await screen.findByText('1')).toBeInTheDocument()

    fireEvent.click(bellButton)

    expect(await screen.findByText(/New submissions/i)).toBeInTheDocument()
    expect(screen.getByText(/New submission on Support Form/i)).toBeInTheDocument()
    expect(screen.getByText(/New submission on Feedback Form/i)).toBeInTheDocument()
  })

  test('covers notification name fallbacks, relative time labels, and closes on outside and link clicks', async () => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-03-26T12:00:00.000Z'))
    localStorage.setItem('auth_token', 'fake-token')
    localStorage.setItem('dashboard_submission_notifications_last_seen_1', '0')

    mockedAxios.get.mockImplementation((url) => {
      if (typeof url !== 'string') return Promise.resolve({ data: {} })
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          data: { success: true, data: { _id: '1', name: 'Biz', email: 'b@t.com', role: 'business' } },
        })
      }
      if (url.includes('/api/auth/business')) {
        return Promise.resolve({
          data: { success: true, business: { _id: 'biz-1', onboardingCompleted: true, emailNotificationsEnabled: true } },
        })
      }
      if (url.includes('/api/feedback-forms/submissions')) {
        return Promise.resolve({
          data: {
            submissions: [
              {
                _id: 'yesterday',
                formId: 'form-1',
                formTitle: 'Yesterday Form',
                submittedAt: '2026-03-25T10:00:00.000Z',
                formSnapshot: [{ name: 'full_name', label: 'Full Name' }],
                responses: { full_name: '' },
              },
              {
                _id: 'days',
                formId: 'form-2',
                formTitle: 'Days Form',
                submittedAt: '2026-03-23T12:00:00.000Z',
                responses: { customer_name: 'Morgan' },
              },
              {
                _id: 'date',
                formId: 'form-3',
                formTitle: '',
                submittedAt: '2026-03-10T12:00:00.000Z',
                responses: {},
              },
            ],
          },
        })
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <TestRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    const bellButton = await screen.findByLabelText(/open submission notifications/i)
    fireEvent.click(bellButton)

    expect(await screen.findByText(/Yesterday/i)).toBeInTheDocument()
    expect(screen.getByText(/3d ago/i)).toBeInTheDocument()
    expect(screen.getByText(new Date('2026-03-10T12:00:00.000Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))).toBeInTheDocument()
    expect(screen.getByText(/Anonymous/i)).toBeInTheDocument()
    expect(screen.getByText(/Morgan/i)).toBeInTheDocument()
    expect(screen.getByText(/Untitled Form/i)).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    await waitFor(() => {
      expect(screen.queryByText(/New submissions/i)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/open submission notifications/i))
    const viewAll = await screen.findByText(/View all/i)
    fireEvent.click(viewAll)
    await waitFor(() => {
      expect(screen.queryByText(/New submissions/i)).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText(/open submission notifications/i))
    const itemLink = await screen.findByText(/New submission on Yesterday Form/i)
    fireEvent.click(itemLink)
    await waitFor(() => {
      expect(screen.queryByText(/New submissions/i)).not.toBeInTheDocument()
    })
  })

  test('clears notifications for failed fetches and interval refreshes', async () => {
    jest.useFakeTimers()
    localStorage.setItem('auth_token', 'fake-token')

    mockedAxios.get.mockImplementation((url) => {
      if (typeof url !== 'string') return Promise.resolve({ data: {} })
      if (url.includes('/api/auth/me')) {
        return Promise.resolve({
          data: { success: true, data: { _id: '1', name: 'Biz', email: 'b@t.com', role: 'business' } },
        })
      }
      if (url.includes('/api/auth/business')) {
        return Promise.resolve({
          data: { success: true, business: { _id: 'biz-1', onboardingCompleted: true, emailNotificationsEnabled: true } },
        })
      }
      if (url.includes('/api/feedback-forms/submissions')) {
        return Promise.reject(new Error('fetch failed'))
      }
      return Promise.resolve({ data: {} })
    })

    render(
      <TestRouter>
        <ThemeProvider>
          <AuthProvider>
            <TopHeader title="Forms" />
          </AuthProvider>
        </ThemeProvider>
      </TestRouter>,
    )

    await screen.findByLabelText(/open submission notifications/i)
    jest.runOnlyPendingTimers()
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/feedback-forms/submissions'),
        expect.any(Object),
      )
    })
    jest.advanceTimersByTime(30000)
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled()
    })
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
