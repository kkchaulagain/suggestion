import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'

import { FormResultsView } from '../components/results'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('FormResultsView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedAxios.get.mockReset()
  })

  it('shows loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}))

    render(<FormResultsView formId="form-1" />)

    expect(screen.getByTestId('results-loading')).toBeInTheDocument()
    expect(screen.getByText(/Loading results/i)).toBeInTheDocument()
  })

  it('shows error when results fetch fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'))

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('results-error')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load results/i)).toBeInTheDocument()
    })
  })

  it('shows API error message when results are not publicly available (403)', async () => {
    const axiosError = {
      response: { status: 403, data: { error: 'Results are not publicly available for this form' } },
    }
    const isAxiosErrorSpy = jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)
    mockedAxios.get.mockRejectedValueOnce(axiosError)

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('results-error')).toBeInTheDocument()
      expect(screen.getByText(/Results are not publicly available for this form/i)).toBeInTheDocument()
    })
    isAxiosErrorSpy.mockRestore()
  })

  it('shows empty state when no submissions', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'My Poll',
        totalResponses: 0,
        byField: {},
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('results-summary')).toBeInTheDocument()
    })
    expect(screen.getByText(/My Poll/i)).toBeInTheDocument()
    expect(screen.getByText(/No responses yet/i)).toBeInTheDocument()
  })

  it('shows summary and choice question results with vote bars', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Quick Poll',
        totalResponses: 3,
        byField: {
          choice: {
            label: 'Choice',
            type: 'radio',
            options: [
              { option: 'Yes', count: 2, percentage: 67 },
              { option: 'No', count: 1, percentage: 33 },
            ],
          },
        },
        responsesOverTime: [{ date: '2024-06-01', count: 3 }],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Quick Poll/i)).toBeInTheDocument()
    })

    const container = screen.getByTestId('results-table-choice')
    expect(container).toBeInTheDocument()
    expect(container).toHaveTextContent('Yes')
    expect(container).toHaveTextContent('No')
    expect(container).toHaveTextContent('67%')
    expect(container).toHaveTextContent('33%')
  })

  it('shows text question response count and sample answers', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Survey',
        totalResponses: 2,
        byField: {
          comment: {
            label: 'Comment',
            type: 'text',
            responseCount: 2,
            sampleAnswers: ['First answer', 'Second answer'],
          },
        },
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByText('First answer')).toBeInTheDocument()
      expect(screen.getByText('Second answer')).toBeInTheDocument()
    })

    expect(screen.getByRole('heading', { name: /Survey/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Comment/i })).toBeInTheDocument()
    expect(screen.getByText(/2 response/)).toBeInTheDocument()
  })

  it('fetches results from correct endpoint', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-xyz',
        formTitle: 'Test',
        totalResponses: 0,
        byField: {},
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-xyz" />)

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/form-xyz/results'),
        expect.anything(),
      )
    })
  })

  it('shows scale field with average and distribution', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Score Survey',
        totalResponses: 4,
        byField: {
          score: {
            label: 'How would you rate?',
            type: 'scale',
            options: [
              { option: '7', count: 2, percentage: 50 },
              { option: '8', count: 1, percentage: 25 },
              { option: '9', count: 1, percentage: 25 },
            ],
          },
        },
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Score Survey/i)).toBeInTheDocument()
      expect(screen.getByText(/How would you rate?/i)).toBeInTheDocument()
    })

    const emojiResults = screen.getByTestId('emoji-results-score')
    expect(emojiResults).toBeInTheDocument()
    expect(emojiResults).toHaveTextContent('Good')
    expect(emojiResults).toHaveTextContent('Excellent')
  })

  it('shows rating field with stars and distribution', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Feedback',
        totalResponses: 2,
        byField: {
          stars: {
            label: 'Rate your experience',
            type: 'rating',
            options: [
              { option: '★★★★ 4 Stars', count: 1, percentage: 50 },
              { option: '★★★★★ 5 Stars', count: 1, percentage: 50 },
            ],
          },
        },
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByText(/Feedback/i)).toBeInTheDocument()
      expect(screen.getByText(/Rate your experience/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/out of 5/i)).toBeInTheDocument()
    const container = screen.getByTestId('results-table-stars')
    expect(container).toBeInTheDocument()
    expect(container).toHaveTextContent('50%')
  })

  it('shows scale average and top choice badges in summary', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Sentiment Poll',
        totalResponses: 5,
        byField: {
          mood: {
            label: 'How do you feel?',
            type: 'scale',
            options: [
              { option: '8', count: 3, percentage: 60 },
              { option: '10', count: 2, percentage: 40 },
            ],
          },
          pick: {
            label: 'Pick one',
            type: 'radio',
            options: [
              { option: 'Alpha', count: 4, percentage: 80 },
              { option: 'Beta', count: 1, percentage: 20 },
            ],
          },
        },
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('scale-summary-badge')).toBeInTheDocument()
      expect(screen.getByTestId('top-choice-badge')).toBeInTheDocument()
    })
    expect(screen.getByTestId('scale-summary-badge')).toHaveTextContent('Scale average')
    expect(screen.getByTestId('scale-summary-badge')).toHaveTextContent('Positive')
    expect(screen.getByTestId('top-choice-badge')).toHaveTextContent('Alpha')
    expect(screen.getByTestId('top-choice-badge')).toHaveTextContent('80%')
  })

  it('shows share button', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Poll',
        totalResponses: 1,
        byField: {
          q: { label: 'Q', type: 'radio', options: [{ option: 'A', count: 1, percentage: 100 }] },
        },
        responsesOverTime: [],
      },
    })

    render(<FormResultsView formId="form-1" />)

    await waitFor(() => {
      expect(screen.getByTestId('form-results-view')).toBeInTheDocument()
    })
    expect(screen.getByTestId('copy-link-btn')).toBeInTheDocument()
    expect(screen.getByTestId('copy-link-btn')).toHaveTextContent('Share')
  })
})
