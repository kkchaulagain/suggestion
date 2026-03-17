import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'
import ProfilePage from '../pages/business-dashboard/pages/ProfilePage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockUser = { name: 'Test User', email: 'test@example.com' }
const mockHeaders = { Authorization: 'Bearer fake-token' }
const mockGetAuthHeaders = jest.fn(() => mockHeaders)
const mockLogout = jest.fn()
const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    getAuthHeaders: mockGetAuthHeaders,
    logout: mockLogout,
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

    expect(screen.getByText('Loading...')).toBeInTheDocument()

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

  it('shows generic error when save fails with non-Axios error', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Network error'))

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit profile/i }))
    fireEvent.change(screen.getByPlaceholderText('Enter your name'), { target: { value: 'New Name' } })
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

  it('shows Start onboarding button and navigates to onboarding on click', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    const startOnboardingBtn = screen.getByRole('button', { name: /start onboarding/i })
    expect(startOnboardingBtn).toBeInTheDocument()

    fireEvent.click(startOnboardingBtn)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/onboarding')
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

  it('shows validation error when new password is too short', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: '123' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: '123' } })

    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    expect(screen.getByText('Password must be at least 6 characters long')).toBeInTheDocument()
  })

  it('closes change password modal when Cancel is clicked', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    expect(screen.getByText('Change Password', { selector: 'h2' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText('Change Password', { selector: 'h2' })).not.toBeInTheDocument()
    })
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

  it('shows generic password error when request fails with non-axios error', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('boom'))

    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /^change password$/i }))
    fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByPlaceholderText('Enter new password'), { target: { value: 'newpassword' } })
    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword' } })

    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to change password.')).toBeInTheDocument()
    })
  })

  it('logs out and redirects to login when logout is confirmed', async () => {
    render(<ProfilePage />)

    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(screen.getByText(/are you sure you want to log out/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^log out$/i }))

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  it('logout confirm modal closes when Cancel is clicked', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(screen.getByText(/are you sure you want to log out/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText(/are you sure you want to log out/i)).not.toBeInTheDocument()
    expect(mockLogout).not.toHaveBeenCalled()
  })

  it('logout confirm modal closes when backdrop is clicked', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /logout/i }))
    expect(screen.getByRole('dialog', { name: /log out/i })).toBeInTheDocument()
    const dialog = screen.getByRole('dialog', { name: /log out/i })
    fireEvent.click(dialog)
    expect(screen.queryByRole('dialog', { name: /log out/i })).not.toBeInTheDocument()
    expect(mockLogout).not.toHaveBeenCalled()
  })
})

const mockBusinessApiResponse = {
  data: {
    success: true,
    data: {
      _id: 'biz123',
      type: 'commercial',
      businessname: 'Test Biz',
      location: 'Kathmandu',
      pancardNumber: '123456',
      description: 'A test business',
    },
  },
}

describe('Edit Business - password confirmation modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue(mockProfileResponse)
    mockedAxios.isAxiosError.mockImplementation((value: unknown) => {
      return Boolean((value as { isAxiosError?: boolean })?.isAxiosError)
    })
  })

  it('opens password confirm modal when Edit Business is clicked', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))

    expect(screen.getByText('Confirm Password', { selector: 'h2' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('password')).toBeInTheDocument()
  })

  it('closes password confirm modal when Cancel is clicked', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    expect(screen.getByText('Confirm Password', { selector: 'h2' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    await waitFor(() => {
      expect(screen.queryByText('Confirm Password', { selector: 'h2' })).not.toBeInTheDocument()
    })
  })

  it('shows error when confirm is clicked with empty password', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(screen.getByText('Password is required to confirm')).toBeInTheDocument()
  })

  it('shows error when password verification fails with axios error', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Incorrect password' } },
    })

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument()
    })
  })

  it('shows fallback error when password verification fails with non-axios error', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockRejectedValueOnce(new Error('network failure'))

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('Incorrect password')).toBeInTheDocument()
    })
  })

  it('shows error when password verification API returns success false', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: false, message: 'Wrong password provided' },
    })

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('Wrong password provided')).toBeInTheDocument()
    })
  })

  it('shows Verifying while password is being checked', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockImplementationOnce(() => new Promise(() => {}))

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'anypass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /verifying/i })).toBeDisabled()
    })
  })
})

