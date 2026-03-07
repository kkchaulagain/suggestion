import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import UsersPage from '../pages/business-dashboard/pages/UsersPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'admin-1', name: 'Admin', email: 'admin@test.com', role: 'admin' },
    getAuthHeaders: () => ({ Authorization: 'Bearer token' }),
  }),
}))

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
  })

  it('shows loading then empty state', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { users: [], pagination: { total: 0 } } },
    })

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Loading users/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText(/No users found/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: /Users/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument()
  })

  it('shows error when fetch fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'))

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument()
    })
  })

  it('shows user list and opens edit modal', async () => {
    const users = [
      { _id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'user', isActive: true },
    ]
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { users, pagination: { total: 1 } } },
    })

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Jane').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('jane@example.com').length).toBeGreaterThanOrEqual(1)
    })

    const editButtons = screen.getAllByRole('button', { name: /Edit/i })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Edit user/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/Name/i)).toHaveValue('Jane')
      expect(screen.getByLabelText(/Email/i)).toHaveValue('jane@example.com')
    })

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Edit user/i })).not.toBeInTheDocument()
    })
  })

  it('opens deactivate confirmation and can cancel', async () => {
    const users = [
      { _id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'business', isActive: true },
    ]
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { users, pagination: { total: 1 } } },
    })

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1)
    })

    const deactivateButtons = screen.getAllByRole('button', { name: /Deactivate/i })
    fireEvent.click(deactivateButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Deactivate user/i })).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog', { name: /Deactivate user/i })
    expect(within(dialog).getByText(/Bob/)).toBeInTheDocument()
    expect(within(dialog).getByText(/bob@example.com/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Deactivate user/i })).not.toBeInTheDocument()
    })
  })

  it('has filter inputs and Apply button', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, data: { users: [], pagination: { total: 0 } } },
    })

    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/No users found/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText(/Search/i), { target: { value: 'test' } })
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }))
    // After Apply, filters are applied; verify no crash and filter controls remain
    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument()
  })
})
