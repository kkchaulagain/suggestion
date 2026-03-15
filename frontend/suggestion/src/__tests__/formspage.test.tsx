import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    mockedAxios.delete.mockReset()
    mockNavigate.mockReset()
    localStorage.clear()
    Object.assign(navigator, { clipboard: { writeText: jest.fn().mockResolvedValue(undefined) } })
  })

  test('shows load error when fetching forms fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('network error'))

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Unable to load forms\. Please check business login\./i)).toBeInTheDocument()
    })
  })

  test('Add Form button navigates to create form page', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { feedbackForms: [] } } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/you don't have any forms yet/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /add form/i }))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/forms/create')
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
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }))
  })

  test('Share modal closes when backdrop is clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f1',
            title: 'Test Form',
            businessId: 'b1',
            fields: [{ name: 'q', label: 'Q', type: 'short_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)
    mockedAxios.post.mockResolvedValueOnce({
      data: { qrCodeDataUrl: 'data:image/png,xyz', formUrl: 'https://example.com/f1' },
    })

    renderFormsPage()
    await waitFor(() => expect(screen.getByText(/Test Form/i)).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: /share/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /Share: Test Form/i })).toBeInTheDocument())
    const dialog = screen.getByRole('dialog', { name: /Share: Test Form/i })
    fireEvent.click(dialog)
    await waitFor(() => expect(screen.queryByRole('heading', { name: /Share: Test Form/i })).not.toBeInTheDocument())
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

  test('Edit button navigates to edit form page', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'form-xyz-456',
            title: 'Edit Target Form',
            businessId: 'b1',
            fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Edit Target Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/forms/form-xyz-456/edit')
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

  test('shows Form / Poll / Survey badge per form and Results button navigates with tab=results', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f-form',
            title: 'Standard Form',
            businessId: 'b1',
            kind: 'form',
            fields: [{ name: 'q', label: 'Q', type: 'short_text', required: false }],
          },
          {
            _id: 'f-poll',
            title: 'Quick Poll',
            businessId: 'b1',
            kind: 'poll',
            fields: [{ name: 'vote', label: 'Vote', type: 'radio', required: true, options: ['A', 'B'] }],
          },
          {
            _id: 'f-survey',
            title: 'Survey',
            businessId: 'b1',
            kind: 'survey',
            showResultsPublic: true,
            fields: [
              { name: 'r', label: 'Rating', type: 'radio', required: true, options: ['1', '2'] },
              { name: 'c', label: 'Comment', type: 'short_text', required: false },
            ],
          },
        ],
      },
    } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Standard Form/i)).toBeInTheDocument()
    })

    expect(screen.getByTestId('form-kind-badge-f-form')).toHaveTextContent('Form')
    expect(screen.getByTestId('form-kind-badge-f-poll')).toHaveTextContent('Poll')
    expect(screen.getByTestId('form-kind-badge-f-survey')).toHaveTextContent('Survey')

    expect(screen.getByTestId('form-results-visibility-f-form')).toHaveTextContent('Results private')
    expect(screen.getByTestId('form-results-visibility-f-survey')).toHaveTextContent('Results public')

    fireEvent.click(screen.getAllByRole('button', { name: /^Results$/i })[0])
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('tab=results'))
  })

  test('filter by kind shows only matching forms', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f1',
            title: 'Form One',
            businessId: 'b1',
            kind: 'form',
            fields: [{ name: 'q', label: 'Q', type: 'short_text', required: false }],
          },
          {
            _id: 'f2',
            title: 'Poll One',
            businessId: 'b1',
            kind: 'poll',
            fields: [{ name: 'v', label: 'V', type: 'radio', required: true, options: ['X'] }],
          },
        ],
      },
    } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Form One/i)).toBeInTheDocument()
      expect(screen.getByText(/Poll One/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Poll$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Poll One/i)).toBeInTheDocument()
      expect(screen.queryByText(/Form One/i)).not.toBeInTheDocument()
    })
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
  
  test('Delete button opens modal and deletes form on confirm', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f-delete-1',
            title: 'Delete Form',
            businessId: 'b1',
            fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)
    mockedAxios.delete.mockResolvedValueOnce({ data: { message: 'Feedback form deleted' } })

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Delete Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: /^Delete$/i })[0])

    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveTextContent('Delete form')
      expect(dialog).toHaveTextContent('Delete Form')
    })

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Delete$/i }))

    await waitFor(() => {
      expect(mockedAxios.delete).toHaveBeenCalledWith(expect.stringContaining('/f-delete-1'), expect.any(Object))
    })
    await waitFor(() => {
      expect(screen.queryByText(/Delete Form/i)).not.toBeInTheDocument()
    })
  })

  test('shows backend delete error message when delete request fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f-delete-error-1',
            title: 'Delete Error Form',
            businessId: 'b1',
            fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)
    mockedAxios.delete.mockRejectedValueOnce({
      response: { data: { error: 'Failed on server' } },
    })

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Delete Error Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: /^Delete$/i })[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Delete$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed on server/i)).toBeInTheDocument()
    })
  })

  test('delete modal closes when backdrop is clicked while not deleting', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForms: [
          {
            _id: 'f-close-1',
            title: 'Backdrop Close Form',
            businessId: 'b1',
            fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
          },
        ],
      },
    } as FormsListApiResponse)

    renderFormsPage()

    await waitFor(() => {
      expect(screen.getByText(/Backdrop Close Form/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getAllByRole('button', { name: /^Delete$/i })[0])
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('dialog'))
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

test('Cancel button in delete modal closes modal and clears error', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      feedbackForms: [
        {
          _id: 'f-cancel-1',
          title: 'Cancel Form',
          businessId: 'b1',
          fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
        },
      ],
    },
  } as FormsListApiResponse)

  renderFormsPage()

  await waitFor(() => {
    expect(screen.getByText(/Cancel Form/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getAllByRole('button', { name: /^Delete$/i })[0])
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Cancel$/i }))
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
test('delete modal onClose is blocked while deletion is in progress', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      feedbackForms: [
        {
          _id: 'f-blocking-1',
          title: 'Blocking Form',
          businessId: 'b1',
          fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
        },
      ],
    },
  } as FormsListApiResponse)
  mockedAxios.delete.mockImplementationOnce(
    () => new Promise((resolve) => setTimeout(resolve, 5000))
  )

  renderFormsPage()
  await waitFor(() => {
    expect(screen.getByText(/Blocking Form/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getAllByRole('button', { name: /^Delete$/i })[0])
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Delete$/i }))
  const dialog = screen.getByRole('dialog')
  fireEvent.click(dialog)
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
test('delete modal onClose is blocked while deletion is in progress', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      feedbackForms: [
        {
          _id: 'f-blocking-1',
          title: 'Blocking Form',
          businessId: 'b1',
          fields: [{ name: 'q', label: 'Question', type: 'short_text', required: false }],
        },
      ],
    },
  } as FormsListApiResponse)
  mockedAxios.delete.mockImplementationOnce(
    () => new Promise(() => {}) 
  )

  renderFormsPage()

  await waitFor(() => {
    expect(screen.getByText(/Blocking Form/i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getAllByRole('button', { name: /^Delete$/i })[0])

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Delete$/i }))
  await waitFor(() => {
    expect(screen.getByText(/Deleting\.\.\./i)).toBeInTheDocument()
  })
  fireEvent.click(screen.getByRole('dialog'))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})
})