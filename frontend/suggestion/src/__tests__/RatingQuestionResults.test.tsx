import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RatingQuestionResults } from '../components/results'

describe('RatingQuestionResults', () => {
  it('renders label and average stars when options have counts', () => {
    render(
      <RatingQuestionResults
        fieldName="stars"
        data={{
          label: 'Rate us',
          type: 'rating',
          options: [
            { option: '★★★ 3 Stars', count: 1, percentage: 50 },
            { option: '★★★★★ 5 Stars', count: 1, percentage: 50 },
          ],
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: /Rate us/i })).toBeInTheDocument()
    expect(screen.getByText(/out of 5/i)).toBeInTheDocument()
    expect(screen.getByText('Average')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    const container = screen.getByTestId('results-table-stars')
    expect(container).toHaveTextContent('50%')
  })

  it('renders the distribution container', () => {
    render(
      <RatingQuestionResults
        fieldName="r"
        data={{
          label: 'Stars',
          type: 'rating',
          options: [{ option: '★ 1 Star', count: 0, percentage: 0 }],
        }}
      />,
    )
    expect(screen.getByTestId('results-table-r')).toBeInTheDocument()
  })

  it('does not show average when total count is zero', () => {
    render(
      <RatingQuestionResults
        fieldName="r"
        data={{
          label: 'Stars',
          type: 'rating',
          options: [
            { option: '★ 1 Star', count: 0, percentage: 0 },
            { option: '★★★★★ 5 Stars', count: 0, percentage: 0 },
          ],
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: /Stars/i })).toBeInTheDocument()
    expect(screen.queryByText(/out of 5/i)).not.toBeInTheDocument()
  })
})
