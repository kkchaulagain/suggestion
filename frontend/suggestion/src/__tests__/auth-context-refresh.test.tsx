import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { AuthProvider, useAuth } from '../context/AuthContext'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

type RequestHandler = (config: { headers?: unknown }) => { headers?: unknown }
type ResponseRejectedHandler = (error: unknown) => Promise<unknown>

const interceptorState: {
  requestHandler: RequestHandler | null
  responseRejectedHandler: ResponseRejectedHandler | null
} = {
  requestHandler: null,
  responseRejectedHandler: null,
}

function mockAxiosInterceptors() {
  interceptorState.requestHandler = null
  interceptorState.responseRejectedHandler = null

  ;(mockedAxios as unknown as {
    interceptors: {
      request: { use: jest.Mock; eject: jest.Mock }
      response: { use: jest.Mock; eject: jest.Mock }
    }
  }).interceptors = {
    request: {
      use: jest.fn((fulfilled: RequestHandler) => {
        interceptorState.requestHandler = fulfilled
        return 1
      }),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn((_fulfilled: unknown, rejected: ResponseRejectedHandler) => {
        interceptorState.responseRejectedHandler = rejected
        return 2
      }),
      eject: jest.fn(),
    },
  }
}

function AuthConsumer() {
  const { login, logout, user, token, error, getAuthHeaders } = useAuth()

  return (
    <div>
      <button type="button" onClick={() => void login({ email: 'user@example.com', password: 'secret123' })}>
        login
      </button>
      <button type="button" onClick={() => void logout()}>
        logout
      </button>
      <div data-testid="user">{user?.email ?? 'none'}</div>
      <div data-testid="token">{token ?? 'none'}</div>
      <div data-testid="error">{error ?? 'none'}</div>
      <div data-testid="auth-header">{getAuthHeaders().Authorization ?? 'none'}</div>
    </div>
  )
}

describe('AuthContext refresh flow', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    localStorage.clear()
    mockAxiosInterceptors()
    ;(axios as unknown as { isAxiosError: jest.Mock }).isAxiosError = jest.fn(
      (value: unknown) => !!(value && typeof value === 'object' && 'config' in (value as object)),
    )
  })

  it('logs in, attaches auth header, logs out, and clears local state when logout request fails', async () => {
    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          message: 'Login successful',
          data: {
            token: 'jwt-token',
            _id: '1',
            name: 'User',
            email: 'user@example.com',
            role: 'user',
          },
        },
      })
      .mockRejectedValueOnce(new Error('logout failed'))

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('jwt-token')
    })

    expect(screen.getByTestId('auth-header')).toHaveTextContent('Bearer jwt-token')

    const config = interceptorState.requestHandler?.({ headers: undefined })
    expect(config).toBeDefined()
    const headers = config?.headers as { get?: (name: string) => string | undefined }
    expect(headers.get?.('Authorization')).toBe('Bearer jwt-token')

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('none')
    })

    expect(screen.getByTestId('user')).toHaveTextContent('none')
    expect(screen.getByTestId('error')).toHaveTextContent('none')
    expect(localStorage.getItem('auth_token')).toBeNull()
  })

  it('refreshes an expired request, retries it once, and rejects unsupported retry paths', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Login successful',
        data: {
          token: 'initial-token',
          _id: '1',
          name: 'User',
          email: 'user@example.com',
          role: 'user',
        },
      },
    })

    const retriedResponse = { data: { ok: true } }
    ;(mockedAxios as unknown as jest.Mock).mockResolvedValueOnce(retriedResponse)
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { token: 'refreshed-token' },
      },
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('initial-token')
    })

    let retryResult: unknown
    await act(async () => {
      retryResult = await interceptorState.responseRejectedHandler?.({
        config: { url: '/api/protected', headers: {}, withCredentials: false },
        response: { status: 401 },
      })
    })

    expect(retryResult).toEqual(retriedResponse)
    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('refreshed-token')
    })
    expect((mockedAxios as unknown as jest.Mock).mock.calls[0][0].headers.get('Authorization')).toBe('Bearer refreshed-token')

    await act(async () => {
      await expect(
        interceptorState.responseRejectedHandler?.({
          config: { url: '/api/auth/login', headers: {}, withCredentials: false },
          response: { status: 401 },
        }),
      ).rejects.toMatchObject({
        response: { status: 401 },
      })
    })

    await act(async () => {
      await expect(
        interceptorState.responseRejectedHandler?.({
          config: { url: '/api/protected', headers: {}, _retry: true, withCredentials: false },
          response: { status: 401 },
        }),
      ).rejects.toMatchObject({
        response: { status: 401 },
      })
    })
  })

  it('clears auth state when refresh fails or returns no token', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        message: 'Login successful',
        data: {
          token: 'initial-token',
          _id: '1',
          name: 'User',
          email: 'user@example.com',
          role: 'user',
        },
      },
    })

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('initial-token')
    })

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true, data: {} } })

    await act(async () => {
      await expect(
        interceptorState.responseRejectedHandler?.({
          config: { url: '/api/protected', headers: {}, withCredentials: false },
          response: { status: 401 },
        }),
      ).rejects.toMatchObject({
        response: { status: 401 },
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent('none')
    })

    mockedAxios.post.mockRejectedValueOnce(new Error('refresh failed'))

    await act(async () => {
      await expect(
        interceptorState.responseRejectedHandler?.({
          config: { url: '/api/protected-again', headers: {}, withCredentials: false },
          response: { status: 401 },
        }),
      ).rejects.toMatchObject({
        response: { status: 401 },
      })
    })

    expect(screen.getByTestId('user')).toHaveTextContent('none')
  })
})
