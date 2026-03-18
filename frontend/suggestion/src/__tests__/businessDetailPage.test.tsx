import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

describe('BusinessDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockedAxios.patch.mockReset()
  })

  test('loads detail and shows profile', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: {
          id: 'bid1',
          owner: '',
          businessname: 'CRM Biz',
          location: 'Ktm',
          description: 'Hello',
        },
        crm: { tags: [], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })

    renderDetail()

    await waitFor(() => {
      expect(screen.getByText(/CRM Biz/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Hello')).toBeInTheDocument()
    })
  })

  test('add note calls patch and shows note', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: {
          id: 'bid1',
          businessname: 'B',
          description: 'D',
        },
        crm: { tags: [], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })

    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [{ id: 'n1', text: 'Hello note', createdAt: '2025-01-01T00:00:00.000Z' }],
          tasks: [],
          timeline: [{ id: 't1', eventType: 'note', summary: 'Note added', createdAt: '2025-01-01T00:00:00.000Z' }],
        },
      },
    })

    renderDetail()

    await screen.findByRole('heading', { name: /^Notes$/i })
    const noteField = screen.getByLabelText(/New note/i)
    fireEvent.change(noteField, { target: { value: 'Hello note' } })
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

  test('load failure shows error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('fail'))
    renderDetail()
    await waitFor(() => {
      expect(screen.getByText(/Could not load business/i)).toBeInTheDocument()
    })
  })

  test('patch failure shows API message or default', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: { tags: [], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })
    mockedAxios.patch
      .mockRejectedValueOnce({ response: { data: { message: 'Bad patch' } } })
      .mockRejectedValueOnce(new Error('x'))

    renderDetail()
    await screen.findByRole('heading', { name: /^Profile$/i })
    fireEvent.click(screen.getByRole('button', { name: /Save profile/i }))
    await waitFor(() => expect(screen.getByText(/Bad patch/i)).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: /Save profile/i }))
    await waitFor(() => expect(screen.getByText(/Update failed/i)).toBeInTheDocument())
  })

  test('save profile sends trimmed profile patch', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: {
          id: 'bid1',
          businessname: 'Old',
          location: 'Loc',
          pancardNumber: 9,
          description: 'Desc',
        },
        crm: { tags: [], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'New', location: 'L2', pancardNumber: '9', description: 'D2' },
        crm: { tags: [], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })

    renderDetail()
    await screen.findByLabelText(/Business name/i)
    fireEvent.change(screen.getByLabelText(/Business name/i), { target: { value: 'New' } })
    fireEvent.change(screen.getByLabelText(/^Location$/i), { target: { value: 'L2' } })
    fireEvent.change(document.getElementById('detail-pan')!, { target: { value: '99' } })
    fireEvent.change(screen.getByLabelText(/^Description$/i), { target: { value: 'D2' } })
    fireEvent.click(screen.getByRole('button', { name: /Save profile/i }))

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
    })
  })

  test('add task empty does not patch; filled task patches', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: { tags: [], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [],
          tasks: [{ id: 't1', title: 'Do it', completed: false, createdAt: '2025-01-01' }],
          timeline: [],
        },
      },
    })

    renderDetail()
    await screen.findByRole('heading', { name: /^Tasks$/i })
    const taskAdd = screen.getAllByRole('button', { name: /^Add$/i })[1]
    const n = mockedAxios.patch.mock.calls.length
    fireEvent.click(taskAdd)
    expect(mockedAxios.patch.mock.calls.length).toBe(n)

    fireEvent.change(screen.getByLabelText(/New task/i), { target: { value: 'Do it' } })
    fireEvent.click(taskAdd)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ addTask: { title: 'Do it' } }),
        expect.any(Object),
      )
    })
  })

  test('toggle task sends updateTask', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [],
          tasks: [{ id: 't1', title: 'T', completed: false, createdAt: '2025-01-01' }],
          timeline: [],
        },
      },
    })
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [],
          tasks: [{ id: 't1', title: 'T', completed: true, createdAt: '2025-01-01' }],
          timeline: [],
        },
      },
    })

    renderDetail()
    await screen.findByText('T')
    const cb = screen.getByRole('checkbox')
    fireEvent.click(cb)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        { updateTask: { taskId: 't1', completed: true } },
        expect.any(Object),
      )
    })
  })

  test('add duplicate tag clears input without patch; new tag patches', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: { tags: ['vip'], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })
    mockedAxios.patch.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: { tags: ['vip', 'new'], customFields: [], notes: [], tasks: [], timeline: [] },
      },
    })

    renderDetail()
    await screen.findByText('vip')
    const tagInput = screen.getByLabelText(/Add tag/i)
    const tagAdd = screen.getAllByRole('button', { name: /^Add$/i })[0]
    fireEvent.change(tagInput, { target: { value: 'vip' } })
    const before = mockedAxios.patch.mock.calls.length
    fireEvent.click(tagAdd)
    expect(mockedAxios.patch.mock.calls.length).toBe(before)

    fireEvent.change(tagInput, { target: { value: 'new' } })
    fireEvent.click(tagAdd)

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        expect.any(String),
        { tags: ['vip', 'new'] },
        expect.any(Object),
      )
    })
  })

  test('renders custom fields when present', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: ['a', 'b'],
          customFields: [{ key: 'k1', value: 42, fieldType: 'number' }],
          notes: [],
          tasks: [],
          timeline: [],
        },
      },
    })

    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('k1:')).toBeInTheDocument()
      expect(screen.getByText('42')).toBeInTheDocument()
      expect(screen.getByText('a')).toBeInTheDocument()
    })
  })

  test('activity timeline lists events', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [],
          tasks: [],
          timeline: [
            { id: 'ev1', eventType: 'profile_update', summary: 'Name changed', createdAt: '2024-01-02T00:00:00.000Z' },
          ],
        },
      },
    })

    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('profile_update')).toBeInTheDocument()
      expect(screen.getByText(/Name changed/i)).toBeInTheDocument()
    })
  })

  test('note shows em dash when createdAt missing', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [{ id: 'n1', text: 'Note', createdAt: '' }],
          tasks: [],
          timeline: [],
        },
      },
    })

    renderDetail()
    await waitFor(() => expect(screen.getByText('—')).toBeInTheDocument())
  })

  test('note date falls back when toLocaleString throws', async () => {
    jest.spyOn(Date.prototype, 'toLocaleString').mockImplementation(() => {
      throw new Error('bad locale')
    })
    mockedAxios.get.mockResolvedValue({
      data: {
        ok: true,
        business: { id: 'bid1', businessname: 'B', description: 'D' },
        crm: {
          tags: [],
          customFields: [],
          notes: [{ id: 'n1', text: 'N', createdAt: '2020-06-15T12:00:00.000Z' }],
          tasks: [],
          timeline: [],
        },
      },
    })

    renderDetail()
    await waitFor(() => {
      expect(screen.getByText('2020-06-15T12:00:00.000Z')).toBeInTheDocument()
    })
    jest.restoreAllMocks()
  })
})
