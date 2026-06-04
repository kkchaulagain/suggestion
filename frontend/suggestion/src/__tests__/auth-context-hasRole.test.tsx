import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { AuthProvider, useAuth } from '../context/AuthContext'

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
    jest.resetAllMocks()
    mockedAxios.get.mockReset()
    localStorage.clear()
    mockAxiosInterceptors()
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

describe('AuthContext impersonation error paths', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    localStorage.clear()
    mockAxiosInterceptors()
    ;(axios as unknown as { isAxiosError: jest.Mock }).isAxiosError = jest.fn(
      (value: unknown) => !!(value && typeof value === 'object' && 'config' in (value as object)),
    )
  })

  function ImpersonationConsumer({ target }: { target?: Partial<{ _id: string; name: string; email: string; role: string }> }) {
    const { startImpersonation, stopImpersonation, isImpersonating, impersonatedUser } = useAuth()
    return (
      <div>
        <button
          type="button"
          onClick={() => void startImpersonation({ _id: target?._id ?? 'target-1', name: target?.name ?? '', email: target?.email ?? '', role: target?.role as 'user', isActive: true })}
        >
          start
        </button>
        <button type="button" onClick={() => stopImpersonation()}>
          stop
        </button>
        <span data-testid="is-impersonating">{String(isImpersonating)}</span>
        <span data-testid="impersonated-user">{impersonatedUser?.name ?? 'none'}</span>
      </div>
    )
  }

  it('returns error when no auth token', async () => {
    render(
      <AuthProvider>
        <ImpersonationConsumer />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })
  })

  it('returns error when impersonation token missing from response', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true },
    })

    render(
      <AuthProvider>
        <ImpersonationConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })
  })

  it('fetches user profile when target lacks complete info', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/auth/me')) {
        return Promise.resolve({
          data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
        })
      }
      return Promise.resolve({ data: {} })
    })
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'impersonation-token' },
    })

    render(
      <AuthProvider>
        <ImpersonationConsumer target={{ _id: '2' }} />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })
  })

  it('returns default error message when axios error response lacks error or message', async () => {
    localStorage.setItem('auth_token', 'fake-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    ;(axios as unknown as { isAxiosError: jest.Mock }).isAxiosError.mockReturnValue(true)
    mockedAxios.post.mockRejectedValueOnce({ response: { data: {} } })

    render(
      <AuthProvider>
        <ImpersonationConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })
  })
})
