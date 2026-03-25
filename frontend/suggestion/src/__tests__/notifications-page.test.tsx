import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'
import NotificationsPage from '../pages/business-dashboard/pages/NotificationsPage'
import { TestRouter } from './test-router'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockRefetchBusiness = jest.fn().mockResolvedValue(undefined)
let mockBusiness:
  | { _id?: string; emailNotificationsEnabled?: boolean }
  | undefined

jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    getAuthHeaders: () => ({ Authorization: 'Bearer fake-token' }),
    business: mockBusiness,
    refetchBusiness: mockRefetchBusiness,
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
    mockedAxios.put = jest.fn() as unknown as typeof mockedAxios.put
    mockRefetchBusiness.mockClear()
    mockBusiness = { _id: 'biz-1', emailNotificationsEnabled: true }
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

    await waitFor(() => {
      expect(screen.getByText(/2 unique email recipients found/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/This QR and link will be embedded in the outgoing email\./i)).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByAltText(/QR for Customer Survey/i)).toBeInTheDocument()
    })
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

  test('shows errors when forms, recipients, and qr assets fail to load', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('forms failed'))

    const firstRender = renderNotificationsPage()

    expect(await screen.findByText(/Unable to load forms for notifications\./i)).toBeInTheDocument()
    firstRender.unmount()

    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          feedbackForms: [{ _id: 'form-3', title: 'NPS Survey' }],
        },
      })
      .mockRejectedValueOnce({ response: { data: { error: 'Recipients unavailable' } } })

    mockedAxios.post.mockRejectedValueOnce({ response: { data: { error: 'QR generation failed' } } })

    const firstRender = renderNotificationsPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Please complete: NPS Survey/i)).toBeInTheDocument()
    })
    expect(await screen.findByText(/Recipients unavailable/i)).toBeInTheDocument()
    expect(await screen.findByText(/QR generation failed/i)).toBeInTheDocument()
    expect(screen.getByText(/QR preview unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/0 unique email recipients found/i)).toBeInTheDocument()
  })

  test('validates scheduling, schedules campaigns, and handles send failure', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          feedbackForms: [{ _id: 'form-4', title: 'Launch Survey' }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          formId: 'form-4',
          formTitle: 'Launch Survey',
          totalRecipients: 3,
        },
      })

    mockedAxios.post
      .mockResolvedValueOnce({
        data: {
          formUrl: 'https://frontend.example.com/forms/form-4',
          qrCodeDataUrl: 'data:image/png;base64,abc',
        },
      })
      .mockResolvedValueOnce({
        status: 202,
        data: {
          recipientCount: 3,
          scheduledFor: '2026-04-01T10:30:00.000Z',
        },
      })
      .mockRejectedValueOnce({ response: { data: { error: 'Failed to send campaign.' } } })

    renderNotificationsPage()

    await waitFor(() => {
      expect(screen.getByDisplayValue(/Please complete: Launch Survey/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Schedule send time/i), {
      target: { value: 'invalid-date' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Schedule campaign/i }))
    expect(await screen.findByText(/Scheduled date\/time is invalid\./i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Schedule send time/i), {
      target: { value: '2020-01-01T00:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Schedule campaign/i }))
    expect(await screen.findByText(/Schedule time must be in the future\./i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Schedule send time/i), {
      target: { value: '2026-04-01T10:30' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Schedule campaign/i }))

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenLastCalledWith(
        expect.stringContaining('/form-4/notifications/campaign'),
        expect.objectContaining({
          subject: 'Please complete: Launch Survey',
          scheduleAt: '2026-04-01T10:30:00.000Z',
        }),
        expect.any(Object),
      )
    })
    expect(await screen.findByText(/Campaign scheduled for .* to 3 recipients\./i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/Business message/i), {
      target: { value: 'Retry send' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Schedule campaign/i }))
    expect(await screen.findByText(/Failed to send campaign\./i)).toBeInTheDocument()
  })

  test('toggles email notifications and handles missing business and server failures', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          feedbackForms: [{ _id: 'form-5', title: 'Support Follow-up' }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          formId: 'form-5',
          formTitle: 'Support Follow-up',
          totalRecipients: 1,
        },
      })
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        formUrl: 'https://frontend.example.com/forms/form-5',
        qrCodeDataUrl: 'data:image/png;base64,xyz',
      },
    })
    ;(mockedAxios.put as jest.Mock)
      .mockResolvedValueOnce({ data: { ok: true } })
      .mockRejectedValueOnce({ response: { data: { message: 'Update failed on server' } } })

    renderNotificationsPage()

    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /toggle email notifications/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Hide campaign/i }))
    expect(screen.queryByText(/Create a campaign/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Create campaign/i }))
    expect(screen.getByText(/Create a campaign/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('switch', { name: /toggle email notifications/i }))
    expect(await screen.findByText(/Business email notifications are off\./i)).toBeInTheDocument()
    expect(mockRefetchBusiness).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('switch', { name: /toggle email notifications/i }))
    expect(await screen.findByText(/Update failed on server/i)).toBeInTheDocument()

    firstRender.unmount()
    mockBusiness = undefined
    const rerendered = renderNotificationsPage()
    await waitFor(() => {
      expect(screen.getByRole('switch', { name: /toggle email notifications/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('switch', { name: /toggle email notifications/i }))
    expect(await screen.findByText(/Business profile is not loaded yet\./i)).toBeInTheDocument()
    rerendered.unmount()
  })
})
