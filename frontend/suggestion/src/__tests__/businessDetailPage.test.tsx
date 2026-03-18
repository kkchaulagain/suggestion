import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from './test-router'
import axios from 'axios'

import BusinessDetailPage from '../pages/business-dashboard/pages/BusinessDetailPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

function renderDetail(businessId = 'bid1') {
  return render(
    <TestRouter initialEntries={[`/dashboard/businesses/${businessId}`]}>
      <Routes>
        <Route path="/dashboard/businesses/:businessId" element={<BusinessDetailPage />} />
      </Routes>
    </TestRouter>,
  )
}

function defaultBusiness(overrides = {}) {
  return {
    id: 'bid1',
    owner: '',
    businessname: 'CRM Biz',
    location: 'Ktm',
    description: 'Hello desc',
    ...overrides,
  }
}

function defaultCrm(overrides = {}) {
  return { tags: [], customFields: [], notes: [], tasks: [], timeline: [], ...overrides }
}

function mockGet(business = defaultBusiness(), crm = defaultCrm()) {
  mockedAxios.get.mockResolvedValue({
    data: { ok: true, business, crm },
  })
}

async function openEditDialog() {
  const editBtn = await screen.findByRole('button', { name: /^Edit$/i })
  fireEvent.click(editBtn)
  return screen.findByRole('dialog')
}

