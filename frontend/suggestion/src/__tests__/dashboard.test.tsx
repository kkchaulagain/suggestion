import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import Dashboard from '../pages/Dashboard'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderDashboard() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Dashboard />
    </MemoryRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    mockedAxios.get.mockReset()
    localStorage.clear()
  })

  test('renders dashboard content from backend', async () => {
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('isLoggedIn', 'true')
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    } as any)

    renderDashboard()

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  test('logout clears isLoggedIn and navigates to login', async () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    } as any)

    renderDashboard()

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))

    expect(localStorage.getItem('isLoggedIn')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('shows N/A when backend response is not successful', async () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: false,
        data: {
          name: 'Ignored Name',
          email: 'ignored@example.com',
        },
      },
    } as any)

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    })

    expect(screen.getAllByText('N/A').length).toBeGreaterThanOrEqual(2)
  })

  test('shows error UI and retries page reload on non-401 failure', async () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('token', 'fake-token')
    mockedAxios.get.mockRejectedValueOnce(new Error('request failed'))

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/Failed to load user data/i)).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument()
  })

  test('handles 401 axios error by clearing auth and navigating to login', async () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('token', 'expired-token')

    const unauthorizedError = {
      isAxiosError: true,
      response: { status: 401 },
    }

    mockedAxios.get.mockRejectedValueOnce(unauthorizedError as any)
    ;(axios.isAxiosError as unknown as jest.Mock).mockReturnValueOnce(true)

    renderDashboard()

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })

    expect(localStorage.getItem('isLoggedIn')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
