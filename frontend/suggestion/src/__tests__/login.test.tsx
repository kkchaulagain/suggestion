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
    <MemoryRouter>
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
});
