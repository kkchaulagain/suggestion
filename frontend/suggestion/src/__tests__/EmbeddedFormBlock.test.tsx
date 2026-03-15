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
})
