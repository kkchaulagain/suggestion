import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'

import Login from '../auth/login'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderLogin() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Login />
    </MemoryRouter>
  )
}

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockNavigate.mockClear()
        window.alert = jest.fn()
        localStorage.clear()
    });

    test('renders login form fields', ()=>{
        renderLogin()
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
    })
    test('shows validation errors when fields are empty', async () => {
        mockedAxios.post.mockRejectedValueOnce({
          response: {
            data: {
              errors: {
                email: 'Email is required',
                password: 'Password is required',
              },
            },
          },
        })
        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))
        await waitFor(() => {
          expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
          expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
        })
    });
    test('api call on valid form submission', async () => {
        mockedAxios.post.mockResolvedValue({
            data: { message: 'Login successful' },
         });
        renderLogin()
        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: 'password123' }
        })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))
        await waitFor(() => {
            expect(mockedAxios.post).toHaveBeenCalled()
        })
        expect(window.alert).toHaveBeenCalledWith('Login successful')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    });

      test('stores token and navigates business role to business dashboard', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: {
            message: 'Login successful',
            data: {
              token: 'jwt-token-1',
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
          expect(mockNavigate).toHaveBeenCalledWith('/business-dashboard')
        })
        expect(localStorage.getItem('token')).toBe('jwt-token-1')
        expect(localStorage.getItem('isLoggedIn')).toBe('true')
      })

      test('fetches profile role when login response has no role', async () => {
        mockedAxios.post.mockResolvedValueOnce({
          data: {
            message: 'Login successful',
            token: 'jwt-token-2',
          },
        } as any)
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            data: { role: 'governmentservices' },
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
          expect(mockedAxios.get).toHaveBeenCalled()
        })

        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            headers: expect.objectContaining({ Authorization: 'Bearer jwt-token-2' }),
          }),
        )
        expect(mockNavigate).toHaveBeenCalledWith('/business-dashboard')
      })

      test('shows field error from field/error response shape', async () => {
        mockedAxios.post.mockRejectedValueOnce({
          response: {
            data: {
              field: 'email',
              error: 'Invalid email format',
            },
          },
        })

        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(screen.getByText(/Invalid email format/i)).toBeInTheDocument()
        })
        expect(localStorage.getItem('isLoggedIn')).toBeNull()
      })

      test('shows general and fallback error messages', async () => {
        mockedAxios.post.mockRejectedValueOnce({
          response: {
            data: {
              error: 'Invalid credentials',
            },
          },
        })

        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument()
        })

        mockedAxios.post.mockRejectedValueOnce(new Error('network down'))
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        await waitFor(() => {
          expect(screen.getByText(/Something went wrong. Please try again./i)).toBeInTheDocument()
        })
      })

      test('navigates to signup from create account action', () => {
        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Create account/i }))
        expect(mockNavigate).toHaveBeenCalledWith('/signup')
      })
});
