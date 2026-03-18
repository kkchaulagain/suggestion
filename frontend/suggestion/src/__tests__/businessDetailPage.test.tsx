import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Route, Routes } from 'react-router-dom'
import { TestRouter } from './test-router'
import axios from 'axios'

import BusinessDetailPage from '../pages/business-dashboard/pages/BusinessDetailPage'
import { isSectionEnabled } from '../pages/business-dashboard/pages/businessDetailPageConfig'

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

describe('businessDetailConfig', () => {
  test('overview section enabled by default', () => {
    expect(isSectionEnabled('overview')).toBe(true)
  })
})

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
})
