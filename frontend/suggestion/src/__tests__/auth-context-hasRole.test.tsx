import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { AuthProvider, useAuth } from '../context/AuthContext'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

function HasRoleConsumer() {
  const { user, hasRole } = useAuth()
  return (
    <div>
      <span data-testid="has-admin">{String(hasRole('admin'))}</span>
      <span data-testid="has-business">{String(hasRole('business'))}</span>
      <span data-testid="user-role">{user?.role ?? 'none'}</span>
    </div>
  )
}

describe('AuthContext hasRole', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('hasRole returns true for current user role and false for others', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })

    render(
      <AuthProvider>
        <HasRoleConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('admin')
    })

    expect(screen.getByTestId('has-admin')).toHaveTextContent('true')
    expect(screen.getByTestId('has-business')).toHaveTextContent('false')
  })

  it('hasRole returns false when user is null', () => {
    render(
      <AuthProvider>
        <HasRoleConsumer />
      </AuthProvider>,
    )

    expect(screen.getByTestId('has-admin')).toHaveTextContent('false')
    expect(screen.getByTestId('has-business')).toHaveTextContent('false')
  })
})
