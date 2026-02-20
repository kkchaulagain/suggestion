import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'

import Login from '../pages/login'



jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Login Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        window.alert = jest.fn()
    });

    test('renders login form fields', ()=>{
        render(<Login />)
        expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument()
    })
    test('shows backend field errors when fields are empty', async () => {
        mockedAxios.post.mockRejectedValue({
            response: {
                data: {
                    errors: {
                        email: 'Email is required',
                        password: 'Password is required',
                    },
                },
            },
        })

        render(<Login />)
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))

        expect(await screen.findByText(/Email is required/i)).toBeInTheDocument()
        expect(await screen.findByText(/Password is required/i)).toBeInTheDocument()
    });
    test('api call on valid form submission', async () => {
        window.alert = jest.fn()
        mockedAxios.post.mockResolvedValue({
            data: { message: 'Login successful' },
         });
        render(<Login />)
        fireEvent.change(screen.getByLabelText(/Email/i), {
            target: { value: 'test@example.com' }
        })
        fireEvent.change(screen.getByLabelText(/Password/i), {
            target: { value: 'password123' }
        })
        fireEvent.click(screen.getByRole('button', { name: /Login/i }))
        await waitFor(() => {
            expect(window.alert).toHaveBeenCalledWith('Login successful')
        })
    });
});
