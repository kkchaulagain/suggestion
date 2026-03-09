import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import axios from 'axios'
import { loginapi, logoutApi, meapi, refreshTokenApi } from '../utils/apipath'

const AUTH_STORAGE_KEY = 'auth_token'

export type UserRole = 'user' | 'business' | 'governmentservices' | 'admin'

export interface User {
  _id: string
  name: string
  email: string
  role?: UserRole
  isActive?: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string; role?: UserRole }>
  logout: () => Promise<void>
  setError: (error: string | null) => void
  /** Returns headers object for axios: { Authorization: `Bearer ${token}` } when token exists */
  getAuthHeaders: () => { Authorization?: string }
  /** Returns true if the current user has one of the given roles */
  hasRole: (...roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY)
    }
  } catch {
    // ignore storage errors
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(readStoredToken)
  const [isLoading, setIsLoading] = useState(() => !!readStoredToken())
  const [error, setErrorState] = useState<string | null>(null)
  const tokenRef = useRef<string | null>(readStoredToken())
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)

  const setToken = useCallback((newToken: string | null) => {
    tokenRef.current = newToken
    setTokenState(newToken)
    persistToken(newToken)
  }, [])

  const logout = useCallback(async () => {
    const authToken = tokenRef.current
    try {
      await axios.post(
        logoutApi,
        {},
        {
          withCredentials: true,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        },
      )
    } catch {
      // local cleanup still proceeds when the server call fails
    }
    setUser(null)
    setToken(null)
    setErrorState(null)
  }, [setToken])

  const fetchUser = useCallback(
    async (authToken: string): Promise<User | null> => {
      const response = await axios.get(meapi, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.data?.success && response.data?.data) {
        const data = response.data.data
        return {
          _id: data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive !== false,
        }
      }
      return null
    },
    [],
  )

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current
    }

    const refreshPromise = axios
      .post(
        refreshTokenApi,
        {},
        {
          withCredentials: true,
        },
      )
      .then((response) => {
        const nextToken = response.data?.data?.token ?? response.data?.token ?? null
        if (!nextToken) {
          throw new Error('Invalid refresh response')
        }
        setToken(nextToken)
        return nextToken
      })
      .catch(() => {
        setUser(null)
        setToken(null)
        return null
      })
      .finally(() => {
        refreshPromiseRef.current = null
      })

    refreshPromiseRef.current = refreshPromise
    return refreshPromise
  }, [setToken])

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const authToken = tokenRef.current
      if (authToken) {
        const headers = (config.headers ?? {}) as Record<string, string>
        if (!headers.Authorization) {
          headers.Authorization = `Bearer ${authToken}`
        }
        config.headers = headers
      }
      return config
    })

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (err: unknown) => {
        if (!axios.isAxiosError(err) || !err.config) {
          return Promise.reject(err)
        }

        const originalRequest = err.config as typeof err.config & { _retry?: boolean }
        const status = err.response?.status
        const url = originalRequest.url ?? ''
        const isRefreshCall = url.includes('/api/auth/refresh-token')
        const isLoginCall = url.includes('/api/auth/login')
        const isLogoutCall = url.includes('/api/auth/logout')

        if (status !== 401 || originalRequest._retry || isRefreshCall || isLoginCall || isLogoutCall) {
          return Promise.reject(err)
        }

        originalRequest._retry = true
        const nextToken = await refreshAccessToken()
        if (!nextToken) {
          return Promise.reject(err)
        }

        const headers = (originalRequest.headers ?? {}) as Record<string, string>
        headers.Authorization = `Bearer ${nextToken}`
        originalRequest.headers = headers
        originalRequest.withCredentials = true
        return axios(originalRequest)
      },
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [refreshAccessToken])

  // Restore session from stored token on mount (token and isLoading already set from initial state)
  useEffect(() => {
    const stored = readStoredToken()
    if (!stored) return

    let cancelled = false

    axios
      .get(meapi, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${stored}` },
      })
      .then((res) => {
        if (cancelled) return
        if (res.data?.success && res.data?.data) {
          const data = res.data.data
          setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
            isActive: data.isActive !== false,
          })
        } else {
          setToken(null)
        }
      })
      .catch((err) => {
        if (cancelled) return
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [setToken])

  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
      setErrorState(null)
      try {
        const { data } = await axios.post(loginapi, credentials, {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
        })

        const authToken = data?.data?.token ?? data?.token
        if (!data?.message || !authToken) {
          return { success: false, error: 'Invalid login response' }
        }

        setToken(authToken)

        let role: UserRole | undefined = data?.data?.role ?? data?.user?.role
        if (role == null) {
          const fetched = await fetchUser(authToken)
          if (fetched?.role) role = fetched.role
        }
        const normalizedRole = role?.toLowerCase() as UserRole | undefined

        const userFromResponse = data?.data ?? data?.user
        if (userFromResponse) {
          setUser({
            _id: userFromResponse._id,
            name: userFromResponse.name,
            email: userFromResponse.email,
            role: normalizedRole ?? 'user',
            isActive: userFromResponse.isActive !== false,
          })
        } else {
          const fetched = await fetchUser(authToken)
          setUser(fetched ?? null)
        }

        return { success: true, role: normalizedRole ?? 'user' }
      } catch (err: unknown) {
        const axiosErr = axios.isAxiosError(err) ? err : null
        const responseData = axiosErr?.response?.data
        const message =
          responseData?.error ??
          (typeof responseData?.message === 'string' ? responseData.message : null) ??
          'Login failed. Please try again.'
        setErrorState(message)
        return { success: false, error: message }
      }
    },
    [fetchUser, setToken],
  )

  const setError = useCallback((err: string | null) => {
    setErrorState(err)
  }, [])

  const getAuthHeaders = useCallback(
    () => ({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  )

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user?.role ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      error,
      login,
      logout,
      setError,
      getAuthHeaders,
      hasRole,
    }),
    [user, token, isLoading, error, login, logout, setError, getAuthHeaders, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx == null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

export function useAuthOptional(): AuthContextValue | null {
  return useContext(AuthContext)
}
