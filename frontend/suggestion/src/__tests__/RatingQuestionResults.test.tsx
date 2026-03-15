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
    expect(screen.getByText(/out of 5 average/i)).toBeInTheDocument()
    // (3 + 5) / 2 = 4
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByTestId('results-table-stars')).toHaveTextContent('Rating')
    expect(screen.getByTestId('results-table-stars')).toHaveTextContent('★★★ 3 Stars')
    expect(screen.getByTestId('results-table-stars')).toHaveTextContent('★★★★★ 5 Stars')
  })

  it('renders table with Rating column header', () => {
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
    expect(screen.getByText('Rating')).toBeInTheDocument()
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
    expect(screen.queryByText(/out of 5 average/i)).not.toBeInTheDocument()
  })
})
