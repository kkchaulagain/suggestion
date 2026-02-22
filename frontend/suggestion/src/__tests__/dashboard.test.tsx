import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

import Dashboard from '../pages/Dashboard'

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
    localStorage.clear()
  })

  test('renders dashboard content', () => {
    renderDashboard()

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  test('logout clears isLoggedIn and navigates to login', () => {
    localStorage.setItem('isLoggedIn', 'true')

    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))

    expect(localStorage.getItem('isLoggedIn')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
