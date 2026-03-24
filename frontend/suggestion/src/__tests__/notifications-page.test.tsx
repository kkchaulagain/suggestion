import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import NotificationsPage from '../pages/business-dashboard/pages/NotificationsPage'
import { TestRouter } from './test-router'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
  }),
}))

function renderNotificationsPage() {
  return render(
    <TestRouter>
      <NotificationsPage />
    </TestRouter>,
  )
}

describe('NotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
    mockedAxios.post.mockReset()
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } })
  })

  test('loads selected form share assets without exposing editable html', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          feedbackForms: [
            { _id: 'form-1', title: 'Customer Survey' },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          formId: 'form-1',
          formTitle: 'Customer Survey',
          totalRecipients: 2,
          recipients: [
            { email: 'one@example.com', submissionId: 's1', submittedAt: '2026-03-20T10:00:00.000Z' },
            { email: 'two@example.com', submissionId: 's2', submittedAt: '2026-03-20T11:00:00.000Z' },
          ],
        },
      })

    mockedAxios.post.mockResolvedValueOnce({
      data: {
        formUrl: 'https://frontend.example.com/forms/form-1',
        qrCodeDataUrl: 'data:image/png;base64,abc',
      },
    })

    renderNotificationsPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Please complete: Customer Survey/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/2 unique email recipients found/i)).toBeInTheDocument()
    expect(screen.getByText(/This QR and link will be embedded in the outgoing email\./i)).toBeInTheDocument()
    expect(screen.getByAltText(/QR for Customer Survey/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Editable HTML layout/i)).not.toBeInTheDocument()
    expect(screen.getByText(/We build the email layout automatically from your message and the selected form\./i)).toBeInTheDocument()
  })

  test('sends generated email layout for the selected form', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          feedbackForms: [
            { _id: 'form-2', title: 'Event Registration' },
          ],
        },
      })
      .mockResolvedValueOnce({
        data: {
          formId: 'form-2',
          formTitle: 'Event Registration',
          totalRecipients: 1,
          recipients: [
            { email: 'guest@example.com', submissionId: 's9', submittedAt: '2026-03-20T10:00:00.000Z' },
          ],
        },
      })

    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          formUrl: 'https://frontend.example.com/forms/form-2',
          qrCodeDataUrl: 'data:image/png;base64,xyz',
        },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: {
          message: 'Campaign sent',
          recipientCount: 1,
          sent: 1,
          failed: 0,
        },
      })

    renderNotificationsPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Please complete: Event Registration/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Business message/i), {
      target: { value: 'Hello attendees,\n\nPlease confirm your details.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /^Send campaign$/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/form-2/notifications/campaign'),
        expect.objectContaining({
          subject: 'Please complete: Event Registration',
          htmlBody: expect.stringContaining('{{FORM_LINK}}'),
        }),
        expect.any(Object),
      )
    })

    expect(screen.getByText(/Campaign sent\. Delivered: 1, failed: 0\./i)).toBeInTheDocument()
  })
})
