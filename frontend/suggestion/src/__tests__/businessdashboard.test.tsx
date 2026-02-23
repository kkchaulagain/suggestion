import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import BusinessDashboard from '../pages/businessdashboard'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderBusinessDashboard() {
  return render(
    <MemoryRouter>
      <BusinessDashboard />
    </MemoryRouter>
  )
}

describe('BusinessDashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    mockedAxios.get.mockReset()
    localStorage.clear()
  })

  test('renders business profile details including business name', async () => {
    localStorage.setItem('token', 'fake-token')
    localStorage.setItem('isLoggedIn', 'true')
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          businessname: 'Acme Traders',
          location: 'jorpati',
          pancardNumber: 12345678,
          description: 'Retail store',
        },
      },
    } as any)

    renderBusinessDashboard()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Business Dashboard/i })).toBeInTheDocument()
    })

    expect(screen.getByText(/Acme Traders/i)).toBeInTheDocument()
    expect(screen.getByText(/jorpati/i)).toBeInTheDocument()
    expect(screen.getByText(/12345678/i)).toBeInTheDocument()
    expect(screen.getByText(/Retail store/i)).toBeInTheDocument()
  })

  test('logout clears localStorage and navigates to login', async () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          businessname: 'Acme Traders',
          location: 'jorpati',
          pancardNumber: 12345678,
          description: 'Retail store',
        },
      },
    } as any)

    renderBusinessDashboard()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))

    expect(localStorage.getItem('isLoggedIn')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
