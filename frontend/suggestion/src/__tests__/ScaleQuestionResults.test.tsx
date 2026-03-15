import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ScaleQuestionResults } from '../components/results'

describe('ScaleQuestionResults', () => {
  it('renders label and average when options have counts', () => {
    render(
      <ScaleQuestionResults
        fieldName="score"
        data={{
          label: 'Score (1-10)',
          type: 'scale_1_10',
          options: [
            { option: '5', count: 2, percentage: 40 },
            { option: '7', count: 3, percentage: 60 },
          ],
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: /Score \(1-10\)/i })).toBeInTheDocument()
    expect(screen.getByText(/out of 10 average/i)).toBeInTheDocument()
    // (5*2 + 7*3) / 5 = 6.2
    expect(screen.getByText('6.2')).toBeInTheDocument()
    expect(screen.getByTestId('results-table-score')).toHaveTextContent('Score')
    expect(screen.getByTestId('results-table-score')).toHaveTextContent('5')
    expect(screen.getByTestId('results-table-score')).toHaveTextContent('7')
    expect(screen.getByTestId('results-table-score')).toHaveTextContent('40%')
    expect(screen.getByTestId('results-table-score')).toHaveTextContent('60%')
  })

  it('renders table with Score column header', () => {
    render(
      <ScaleQuestionResults
        fieldName="s"
        data={{
          label: 'Scale',
          type: 'scale_1_10',
          options: [{ option: '1', count: 0, percentage: 0 }],
        }}
      />,
    )
    expect(screen.getByTestId('results-table-s')).toBeInTheDocument()
    expect(screen.getByText('Score')).toBeInTheDocument()
  })

  it('does not show average when total count is zero', () => {
    render(
      <ScaleQuestionResults
        fieldName="s"
        data={{
          label: 'Scale',
          type: 'scale_1_10',
          options: [
            { option: '1', count: 0, percentage: 0 },
            { option: '2', count: 0, percentage: 0 },
          ],
        }}
      />,
    )
    expect(screen.getByRole('heading', { name: /Scale/i })).toBeInTheDocument()
    expect(screen.queryByText(/out of 10 average/i)).not.toBeInTheDocument()
  })
})
