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
    <MemoryRouter>
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
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    } as any)

    renderDashboard()

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
      expect(screen.getByText(/john@example.com/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  test('logout clears isLoggedIn and navigates to login', () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        data: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      },
    } as any)

    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))

    expect(localStorage.getItem('isLoggedIn')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
