import { render, screen, waitFor } from '@testing-library/react'
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
})