describe('Edit Business – load business data after password verified', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue(mockProfileResponse)
    mockedAxios.isAxiosError.mockImplementation((value: unknown) => {
      return Boolean((value as { isAxiosError?: boolean })?.isAxiosError)
    })
  })

  it('opens edit modal with prefilled business data on success', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } })
    mockedAxios.get.mockResolvedValueOnce(mockBusinessApiResponse)

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'correctpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('Edit Business', { selector: 'h2' })).toBeInTheDocument()
    })
    expect((screen.getByPlaceholderText('Enter business name') as HTMLInputElement).value).toBe('Test Biz')
    expect((screen.getByPlaceholderText('Describe your business') as HTMLInputElement).value).toBe('A test business')
  })

  it('does not open edit modal when business GET returns non-success', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } })
    mockedAxios.get.mockResolvedValueOnce({ data: { success: false } })

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'correctpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Edit Business', { selector: 'h2' })).not.toBeInTheDocument()
  })

  it('does not open edit modal when business GET throws axios error', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } })
    mockedAxios.get.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Business not found' } },
    })

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'correctpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Edit Business', { selector: 'h2' })).not.toBeInTheDocument()
  })

  it('does not open edit modal when business GET throws generic error', async () => {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } })
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'))

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'correctpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(mockedAxios.get).toHaveBeenCalledTimes(2))
    expect(screen.queryByText('Edit Business', { selector: 'h2' })).not.toBeInTheDocument()
  })
})

describe('Edit Business - edit modal interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockResolvedValue(mockProfileResponse)
    mockedAxios.isAxiosError.mockImplementation((value: unknown) => {
      return Boolean((value as { isAxiosError?: boolean })?.isAxiosError)
    })
  })

  async function openEditModal() {
    render(<ProfilePage />)
    await waitFor(() => expect(screen.getByText('Acme Owner')).toBeInTheDocument())

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } })
    mockedAxios.get.mockResolvedValueOnce(mockBusinessApiResponse)

    fireEvent.click(screen.getByRole('button', { name: /edit business/i }))
    fireEvent.change(screen.getByPlaceholderText('password'), { target: { value: 'correctpass' } })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    await waitFor(() => {
      expect(screen.getByText('Edit Business', { selector: 'h2' })).toBeInTheDocument()
    })
  }

  it('closes edit modal when Cancel is clicked', async () => {
    await openEditModal()
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Edit Business', { selector: 'h2' })).not.toBeInTheDocument()
  })

  it('shows error when businessname is cleared and Save is clicked', async () => {
    await openEditModal()
    fireEvent.change(screen.getByPlaceholderText('Enter business name'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save business/i }))
    expect(screen.getByText('Business name is required')).toBeInTheDocument()
  })

  it('shows error when description is cleared and Save is clicked', async () => {
    await openEditModal()
    fireEvent.change(screen.getByPlaceholderText('Describe your business'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /save business/i }))
    expect(screen.getByText('Description is required')).toBeInTheDocument()
  })

  it('saves successfully, closes modal, and shows success message', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { success: true, message: 'Business profile updated successfully' },
    })
    await openEditModal()

    fireEvent.click(screen.getByRole('button', { name: /save business/i }))

    await waitFor(() => {
      expect(screen.queryByText('Edit Business', { selector: 'h2' })).not.toBeInTheDocument()
      expect(screen.getByText('Business profile updated successfully')).toBeInTheDocument()
    })
  })

  it('shows error message inside modal when save fails with axios error', async () => {
    mockedAxios.put.mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { message: 'Update failed' } },
    })
    await openEditModal()

    fireEvent.click(screen.getByRole('button', { name: /save business/i }))

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument()
    })
    expect(screen.getByText('Edit Business', { selector: 'h2' })).toBeInTheDocument()
  })

  it('shows generic error when save fails with non-axios error', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('network error'))
    await openEditModal()

    fireEvent.click(screen.getByRole('button', { name: /save business/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to update business profile.')).toBeInTheDocument()
    })
  })

  it('shows Saving while save is in progress', async () => {
    mockedAxios.put.mockImplementationOnce(() => new Promise(() => {}))
    await openEditModal()

    fireEvent.click(screen.getByRole('button', { name: /save business/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
    })
  })

  it('updates business type via the select', async () => {
    await openEditModal()

    const select = screen.getByDisplayValue('Commercial')
    fireEvent.change(select, { target: { value: 'personal' } })

    expect((select as HTMLSelectElement).value).toBe('personal')
  })

  it('updates location and pancard number fields', async () => {
    await openEditModal()

    fireEvent.change(screen.getByPlaceholderText('Enter location'), { target: { value: 'Pokhara' } })
    fireEvent.change(screen.getByPlaceholderText('Enter pancard number'), { target: { value: '999888' } })

    expect((screen.getByPlaceholderText('Enter location') as HTMLInputElement).value).toBe('Pokhara')
    expect((screen.getByPlaceholderText('Enter pancard number') as HTMLInputElement).value).toBe('999888')
  })
})