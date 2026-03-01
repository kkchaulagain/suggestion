import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
import Signup from '../auth/Signup'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderSignup() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Signup />
    </MemoryRouter>
  )
}

describe('Signup Component', () => {

  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockClear()
    window.alert = jest.fn()
  })

  test('renders signup form fields', () => {
    renderSignup()

    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument()
  })

  test('shows validation errors if fields are empty', async () => {
    mockedAxios.post.mockRejectedValueOnce({
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

    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument()
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument()
    })
  })

  test('shows validation error if password is less than 6 characters', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          errors: {
            password: 'Password must be at least 6 characters',
          },
        },
      },
    })

    renderSignup()

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

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 6 characters/i)
      ).toBeInTheDocument()
    })
  })

  test('calls API and navigates on successful signup', async () => {
    mockedAxios.post.mockResolvedValue({
      data: { message: 'User created successfully' },
    })

    renderSignup()

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
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('shows business-only fields and sanitizes PAN to digits', () => {
    renderSignup()

    fireEvent.change(screen.getByLabelText(/Account Type/i), {
      target: { value: 'business' },
    })

    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()

    const panInput = screen.getByLabelText(/PAN Card Number/i) as HTMLInputElement
    fireEvent.change(panInput, { target: { value: 'AB12-34x' } })
    expect(panInput.value).toBe('1234')

    fireEvent.change(screen.getByLabelText(/Account Type/i), {
      target: { value: 'user' },
    })

    expect(screen.queryByLabelText(/Business Name/i)).not.toBeInTheDocument()
  })

  test('submits business payload with parsed pancard number', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'Business created successfully' },
    } as any)

    renderSignup()

    fireEvent.change(screen.getByLabelText(/^Name$/i), {
      target: { value: 'Acme Owner' },
    })
    fireEvent.change(screen.getByLabelText(/^Email$/i), {
      target: { value: 'owner@acme.com' },
    })
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: '12345678' },
    })
    fireEvent.change(screen.getByLabelText(/Account Type/i), {
      target: { value: 'business' },
    })
    fireEvent.change(screen.getByLabelText(/Business Name/i), {
      target: { value: 'Acme Traders' },
    })
    fireEvent.change(screen.getByLabelText(/Location/i), {
      target: { value: 'Kathmandu' },
    })
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: 'Retail store' },
    })
    fireEvent.change(screen.getByLabelText(/PAN Card Number/i), {
      target: { value: '123456' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })

    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        role: 'business',
        businessname: 'Acme Traders',
        location: 'Kathmandu',
        description: 'Retail store',
        pancardNumber: 123456,
      }),
      expect.anything(),
    )
  })

  test('shows field-level error from single field response shape', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          field: 'email',
          error: 'Email already exists',
        },
      },
    })

    renderSignup()
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(screen.getByText(/Email already exists/i)).toBeInTheDocument()
    })
  })

  test('shows general error and fallback unknown error message', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          error: 'Registration failed',
        },
      },
    })

    renderSignup()
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(screen.getByText(/Registration failed/i)).toBeInTheDocument()
    })

    mockedAxios.post.mockRejectedValueOnce(new Error('network error'))
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong. Please try again./i)).toBeInTheDocument()
    })
  })

  test('navigates to login when clicking Login button', () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: /Login/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

})