describe('BusinessDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockedAxios.patch.mockReset()
  })

  // ── Rendering ──────────────────────────────────────────────────────────────

  test('loads detail and shows business name in header and description in sidebar', async () => {
    mockGet()
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/CRM Biz/i)).toBeInTheDocument()
      expect(screen.getByText(/Hello desc/i)).toBeInTheDocument()
    })
  })

  test('load failure shows error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('fail'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/Could not load business/i)).toBeInTheDocument()
    })
  })

  test('shows public/private badge', async () => {
    mockGet(defaultBusiness({ isPublicCompany: true }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Public')).toBeInTheDocument())

    jest.clearAllMocks()
    mockGet(defaultBusiness({ isPublicCompany: false }))
    renderDetail()
    await waitFor(() => expect(screen.getByText('Private')).toBeInTheDocument())
  })

  // ── Edit dialog ────────────────────────────────────────────────────────────

  test('Edit button opens dialog with prefilled fields', async () => {
    mockGet()
    renderDetail()
    const dialog = await openEditDialog()
    expect(within(dialog).getByLabelText(/Business name/i)).toHaveValue('CRM Biz')
    expect(within(dialog).getByLabelText(/Location/i)).toHaveValue('Ktm')
    expect(within(dialog).getByLabelText(/Description/i)).toHaveValue('Hello desc')
  })

  test('Cancel closes dialog without saving', async () => {
    mockGet()
    renderDetail()
    const dialog = await openEditDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: /Cancel/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockedAxios.patch).not.toHaveBeenCalled()
  })

  test('save profile sends trimmed profile patch and closes dialog', async () => {
    mockGet(defaultBusiness({ businessname: 'Old', location: 'Loc', pancardNumber: '9', description: 'Desc' }))
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: defaultBusiness({ businessname: 'New', location: 'L2', pancardNumber: '99', description: 'D2' }),
        crm: defaultCrm(),
      },
    })

    renderDetail()
    const dialog = await openEditDialog()

    fireEvent.change(within(dialog).getByLabelText(/Business name/i), { target: { value: 'New' } })
    fireEvent.change(within(dialog).getByLabelText(/^Location/i), { target: { value: 'L2' } })
    fireEvent.change(document.getElementById('edit-pan')!, { target: { value: '99' } })
    fireEvent.change(within(dialog).getByLabelText(/Description/i), { target: { value: 'D2' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /Save changes/i }))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/bid1/detail'),
        {
          profile: {
            businessname: 'New',
            location: 'L2',
            pancardNumber: '99',
            description: 'D2',
            isPublicCompany: false,
            mapLocation: {
              googleMapsUrl: '',
              googleReviewsUrl: '',
              placeId: '',
              latitude: '',
              longitude: '',
            },
          },
        },
        expect.any(Object),
      )
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  test('patch failure shows API message or default', async () => {
    mockGet()
    mockedAxios.patch
      .mockRejectedValueOnce({ response: { data: { message: 'Bad patch' } } })
      .mockRejectedValueOnce(new Error('x'))

    renderDetail()
    const dialog = await openEditDialog()
    fireEvent.click(within(dialog).getByRole('button', { name: /Save changes/i }))
    await waitFor(() => expect(screen.getByText(/Bad patch/i)).toBeInTheDocument())

    // Dialog was closed (saveProfile closes it); reopen for second attempt
    const dialog2 = await openEditDialog()
    fireEvent.click(within(dialog2).getByRole('button', { name: /Save changes/i }))
    await waitFor(() => expect(screen.getByText(/Update failed/i)).toBeInTheDocument())
  })

  // ── Notes tab (default) ────────────────────────────────────────────────────

  test('add note calls patch and note appears', async () => {
    mockGet()
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: defaultBusiness(),
        crm: {
          ...defaultCrm(),
          notes: [{ id: 'n1', text: 'Hello note', createdAt: '2025-01-01T00:00:00.000Z' }],
          timeline: [{ id: 't1', eventType: 'note', summary: 'Note added', createdAt: '2025-01-01T00:00:00.000Z' }],
        },
      },
    })

    renderDetail()
    await waitFor(() => expect(screen.getByTestId('detail-add-note')).toBeInTheDocument())

    const noteTextarea = document.getElementById('detail-note') as HTMLTextAreaElement
    fireEvent.change(noteTextarea, { target: { value: 'Hello note' } })
    fireEvent.click(screen.getByTestId('detail-add-note'))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.stringContaining('/bid1/detail'),
        expect.objectContaining({ addNote: { text: 'Hello note' } }),
        expect.any(Object),
      )
      expect(screen.getByText(/Hello note/i)).toBeInTheDocument()
    })
  })

  test('note shows em dash when createdAt missing', async () => {
    mockGet(
      defaultBusiness(),
      defaultCrm({ notes: [{ id: 'n1', text: 'Note', createdAt: '' }] }),
    )
    renderDetail()
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument())
  })

  test('note date falls back when toLocaleString throws', async () => {
    jest.spyOn(Date.prototype, 'toLocaleString').mockImplementation(() => {
      throw new Error('bad locale')
    })
    mockGet(
      defaultBusiness(),
      defaultCrm({ notes: [{ id: 'n1', text: 'N', createdAt: '2020-06-15T12:00:00.000Z' }] }),
    )
    renderDetail()
    await waitFor(() => expect(screen.getByText('2020-06-15T12:00:00.000Z')).toBeInTheDocument())
    jest.restoreAllMocks()
  })

  // ── Tasks tab ─────────────────────────────────────────────────────────────

  async function goToTasksTab() {
    await waitFor(() => expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Tasks/i }))
  }

  test('add task empty does not patch; filled task patches', async () => {
    mockGet()
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: defaultBusiness(),
        crm: defaultCrm({ tasks: [{ id: 't1', title: 'Do it', completed: false, createdAt: '2025-01-01' }] }),
      },
    })

    renderDetail()
    await goToTasksTab()

    // The tasks "Add" button comes after the task input (#detail-task) in the DOM
    const taskInput = await screen.findByPlaceholderText(/Task title/i)
    const addBtn = taskInput.closest('div')!.parentElement!
      .querySelector('button') as HTMLButtonElement
    const n = mockedAxios.patch.mock.calls.length
    fireEvent.click(addBtn)
    expect(mockedAxios.patch.mock.calls.length).toBe(n)

    fireEvent.change(document.getElementById('detail-task')!, { target: { value: 'Do it' } })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ addTask: { title: 'Do it' } }),
        expect.any(Object),
      )
    })
  })

  test('toggle task sends updateTask', async () => {
    mockGet(
      defaultBusiness(),
      defaultCrm({ tasks: [{ id: 't1', title: 'T', completed: false, createdAt: '2025-01-01' }] }),
    )
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: defaultBusiness(),
        crm: defaultCrm({ tasks: [{ id: 't1', title: 'T', completed: true, createdAt: '2025-01-01' }] }),
      },
    })

    renderDetail()
    await goToTasksTab()
    await screen.findByText('T')
    fireEvent.click(screen.getByRole('button', { name: /Mark complete/i }))

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        { updateTask: { taskId: 't1', completed: true } },
        expect.any(Object),
      )
    })
  })

  // ── Tags (sidebar) ─────────────────────────────────────────────────────────

  test('add duplicate tag clears input without patch; new tag patches', async () => {
    mockGet(defaultBusiness(), defaultCrm({ tags: ['vip'] }))
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: defaultBusiness(),
        crm: defaultCrm({ tags: ['vip', 'new'] }),
      },
    })

    renderDetail()
    await waitFor(() => expect(screen.getAllByText('vip').length).toBeGreaterThan(0))
    const tagInput = screen.getByPlaceholderText(/Add tag/i)
    const addBtn = screen.getByRole('button', { name: /^Add$/i })

    fireEvent.change(tagInput, { target: { value: 'vip' } })
    const before = mockedAxios.patch.mock.calls.length
    fireEvent.click(addBtn)
    expect(mockedAxios.patch.mock.calls.length).toBe(before)

    fireEvent.change(tagInput, { target: { value: 'new' } })
    fireEvent.click(addBtn)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        { tags: ['vip', 'new'] },
        expect.any(Object),
      )
    })
  })

  test('Enter key in tag input triggers add', async () => {
    mockGet(defaultBusiness(), defaultCrm({ tags: [] }))
    mockedAxios.patch.mockResolvedValue({
      data: { ok: true, business: defaultBusiness(), crm: defaultCrm({ tags: ['pressed'] }) },
    })

    renderDetail()
    await waitFor(() => expect(screen.getByPlaceholderText(/Add tag/i)).toBeInTheDocument())
    const tagInput = screen.getByPlaceholderText(/Add tag/i)
    fireEvent.change(tagInput, { target: { value: 'pressed' } })
    fireEvent.keyDown(tagInput, { key: 'Enter' })

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        { tags: ['pressed'] },
        expect.any(Object),
      )
    })
  })

  // ── Activity tab ───────────────────────────────────────────────────────────

  test('activity timeline lists events on Activity tab', async () => {
    mockGet(
      defaultBusiness(),
      defaultCrm({
        timeline: [
          { id: 'ev1', eventType: 'profile_update', summary: 'Name changed', createdAt: '2024-01-02T00:00:00.000Z' },
        ],
      }),
    )

    renderDetail()
    await waitFor(() => expect(screen.getByRole('button', { name: /^Edit$/i })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /Activity/i }))

    await waitFor(() => {
      expect(screen.getByText('profile_update')).toBeInTheDocument()
      expect(screen.getByText(/Name changed/i)).toBeInTheDocument()
    })
  })

  // ── Sidebar ────────────────────────────────────────────────────────────────

  test('renders custom fields in sidebar', async () => {
    mockGet(
      defaultBusiness(),
      defaultCrm({
        tags: ['alpha', 'beta'],
        customFields: [{ key: 'k1', value: 42, fieldType: 'number' }],
      }),
    )

    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('k1')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getAllByText('alpha').length).toBeGreaterThan(0)
    })
  })

  test('renders map links when mapLocation set', async () => {
    mockGet(
      defaultBusiness({
        mapLocation: {
          googleMapsUrl: 'https://maps.google.com/?q=here',
          googleReviewsUrl: 'https://reviews.google.com/',
          latitude: 27.7,
          longitude: 85.3,
        },
      }),
    )

    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/Open in Maps/i)).toBeInTheDocument()
      expect(screen.getByText(/View Reviews/i)).toBeInTheDocument()
      expect(screen.getByText('27.7, 85.3')).toBeInTheDocument()
    })
  })
})
