import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TestRouter } from './test-router'

import Dashboard from '../pages/Dashboard'

const mockNavigate = jest.fn()
const mockLogout = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: '1', name: 'John Doe', email: 'john@example.com' },
    logout: mockLogout,
  }),
}))

function renderDashboard() {
  return render(
    <TestRouter>
      <Dashboard />
    </TestRouter>
  )
}

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    mockLogout.mockClear()
  })

  test('renders dashboard content from auth context', () => {
    renderDashboard()

    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument()
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
    expect(screen.getByText(/john@example.com/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument()
  })

  test('logout calls context logout and navigates to login', () => {
    renderDashboard()

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }))

    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })
})
