import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import axios from 'axios'

import { FormResultsView } from '../components/results'
import { feedbackFormsApi } from '../utils/apipath'

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

  it('shows summary and choice question table with counts and percentages', async () => {
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
      expect(screen.getByText('Yes')).toBeInTheDocument()
      expect(screen.getByText('No')).toBeInTheDocument()
    })

    const table = screen.getByTestId('results-table-choice')
    expect(table).toBeInTheDocument()
    expect(table).toHaveTextContent('Yes')
    expect(table).toHaveTextContent('No')
    expect(table).toHaveTextContent('2')
    expect(table).toHaveTextContent('1')
    expect(table).toHaveTextContent('67%')
    expect(table).toHaveTextContent('33%')
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
            type: 'short_text',
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
    expect(screen.getByText(/2 responses/)).toBeInTheDocument()
    expect(screen.getByText('First answer')).toBeInTheDocument()
    expect(screen.getByText('Second answer')).toBeInTheDocument()
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

  it('shows scale_1_10 field with average and distribution table', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        formId: 'form-1',
        formTitle: 'Score Survey',
        totalResponses: 4,
        byField: {
          score: {
            label: 'How would you rate?',
            type: 'scale_1_10',
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

    expect(screen.getByText(/out of 10 average/i)).toBeInTheDocument()
    const table = screen.getByTestId('results-table-score')
    expect(table).toBeInTheDocument()
    expect(table).toHaveTextContent('Score')
    expect(table).toHaveTextContent('7')
    expect(table).toHaveTextContent('8')
    expect(table).toHaveTextContent('9')
    expect(table).toHaveTextContent('2')
    expect(table).toHaveTextContent('50%')
  })

  it('shows rating field with average and distribution table', async () => {
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

    expect(screen.getByText(/out of 5 average/i)).toBeInTheDocument()
    const table = screen.getByTestId('results-table-stars')
    expect(table).toBeInTheDocument()
    expect(table).toHaveTextContent('Rating')
    expect(table).toHaveTextContent('★★★★ 4 Stars')
    expect(table).toHaveTextContent('★★★★★ 5 Stars')
    expect(table).toHaveTextContent('1')
    expect(table).toHaveTextContent('50%')
  })
})
