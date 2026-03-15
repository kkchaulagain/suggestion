import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TestRouter } from './test-router'
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

type UsersGetResponse = { data: { success: boolean; data: { users: unknown[]; pagination: { total: number } } } }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((r, rej) => {
    resolve = r
    reject = rej
  })
  return { promise, resolve, reject }
}

/** Tracks one deferred per axios.get() call so refetches (e.g. after save) can be resolved inside act(). */
let getDeferreds: Array<ReturnType<typeof deferred<UsersGetResponse>>>

function setupGetMock() {
  getDeferreds = []
  mockedAxios.get.mockImplementation(() => {
    const d = deferred<UsersGetResponse>()
    getDeferreds.push(d)
    return d.promise
  })
}

async function flushInitialLoadInAct(response: UsersGetResponse) {
  await act(async () => {
    getDeferreds[0].resolve(response)
    await Promise.resolve()
    await Promise.resolve()
  })
}

async function flushInitialRejectInAct(err: unknown) {
  await act(async () => {
    getDeferreds[0].reject(err)
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('UsersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
  })

  it('shows loading then empty state', async () => {
    setupGetMock()
    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    expect(screen.getByText(/Loading users/i)).toBeInTheDocument()

    await flushInitialLoadInAct({ data: { success: true, data: { users: [], pagination: { total: 0 } } } })

    await waitFor(() => {
      expect(screen.getByText(/No users found/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: /Users/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Search/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Apply/i })).toBeInTheDocument()
  })

  it('shows error when fetch fails', async () => {
    setupGetMock()
    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialRejectInAct(new Error('Network error'))

    await waitFor(() => {
      expect(screen.getByText(/Failed to load users/i)).toBeInTheDocument()
    })
  })

  it('shows user list and opens edit modal', async () => {
    const users = [
      { _id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'user', isActive: true },
    ]
    setupGetMock()
    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })

    await waitFor(() => {
      expect(screen.getAllByText('Jane').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('jane@example.com').length).toBeGreaterThanOrEqual(1)
    })

    const table = screen.queryByRole('table')
    const editButton = table
      ? within(table).getByRole('button', { name: /Edit Jane/i })
      : screen.getAllByRole('button', { name: /Edit/i })[0]
    fireEvent.click(editButton)

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
    setupGetMock()
    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })

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
    setupGetMock()
    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users: [], pagination: { total: 0 } } } })

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

  it('edit modal save succeeds and closes', async () => {
    const users = [
      { _id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'user', isActive: true },
    ]
    setupGetMock()
    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })
    mockedAxios.put.mockResolvedValue({
      data: { success: true, data: { _id: 'u1', name: 'Jane Updated', email: 'jane@example.com', role: 'business' } },
    })

    await waitFor(() => {
      expect(screen.getAllByText('Jane').length).toBeGreaterThanOrEqual(1)
    })

    const editButtons = screen.getAllByRole('button', { name: /Edit/i })
    fireEvent.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Edit user/i })).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/^Name/i)
    fireEvent.change(nameInput, { target: { value: 'Jane Updated' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/u1'),
        expect.objectContaining({ name: 'Jane Updated' }),
        expect.any(Object),
      )
    })
    await act(async () => {
      getDeferreds[1].resolve({
        data: { success: true, data: { users: [{ _id: 'u1', name: 'Jane Updated', email: 'jane@example.com', role: 'business', isActive: true }], pagination: { total: 1 } } },
      })
      await Promise.resolve()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Edit user/i })).not.toBeInTheDocument()
    })
  }, 10000)

  it('edit modal save shows error when PUT fails', async () => {
    const users = [
      { _id: 'u1', name: 'Jane', email: 'jane@example.com', role: 'user', isActive: true },
    ]
    setupGetMock()
    const axiosError = { response: { data: { message: 'Email already in use' } } }
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
    mockedAxios.put.mockRejectedValue(axiosError)

    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })

    await waitFor(() => {
      expect(screen.getAllByText('Jane').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Edit/i })[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Edit user/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Email already in use/i)).toBeInTheDocument()
    })
    isAxiosErrorSpy.mockRestore()
  })

  it('confirm deactivate calls PATCH and closes', async () => {
    const users = [
      { _id: 'u2', name: 'Bob', email: 'bob@example.com', role: 'business', isActive: true },
    ]
    setupGetMock()
    mockedAxios.patch.mockResolvedValue({ data: { success: true } })

    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })

    await waitFor(() => {
      expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getAllByRole('button', { name: /Deactivate Bob/i })[0])

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Deactivate user/i })).toBeInTheDocument()
    })

    const confirmBtn = within(screen.getByRole('dialog')).getByRole('button', { name: /^Deactivate$/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/u2/deactivate'),
        {},
        expect.any(Object),
      )
    })
    await act(async () => {
      getDeferreds[1].resolve({ data: { success: true, data: { users: [], pagination: { total: 0 } } } })
      await Promise.resolve()
      await Promise.resolve()
    })
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Deactivate user/i })).not.toBeInTheDocument()
    })
  })

  it('activate button calls PATCH and refreshes list', async () => {
    const users = [
      { _id: 'u3', name: 'Inactive', email: 'inactive@example.com', role: 'user', isActive: false },
    ]
    setupGetMock()
    mockedAxios.patch.mockResolvedValue({ data: { success: true } })

    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })

    await waitFor(
      () => {
        expect(screen.queryByText(/Loading users/)).not.toBeInTheDocument()
        expect(screen.getAllByText('Inactive').length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )

    const cardActivate = screen.queryByRole('button', { name: /^Activate$/i })
    if (cardActivate) fireEvent.click(cardActivate)
    const tableActivate = screen.getByRole('button', { name: /Activate Inactive/i })
    fireEvent.click(tableActivate)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/u3/activate'),
        {},
        expect.any(Object),
      )
    })
    await act(async () => {
      getDeferreds[1].resolve({
        data: { success: true, data: { users: [{ _id: 'u3', name: 'Inactive', email: 'inactive@example.com', role: 'user', isActive: true }], pagination: { total: 1 } } },
      })
      await Promise.resolve()
      await Promise.resolve()
    })
  })

  it('activate failure shows error message', async () => {
    const users = [
      { _id: 'u4', name: 'Inactive2', email: 'inactive2@example.com', role: 'user', isActive: false },
    ]
    setupGetMock()
    mockedAxios.patch.mockRejectedValue(new Error('Network error'))

    render(
      <TestRouter>
        <UsersPage />
      </TestRouter>,
    )

    await flushInitialLoadInAct({ data: { success: true, data: { users, pagination: { total: 1 } } } })

    await waitFor(() => {
      expect(screen.getAllByText('Inactive2').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.click(screen.getByRole('button', { name: /Activate Inactive2/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed to activate user/i)).toBeInTheDocument()
    })
  })
})
