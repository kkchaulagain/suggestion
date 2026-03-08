import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import FormsPage from '../pages/business-dashboard/pages/FormsPage'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

function renderFormsPage() {
  return render(
    <MemoryRouter>
      <FormsPage />
    </MemoryRouter>,
  )
}

describe('FormsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    mockNavigate.mockReset()
    localStorage.clear()
  })

  test('shows load error when fetching forms fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'))

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Unable to load forms\. Please check business login\./i)).toBeInTheDocument()
    })
  })

  interface FormsListApiResponse { data: { feedbackForms: Array<{ _id: string; title?: string; description?: string; businessId?: string; fields?: Array<{ name: string; label: string; type: string; required?: boolean }> }> } }

  test('generates and shows QR code for a form', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f1',
            title: 'Customer Feedback',
            description: 'Tell us what to improve',
            businessId: 'b1',
            fields: [{ name: 'comment', label: 'Comment', type: 'long_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)

    interface QrCodeApiResponse { data: { qrCodeDataUrl: string; formUrl: string } }
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        qrCodeDataUrl: 'data:image/png;base64,abc',
        formUrl: 'https://frontend.example.com/feedback-forms/f1',
      },
    } as QrCodeApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Customer Feedback/i)).toBeInTheDocument()
    })
    expect(screen.getByText('1 question - 0 required')).toBeInTheDocument()
    expect(screen.getByText(/Questions included:/i)).toBeInTheDocument()
    expect(screen.getByText(/Comment/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Share: Customer Feedback/i })).toBeInTheDocument()
    })
    await waitFor(() => {
      expect(screen.getByAltText(/QR for Customer Feedback/i)).toBeInTheDocument()
      expect(screen.getByText(/https:\/\/frontend\.example\.com\/feedback-forms\/f1/i)).toBeInTheDocument()
    })
  })

  test('shows fallback QR error when backend does not provide error message', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f2',
            title: 'Issue Form',
            businessId: 'b1',
            fields: [{ name: 'issue', label: 'Issue', type: 'short_text', required: true }],
          },
        ],
      },
    } as FormsListApiResponse)

    mockedAxios.post.mockRejectedValueOnce(new Error('qr failed'))

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Issue Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Share: Issue Form/i })).toBeInTheDocument()
    })

    await waitFor(
      () => {
        const alerts = screen.getAllByText(/Failed to generate QR/i)
        expect(alerts.length).toBeGreaterThanOrEqual(1)
      },
      { timeout: 3000 },
    )
  })

  test('Responses button navigates to submissions with formId param', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'form-abc-123',
            title: 'Feedback Form',
            businessId: 'b1',
            fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Feedback Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Responses/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/submissions?formId=form-abc-123')
  })

  test('renders useful summary information instead of business id text', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f3',
            title: 'Walk-in Form',
            description: 'Collect quick front-desk details',
            businessId: 'b1',
            fields: [
              { name: 'name', label: 'Name', type: 'short_text', required: true },
              { name: 'purpose', label: 'Purpose', type: 'long_text', required: false },
            ],
          },
        ],
      },
    } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Walk-in Form/i)).toBeInTheDocument()
    })

    expect(screen.getByText('2 questions - 1 required')).toBeInTheDocument()
    expect(screen.queryByText(/Business ID:/i)).not.toBeInTheDocument()
  })
})
