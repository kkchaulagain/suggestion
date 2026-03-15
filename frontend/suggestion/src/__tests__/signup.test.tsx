import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import { TestRouter } from './test-router'
import { ThemeProvider } from '../context/ThemeContext'
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
    <TestRouter>
      <ThemeProvider>
        <Signup />
      </ThemeProvider>
    </TestRouter>
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

    await waitFor(() => {
      expect(screen.getByText('User created successfully')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /Go to Login/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('with Personal selected, shows avatar picker and hides business fields', () => {
    renderSignup()

    expect(screen.getByText(/Pick your vibe/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Business Name/i)).not.toBeInTheDocument()
  })

  test('with Business selected, shows business fields and hides avatar picker', () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: /Business/i }))

    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument()
    expect(screen.queryByText(/Pick your vibe/i)).not.toBeInTheDocument()
  })

  test('switching to Personal hides business fields and shows avatar picker', () => {
    renderSignup()

    fireEvent.click(screen.getByRole('button', { name: /Business/i }))
    expect(screen.getByLabelText(/Business Name/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Personal/i }))
    expect(screen.queryByLabelText(/Business Name/i)).not.toBeInTheDocument()
    expect(screen.getByText(/Pick your vibe/i)).toBeInTheDocument()
  })

  interface SignupSuccessResponse { data: { message: string } }
  test('submits business payload with business fields', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'Business created successfully' },
    } as SignupSuccessResponse)

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
    fireEvent.click(screen.getByRole('button', { name: /Business/i }))
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
        pancardNumber: '123456',
      }),
      expect.anything(),
    )
  })

  test('submits personal payload with role user and optional avatarId', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { message: 'User registered successfully' },
    } as SignupSuccessResponse)

    renderSignup()

    fireEvent.change(screen.getByLabelText(/^Name$/i), { target: { value: 'Jane' } })
    fireEvent.change(screen.getByLabelText(/^Email$/i), { target: { value: 'jane@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Password$/i), { target: { value: 'secret123' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled()
    })

    const payload = mockedAxios.post.mock.calls[0][1]
    expect(payload.role).toBe('user')
    expect(payload.businessname).toBeUndefined()
    expect(payload.description).toBeUndefined()
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

  test('shows phone field error from backend validation errors', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Validation failed',
          errors: {
            phone: 'Invalid phone number',
          },
        },
      },
    })

    renderSignup()
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(screen.getByText(/Invalid phone number/i)).toBeInTheDocument()
    })
  })

  test('shows phone field error from field-plus-errors response and clears it on change', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: {
          field: 'phone',
          message: 'Validation failed',
          errors: {
            phone: 'Phone number is required',
          },
        },
      },
    })

    renderSignup()
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }))

    await waitFor(() => {
      expect(screen.getByText(/Phone number is required/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Phone Number/i), {
      target: { value: '9812345678' },
    })

    await waitFor(() => {
      expect(screen.queryByText(/Phone number is required/i)).not.toBeInTheDocument()
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
