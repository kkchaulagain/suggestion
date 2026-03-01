import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'

import Login from '../auth/login'
import { AuthProvider } from '../context/AuthContext'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockNavigate.mockClear()
        window.alert = jest.fn()
        localStorage.clear()
        ;(axios as unknown as { isAxiosError: jest.Mock }).isAxiosError = jest.fn(
          (e: unknown) => !!(e && typeof e === 'object' && 'response' in e && (e as { response?: { data?: unknown } }).response?.data !== undefined)
        )
    });

    test('renders login form fields', ()=>{
        renderLogin()
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
    })
    test('shows error when submit with empty fields and API returns error', async () => {
        mockedAxios.post.mockRejectedValueOnce({
          isAxiosError: true,
          response: {
            data: {
              error: 'Email and password are required',
            },
          },
        })
        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))
        await waitFor(() => {
          expect(screen.getByText(/Email and password are required/i)).toBeInTheDocument()
        })
    });
    test('api call on valid form submission and navigates to dashboard', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: {
            message: 'Login successful',
            data: { token: 'jwt-token', _id: '1', name: 'User', email: 'test@example.com', role: 'user' },
          },
        })
        renderLogin()
        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: 'password123' }
        })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
        expect(mockedAxios.post).toHaveBeenCalled()
    });

      test('stores token and navigates business role to dashboard', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: {
            message: 'Login successful',
            data: {
              token: 'jwt-token-1',
              _id: '1',
              name: 'Biz',
              email: 'biz@example.com',
              role: 'business',
            },
          },
        } as any)

        renderLogin()
        fireEvent.change(screen.getByLabelText(/Email/i), {
          target: { value: 'biz@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/Password/i), {
          target: { value: 'password123' }
        })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
        expect(localStorage.getItem('auth_token')).toBe('jwt-token-1')
      })

      test('fetches profile role when login response has no role', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: {
            message: 'Login successful',
            data: { token: 'jwt-token-2' },
          },
        } as any)
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            success: true,
            data: { _id: '1', name: 'Gov', email: 'gov@example.com', role: 'governmentservices' },
          },
        } as any)

        renderLogin()
        fireEvent.change(screen.getByLabelText(/Email/i), {
          target: { value: 'gov@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/Password/i), {
          target: { value: 'password123' }
        })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
        })
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer jwt-token-2' }),
          }),
        )
      })

      test('shows field error from API response', async () => {
        mockedAxios.post.mockRejectedValueOnce({
          isAxiosError: true,
          response: {
            data: {
              error: 'Invalid email format',
            },
          },
        })

        renderLogin()
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bad' } })
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'p' } })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument()
        })
        expect(localStorage.getItem('auth_token')).toBeNull()
      })

      test('shows general and fallback error messages', async () => {
        mockedAxios.post.mockRejectedValueOnce({
          isAxiosError: true,
          response: {
            data: {
              error: 'Invalid credentials',
            },
          },
        })

        renderLogin()
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } })
        fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
        })

        mockedAxios.post.mockRejectedValueOnce(new Error('network down'))
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(screen.getByText(/Login failed\. Please try again\./i)).toBeInTheDocument()
        })
      })

      test('navigates to signup from create account action', () => {
        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/signup')
      })
});
