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
    });

    test('renders login form fields', ()=>{
        renderLogin()
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
    })
    test('shows alert if fields are empty', () => {
        renderLogin()
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))
        expect(screen.getByText(/Please enter both email and password/i)).toBeInTheDocument()
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
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    });
});