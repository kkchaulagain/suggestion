import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import axios from 'axios'
import EmbeddedFormBlock from '../pages/feedback-form-render/EmbeddedFormBlock'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('EmbeddedFormBlock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('shows loading then error when formId is missing', async () => {
    render(<EmbeddedFormBlock formId="" />)

    await waitFor(() => {
      expect(screen.getByText(/Missing form ID|Form not found/)).toBeInTheDocument()
    })
  })

  test('shows loading then form when config loads', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Feedback Form',
          kind: 'form',
          fields: [
            { name: 'q1', label: 'Question 1', type: 'text', required: false },
          ],
          thankYouHeadline: 'Thanks!',
          thankYouMessage: 'We got your response.',
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    expect(screen.getByText(/Loading form/)).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Feedback Form')).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/Question 1/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
  })

  test('shows error when fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Form not found/)).toBeInTheDocument()
    })
  })

  test('submits and shows thank you message', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Survey',
          kind: 'form',
          fields: [
            { name: 'q1', label: 'Question 1', type: 'text', required: false },
          ],
          thankYouHeadline: 'Thank you!',
          thankYouMessage: 'Your response was recorded.',
        },
      },
    })
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Thank you!')).toBeInTheDocument()
      expect(screen.getByText('Your response was recorded.')).toBeInTheDocument()
    })
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/submit'),
      expect.any(Object),
    )
  })

  test('shows required validation error when submitting empty required field', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Form',
          kind: 'form',
          fields: [
            { name: 'q1', label: 'Required Q', type: 'text', required: true },
          ],
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Required Q is required/)).toBeInTheDocument()
    })
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  test('shows required validation error for empty checkbox field', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Form',
          kind: 'form',
          fields: [
            { name: 'agree', label: 'Agree to terms', type: 'checkbox', required: true, options: ['Yes'] },
          ],
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Agree to terms is required/)).toBeInTheDocument()
    })
    expect(mockedAxios.post).not.toHaveBeenCalled()
  })

  test('shows poll submit label when kind is poll', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Poll',
          kind: 'poll',
          fields: [
            { name: 'choice', label: 'Your choice', type: 'radio', required: true, options: ['A', 'B'] },
          ],
          thankYouHeadline: 'Thanks',
          thankYouMessage: 'Vote recorded.',
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cast Vote/i })).toBeInTheDocument()
    })
  })

  test('shows survey submit label when kind is survey', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Survey',
          kind: 'survey',
          fields: [
            { name: 'q1', label: 'Q1', type: 'text', required: false },
          ],
          thankYouHeadline: 'Thanks',
          thankYouMessage: 'Done.',
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit Vote/i })).toBeInTheDocument()
    })
  })

  test('renders form title when present', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'My Form Title',
          kind: 'form',
          fields: [{ name: 'q1', label: 'Q1', type: 'text', required: false }],
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Form Title', level: 3 })).toBeInTheDocument()
    })
  })

  test('submit failure shows API error message', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Form',
          kind: 'form',
          fields: [{ name: 'q1', label: 'Q1', type: 'text', required: false }],
          thankYouHeadline: 'Thanks',
          thankYouMessage: 'Done.',
        },
      },
    })
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: 'Submission rate limit exceeded' } },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Submission rate limit exceeded')).toBeInTheDocument()
    })
  })

  test('submit failure without API error shows generic message', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Form',
          kind: 'form',
          fields: [{ name: 'q1', label: 'Q1', type: 'text', required: false }],
        },
      },
    })
    mockedAxios.post.mockRejectedValueOnce(new Error('Network error'))

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed to submit/)).toBeInTheDocument()
    })
  })

  test('submits with image_upload field uploads file then submits URL', async () => {
    const uploadUrl = 'https://uploaded.example/img.png'
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Upload Form',
          kind: 'form',
          fields: [
            { name: 'photo', label: 'Photo', type: 'image_upload', required: true },
          ],
          thankYouHeadline: 'Thanks',
          thankYouMessage: 'Done.',
        },
      },
    })
    mockedAxios.post
      .mockResolvedValueOnce({ data: { url: uploadUrl } })
      .mockResolvedValueOnce({ data: {} })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })

    const fileInputEl = document.querySelector('input[type="file"]')
    expect(fileInputEl).toBeInTheDocument()
    const file = new File(['content'], 'photo.png', { type: 'image/png' })
    fireEvent.change(fileInputEl!, { target: { files: [file] } })

    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Thanks')).toBeInTheDocument()
    })
    expect(mockedAxios.post).toHaveBeenCalledTimes(2)
    const uploadCall = mockedAxios.post.mock.calls[0]
    expect(uploadCall[0]).toMatch(/upload/)
    expect(uploadCall[1]).toBeInstanceOf(FormData)
    const submitCall = mockedAxios.post.mock.calls[1]
    expect(submitCall[0]).toMatch(/submit/)
    expect(submitCall[1]).toEqual({ photo: uploadUrl })
  })

  test('initial values for scale types default to 6', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Scale Form',
          kind: 'form',
          fields: [
            { name: 's1', label: 'Scale', type: 'scale', required: false },
            { name: 's2', label: 'Scale 1-10', type: 'scale_1_10', required: false },
            { name: 's3', label: 'Emoji scale', type: 'scale_emoji', required: false },
          ],
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })
    const rangeInputs = screen.getAllByRole('slider')
    expect(rangeInputs.length).toBeGreaterThanOrEqual(2)
    expect(rangeInputs[0]).toHaveValue('6')
    expect(rangeInputs[1]).toHaveValue('6')
  })

  test('initial values for text field are empty string', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Text Form',
          kind: 'form',
          fields: [{ name: 't1', label: 'Comment', type: 'text', required: false }],
        },
      },
    })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Comment/i)).toBeInTheDocument()
    })
    const input = screen.getByLabelText(/Comment/i)
    expect(input).toHaveValue('')
  })

  test('loadForm catch shows axios response error and clears config', async () => {
    const axiosError = new Error('Request failed') as Error & { isAxiosError?: boolean; response?: { data?: { error?: string } } }
    axiosError.isAxiosError = true
    axiosError.response = { data: { error: 'Custom server error' } }
    mockedAxios.get.mockRejectedValueOnce(axiosError)

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByText('Custom server error')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Submit/i })).not.toBeInTheDocument()
  })

  test('submits checkbox field with selected values', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Checkbox Form',
          kind: 'form',
          fields: [
            { name: 'opts', label: 'Options', type: 'checkbox', required: false, options: ['A', 'B', 'C'] },
          ],
          thankYouHeadline: 'Thanks',
          thankYouMessage: 'Done.',
        },
      },
    })
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByLabelText(/A/i))
    await userEvent.click(screen.getByLabelText(/B/i))
    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Thanks')).toBeInTheDocument()
    })
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/submit'),
      expect.objectContaining({ opts: ['A', 'B'] }),
    )
  })

  test('submits image_upload field without file as empty string', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        feedbackForm: {
          title: 'Optional Image',
          kind: 'form',
          fields: [
            { name: 'pic', label: 'Picture', type: 'image_upload', required: false },
          ],
          thankYouHeadline: 'Thanks',
          thankYouMessage: 'Done.',
        },
      },
    })
    mockedAxios.post.mockResolvedValueOnce({ data: {} })

    render(<EmbeddedFormBlock formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Submit/i })).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', { name: /Submit/i }))

    await waitFor(() => {
      expect(screen.getByText('Thanks')).toBeInTheDocument()
    })
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/submit'),
      expect.objectContaining({ pic: '' }),
    )
  })
})
