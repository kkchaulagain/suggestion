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
import type { AxiosHeaderValue, AxiosRequestHeaders } from 'axios'
import { loginapi, logoutApi, meapi, refreshTokenApi, businessmeapi, usersApi } from '../utils/apipath'

const AUTH_STORAGE_KEY = 'auth_token'

export type UserRole = 'user' | 'business' | 'governmentservices' | 'admin'

export interface User {
  _id: string
  name: string
  email: string
  role?: UserRole
  isActive?: boolean
  avatarId?: string | null
}

export type ImpersonationTarget = {
  _id: string
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
}

export interface Business {
  _id: string
  owner: string
  businessname: string
  type: string
  description: string
  onboardingCompleted?: boolean
  onboardingCompletedAt?: string
  emailNotificationsEnabled?: boolean
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthState {
  user: User | null
  business: Business | null
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
  /** Refetch business (e.g. after onboarding completes). Only relevant when user has business role. */
  refetchBusiness: () => Promise<void>
  startImpersonation: (targetUser: ImpersonationTarget) => Promise<{ success: boolean; error?: string }>
  stopImpersonation: () => void
  isImpersonating: boolean
  impersonatedUser: User | null
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

type HeaderLike = {
  Authorization?: AxiosHeaderValue
  authorization?: AxiosHeaderValue
  get?: (name: string) => string | undefined
  has?: (name: string) => boolean
  set?: (name: string, value: string) => void
}

function upsertAuthorizationHeader(headers: unknown, token: string, overwrite = false): AxiosRequestHeaders {
  const headerValue = `Bearer ${token}`
  const normalize = (name: string) => name.toLowerCase()

  const ensureHeaderMethods = (target: HeaderLike): HeaderLike => {
    const targetRecord = target as Record<string, AxiosHeaderValue | undefined>

    if (typeof target.get !== 'function') {
      target.get = (name: string) => {
        const lower = normalize(name)
        if (lower === 'authorization') {
          return (target.Authorization as string | undefined) ?? (target.authorization as string | undefined)
        }
        return targetRecord[name] as string | undefined
      }
    }
    if (typeof target.has !== 'function') {
      target.has = (name: string) => target.get?.(name) != null
    }
    if (typeof target.set !== 'function') {
      target.set = (name: string, value: string) => {
        const lower = normalize(name)
        if (lower === 'authorization') {
          target.Authorization = value
          return
        }
        targetRecord[name] = value
      }
    }
    return target
  }

  if (headers && typeof headers === 'object') {
    const existing = ensureHeaderMethods(headers as HeaderLike)
    const hasAuthorization =
      typeof existing.has === 'function'
        ? existing.has('Authorization')
        : Boolean(existing.Authorization ?? existing.authorization ?? existing.get?.('Authorization'))

    if (overwrite || !hasAuthorization) {
      if (typeof existing.set === 'function') {
        existing.set('Authorization', headerValue)
      } else {
        existing.Authorization = headerValue
      }
    }

    return existing as AxiosRequestHeaders
  }

  const created = ensureHeaderMethods({})
  created.set?.('Authorization', headerValue)
  return created as AxiosRequestHeaders
}

const BUSINESS_ROLES: UserRole[] = ['business', 'governmentservices']

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [token, setTokenState] = useState<string | null>(readStoredToken)
  const [isLoading, setIsLoading] = useState(() => !!readStoredToken())
  const [error, setErrorState] = useState<string | null>(null)
  const [isImpersonating, setIsImpersonating] = useState(false)
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null)
  const tokenRef = useRef<string | null>(readStoredToken())
  const impersonationTokenRef = useRef<string | null>(null)
  const originalUserRef = useRef<User | null>(null)
  const originalBusinessRef = useRef<Business | null>(null)
  const isImpersonatingRef = useRef(false)
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null)

  const setToken = useCallback((newToken: string | null) => {
    tokenRef.current = newToken
    setTokenState(newToken)
    persistToken(newToken)
  }, [])

  const getActiveAuthToken = useCallback(() => impersonationTokenRef.current ?? tokenRef.current, [])

  const clearImpersonation = useCallback(() => {
    impersonationTokenRef.current = null
    originalUserRef.current = null
    originalBusinessRef.current = null
    isImpersonatingRef.current = false
    setIsImpersonating(false)
    setImpersonatedUser(null)
  }, [])

  const stopImpersonation = useCallback(() => {
    const previousUser = originalUserRef.current
    const previousBusiness = originalBusinessRef.current
    clearImpersonation()
    if (previousUser) {
      setUser(previousUser)
    }
    if (previousBusiness) {
      setBusiness(previousBusiness)
    }
  }, [clearImpersonation])

  const logout = useCallback(async () => {
    const authToken = getActiveAuthToken()
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
    clearImpersonation()
    setUser(null)
    setBusiness(null)
    setToken(null)
    setErrorState(null)
  }, [getActiveAuthToken, clearImpersonation, setToken])

  const fetchBusiness = useCallback(async (authToken: string): Promise<Business | null> => {
    try {
      const response = await axios.get(businessmeapi, {
        withCredentials: true,
        headers: { Authorization: `Bearer ${authToken}` },
      })
      if (response.data?.success && response.data?.data) {
        return response.data.data as Business
      }
      return null
    } catch {
      return null
    }
  }, [])

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
          avatarId: data.avatarId ?? undefined,
        }
      }
      return null
    },
    [],
  )

  const startImpersonation = useCallback(
    async (targetUser: ImpersonationTarget): Promise<{ success: boolean; error?: string }> => {
      const authToken = tokenRef.current
      if (!authToken) {
        return { success: false, error: 'Not authenticated' }
      }

      try {
        const response = await axios.post(
          `${usersApi}/${targetUser._id}/impersonate`,
          {},
          {
            withCredentials: true,
            headers: { Authorization: `Bearer ${authToken}` },
          },
        )

        const impersonationToken = response.data?.data?.token ?? response.data?.token
        if (!impersonationToken) {
          return { success: false, error: 'Impersonation token missing' }
        }

        originalUserRef.current = user
        originalBusinessRef.current = business
        impersonationTokenRef.current = impersonationToken
        isImpersonatingRef.current = true
        setIsImpersonating(true)

        let impersonatedUserProfile: User | null = null
        if (targetUser.name && targetUser.email && targetUser.role) {
          impersonatedUserProfile = {
            _id: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role,
            isActive: targetUser.isActive !== false,
          }
        } else {
          const fetched = await fetchUser(impersonationToken)
          if (!fetched) {
            clearImpersonation()
            return { success: false, error: 'Failed to load impersonated user profile' }
          }
          impersonatedUserProfile = fetched
        }

        setImpersonatedUser(impersonatedUserProfile)
        setUser(impersonatedUserProfile)

        if (impersonatedUserProfile.role && BUSINESS_ROLES.includes(impersonatedUserProfile.role)) {
          const b = await fetchBusiness(impersonationToken)
          setBusiness(b)
        } else {
          setBusiness(null)
        }

        return { success: true }
      } catch (err: unknown) {
        const axiosErr = axios.isAxiosError(err) ? err : null
        const responseData = axiosErr?.response?.data
        const message =
          responseData?.error ??
          (typeof responseData?.message === 'string' ? responseData.message : null) ??
          'Failed to start impersonation'
        return { success: false, error: message }
      }
    },
    [business, clearImpersonation, fetchBusiness, fetchUser, user],
  )

  const refetchBusiness = useCallback(async () => {
    const authToken = tokenRef.current
    if (!authToken || !BUSINESS_ROLES.includes(user?.role ?? 'user')) return
    const b = await fetchBusiness(authToken)
    setBusiness(b)
  }, [user?.role, fetchBusiness])

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (isImpersonatingRef.current) {
      return null
    }
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
      const authToken = getActiveAuthToken()
      if (authToken) {
        config.headers = upsertAuthorizationHeader(config.headers, authToken)
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

        if (
          status !== 401 ||
          originalRequest._retry ||
          isRefreshCall ||
          isLoginCall ||
          isLogoutCall ||
          isImpersonatingRef.current
        ) {
          return Promise.reject(err)
        }

        originalRequest._retry = true
        const nextToken = await refreshAccessToken()
        if (!nextToken) {
          return Promise.reject(err)
        }

        originalRequest.headers = upsertAuthorizationHeader(originalRequest.headers, nextToken, true)
        originalRequest.withCredentials = true
        return axios(originalRequest)
      },
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [refreshAccessToken, getActiveAuthToken])

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
      .then(async (res) => {
        if (cancelled) return
        if (res.data?.success && res.data?.data) {
          const data = res.data.data
          const role = data.role
          setUser({
            _id: data._id,
            name: data.name,
            email: data.email,
            role,
            isActive: data.isActive !== false,
          })
          if (role && BUSINESS_ROLES.includes(role)) {
            const b = await fetchBusiness(stored)
            if (!cancelled) setBusiness(b)
          } else {
            setBusiness(null)
          }
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
  }, [setToken, fetchBusiness])

  const login = useCallback(
    async (
      credentials: LoginCredentials,
    ): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
      clearImpersonation()
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
        if (normalizedRole && BUSINESS_ROLES.includes(normalizedRole)) {
          const b = await fetchBusiness(authToken)
          setBusiness(b)
        } else {
          setBusiness(null)
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
    [clearImpersonation, fetchUser, setToken, fetchBusiness],
  )

  const setError = useCallback((err: string | null) => {
    setErrorState(err)
  }, [])

  const getAuthHeaders = useCallback(
    () => ({
      ...(getActiveAuthToken() ? { Authorization: `Bearer ${getActiveAuthToken()}` } : {}),
    }),
    [getActiveAuthToken],
  )

  const hasRole = useCallback(
    (...roles: UserRole[]) => (user?.role ? roles.includes(user.role) : false),
    [user],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      business,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      error,
      login,
      logout,
      setError,
      getAuthHeaders,
      hasRole,
      refetchBusiness,
      startImpersonation,
      stopImpersonation,
      isImpersonating,
      impersonatedUser,
    }),
    [
      user,
      business,
      token,
      isLoading,
      error,
      login,
      logout,
      setError,
      getAuthHeaders,
      hasRole,
      refetchBusiness,
      startImpersonation,
      stopImpersonation,
      isImpersonating,
      impersonatedUser,
    ],
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
