import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import ProfilePage from '../pages/business-dashboard/pages/ProfilePage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockUser = { name: 'Test User', email: 'test@example.com' }
const mockHeaders = { Authorization: 'Bearer fake-token' }
const mockGetAuthHeaders = jest.fn(() => mockHeaders)

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    getAuthHeaders: mockGetAuthHeaders,
  }),
}))

const mockProfileResponse = {
  data: {
    success: true,
    data: { name: 'Acme Owner', email: 'owner@acme.com' },
  },
}

describe('ProfilePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue(mockProfileResponse)
    mockedAxios.isAxiosError.mockImplementation((value: unknown) => {
      return Boolean((value as { isAxiosError?: boolean })?.isAxiosError)
    })
  })

  it('renders profile data from backend api', async () => {
    render(<ProfilePage />)

    expect(screen.getByText('Personal Details')).toBeInTheDocument()
    expect(screen.getAllByText('Loading profile...')).toHaveLength(2)

    await waitFor(() => {
      expect(screen.getByText('Acme Owner')).toBeInTheDocument()
      expect(screen.getByText('owner@acme.com')).toBeInTheDocument()
    })
  })

  it('shows N/A when profile fields are missing', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, data: { email: 'owner@acme.com' } },
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument()
    })
  })

  it('shows error message on 401', async () => {
    mockedAxios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 401 },
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Session expired. Please login again.')).toBeInTheDocument()
    })
  })

  it('shows generic error on other failures', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Unable to load profile from API.')).toBeInTheDocument()
    })
  })

  it('opens edit modal with current name pre-filled', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))

    expect(screen.getByText('Edit Profile', { selector: 'h2' })).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Enter your name') as HTMLInputElement
    expect(input.value).toBe('Acme Owner')
  })

  it('closes the modal when Cancel is clicked', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    expect(screen.getByText('Edit Profile', { selector: 'h2' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Edit Profile', { selector: 'h2' })).not.toBeInTheDocument()
  })

  it('shows validation error when saving empty name', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))

    const input = screen.getByPlaceholderText('Enter your name')
    fireEvent.change(input, { target: { value: '' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    expect(screen.getByText('Name cannot be empty')).toBeInTheDocument()
    expect(screen.getByText('Edit Profile', { selector: 'h2' })).toBeInTheDocument()
  })
  it('saves successfully and updates displayed name', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        success: true,
        data: { name: 'Updated Name', email: 'owner@acme.com' },
      },
    })

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))

    await waitFor(() => expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument())

    const input = screen.getByPlaceholderText('Enter your name')
    fireEvent.change(input, { target: { value: 'Updated Name' } })

    expect((input as HTMLInputElement).value).toBe('Updated Name')

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledTimes(1)
    })

    await waitFor(() => {
      expect(screen.queryByText('Edit Profile', { selector: 'h2' })).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Updated Name')).toBeInTheDocument()
    })
  })

  it('shows error when save API call fails', async () => {
    mockedAxios.put.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Failed to update profile.' } },
    })

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))

    const input = screen.getByPlaceholderText('Enter your name')
    fireEvent.change(input, { target: { value: 'Acme Owner Extra' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile.')).toBeInTheDocument()
    })
  })

  it('disables buttons while saving', async () => {
    mockedAxios.put.mockImplementation(() => new Promise(() => {})) // never resolves

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))

    const input = screen.getByPlaceholderText('Enter your name')
    fireEvent.change(input, { target: { value: 'Updated Name' } })

    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })
  })

  it('opens change password modal', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))

    expect(screen.getByText('Change Password', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument()
  })

  it('shows validation error when password fields are empty', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText('All password fields are required')).toBeInTheDocument()
  })

  it('shows validation error when new and confirm passwords do not match', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: 'newpassword' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'different' } })

    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText('New passwords do not match')).toBeInTheDocument()
  })

  it('changes password successfully and shows success message', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Password Changed Successfully',
      },
    })

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: 'newpassword' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword' } })

    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled()
      expect(screen.queryByText('Change Password', { selector: 'h2' })).not.toBeInTheDocument()
      expect(screen.getByText('Password Changed Successfully')).toBeInTheDocument()
    })
  })

  it('shows password API error message when request fails', async () => {
    mockedAxios.put.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Current password is incorrect' } },
    })

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'wrong' } })
    fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: 'newpassword' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword' } })

    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(screen.getByText('Current password is incorrect')).toBeInTheDocument()
    })
  })
})