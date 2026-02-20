import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import Signup from '../pages/Signup'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Signup Component', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    window.alert = jest.fn()
  })

  test('renders signup form fields', () => {
    render(<Signup />)

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument()
  })

  test('shows alert if fields are empty', () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          errors: {
            name: 'Name is required',
            email: 'Email is required',
            password: 'Password is required',
          },
        },
      },
    })

    render(<Signup />)

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    return waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
    })
  })

  test('shows backend password validation error', async () => {
    mockedAxios.post.mockRejectedValue({
      response: {
        data: {
          errors: {
            password: 'Password must be at least 6 characters',
          },
        },
      },
    })

    render(<Signup />)

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Suman' },
    })

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@gmail.com' },
    })

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: '123' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    expect(
      await screen.findByText(/Password must be at least 6 characters/i)
    ).toBeInTheDocument()
  })

  test('calls API and navigates on successful signup', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { message: 'User created successfully' },
    })

    render(<Signup />)

    fireEvent.change(screen.getByLabelText(/Name/i), {
      target: { value: 'Suman' },
    })

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@gmail.com' },
    })

    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: '123456' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })

    expect(window.alert).toHaveBeenCalledWith('User created successfully')
    expect(window.location.pathname).toBe('/login')
  })

})
