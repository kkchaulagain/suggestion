import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import type { UserRole } from '../context/AuthContext'
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

function ImpersonationTrigger({ target }: { target: { _id: string; name?: string; email?: string; role?: UserRole; isActive?: boolean } }) {
  const { startImpersonation, stopImpersonation, refetchBusiness, isImpersonating, impersonatedUser, user, business } = useAuth()
  return (
    <div>
      <button type="button" onClick={() => void startImpersonation(target)}>
        start
      </button>
      <button type="button" onClick={stopImpersonation}>
        stop
      </button>
      <button type="button" onClick={() => void refetchBusiness()}>
        refetch business
      </button>
      <span data-testid="is-impersonating">{String(isImpersonating)}</span>
      <span data-testid="impersonated-user">{impersonatedUser?.name ?? 'none'}</span>
      <span data-testid="current-user">{user?.name ?? 'none'}</span>
      <span data-testid="current-business">{business?.businessname ?? 'none'}</span>
    </div>
  )
}

describe('AuthContext startImpersonation', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    localStorage.clear()
    mockAxiosInterceptors()
    mockedAxios.isAxiosError.mockImplementation((value: unknown) => !!(value && typeof value === 'object' && 'config' in (value as object)))
  })

  it('returns not authenticated error when no token', async () => {
    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1' }} />
      </AuthProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })
  })

  it('returns token missing error when response lacks token', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true },
    })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1', name: 'Test', email: 't@t.com', role: 'user', isActive: true }} />
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

  it('uses target profile when provided', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'imp-token' },
    })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1', name: 'Test User', email: 't@t.com', role: 'business', isActive: true }} />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true')
    })
    expect(screen.getByTestId('impersonated-user')).toHaveTextContent('Test User')
  })

  it('fetches user profile when target lacks name/email/role', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: 'u1', name: 'Fetched User', email: 'f@f.com', role: 'user', isActive: true } },
      })
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'imp-token' },
    })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1' }} />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('impersonated-user')).toHaveTextContent('Fetched User')
    })
  })

  it('returns error when fetched profile is null', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
      })
      .mockResolvedValueOnce({
        data: { success: false },
      })
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'imp-token' },
    })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1' }} />
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

  it('returns default error when axios error lacks error/message', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
    })
    mockedAxios.isAxiosError.mockReturnValue(true)
    mockedAxios.post.mockRejectedValueOnce({ response: { data: {} } })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1', name: 'T', email: 't@t.com', role: 'user', isActive: true }} />
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

  it('sets business for business role impersonated user', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Admin', email: 'a@a.com', role: 'admin' } },
      })
      .mockResolvedValueOnce({
        data: { success: true, business: { _id: 'biz-1', onboardingCompleted: true, emailNotificationsEnabled: true } },
      })
    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { token: 'imp-token' } },
    })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1', name: 'Business User', email: 'b@b.com', role: 'business', isActive: true }} />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
    })

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true')
    })
  })

  it('stops impersonation and restores the original business user context', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Business Admin', email: 'a@a.com', role: 'business' } },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            _id: 'biz-1',
            owner: '1',
            businessname: 'Original Biz',
            type: 'commercial',
            description: 'Original business',
          },
        },
      })
    mockedAxios.post.mockResolvedValueOnce({
      data: { token: 'imp-token' },
    })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1', name: 'Target User', email: 't@t.com', role: 'user', isActive: true }} />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('Business Admin')
      expect(screen.getByTestId('current-business')).toHaveTextContent('Original Biz')
    })

    fireEvent.click(screen.getByRole('button', { name: 'start' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('true')
      expect(screen.getByTestId('current-user')).toHaveTextContent('Target User')
      expect(screen.getByTestId('current-business')).toHaveTextContent('none')
    })

    fireEvent.click(screen.getByRole('button', { name: 'stop' }))

    await waitFor(() => {
      expect(screen.getByTestId('is-impersonating')).toHaveTextContent('false')
      expect(screen.getByTestId('impersonated-user')).toHaveTextContent('none')
      expect(screen.getByTestId('current-user')).toHaveTextContent('Business Admin')
      expect(screen.getByTestId('current-business')).toHaveTextContent('Original Biz')
    })
  })

  it('refetches business data for business users', async () => {
    localStorage.setItem('auth_token', 'stored-token')
    mockedAxios.get
      .mockResolvedValueOnce({
        data: { success: true, data: { _id: '1', name: 'Business Admin', email: 'a@a.com', role: 'business' } },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            _id: 'biz-1',
            owner: '1',
            businessname: 'Original Biz',
            type: 'commercial',
            description: 'Original business',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            _id: 'biz-1',
            owner: '1',
            businessname: 'Updated Biz',
            type: 'commercial',
            description: 'Updated business',
          },
        },
      })

    render(
      <AuthProvider>
        <ImpersonationTrigger target={{ _id: 'u1', name: 'Target User', email: 't@t.com', role: 'user', isActive: true }} />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-business')).toHaveTextContent('Original Biz')
    })

    fireEvent.click(screen.getByRole('button', { name: 'refetch business' }))

    await waitFor(() => {
      expect(screen.getByTestId('current-business')).toHaveTextContent('Updated Biz')
    })
  })
})