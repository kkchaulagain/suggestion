import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EmojiScaleResults, isEmojiScaleData, getEmojiScaleDisplay } from '../components/results'

describe('isEmojiScaleData', () => {
  it('returns true when all options are emoji chip values', () => {
    expect(
      isEmojiScaleData([
        { option: '2', count: 1, percentage: 50 },
        { option: '8', count: 1, percentage: 50 },
      ]),
    ).toBe(true)
  })

  it('returns false when options include non-emoji values', () => {
    expect(
      isEmojiScaleData([
        { option: '1', count: 1, percentage: 50 },
        { option: '3', count: 1, percentage: 50 },
      ]),
    ).toBe(false)
  })

  it('returns false for empty options', () => {
    expect(isEmojiScaleData([])).toBe(false)
  })
})

describe('getEmojiScaleDisplay', () => {
  it('returns emoji and label for numeric value 1-10 via bucket', () => {
    expect(getEmojiScaleDisplay('5')).toEqual({ emoji: '😐', label: 'Neutral' })
    expect(getEmojiScaleDisplay('3')).toEqual({ emoji: '😕', label: 'Bad' })
  })
})

describe('EmojiScaleResults', () => {
  const baseData = {
    label: 'How satisfied are you?',
    type: 'scale' as const,
    options: [
      { option: '2', count: 1, percentage: 10 },
      { option: '4', count: 2, percentage: 20 },
      { option: '6', count: 3, percentage: 30 },
      { option: '8', count: 2, percentage: 20 },
      { option: '10', count: 2, percentage: 20 },
    ],
  }

  it('renders the question label', () => {
    render(<EmojiScaleResults fieldName="satisfaction" data={baseData} />)
    expect(screen.getByRole('heading', { name: /How satisfied are you/i })).toBeInTheDocument()
  })

  it('shows the computed average sentiment and vote count', () => {
    render(<EmojiScaleResults fieldName="satisfaction" data={baseData} />)
    expect(screen.getByText('Average')).toBeInTheDocument()
    expect(screen.getAllByText(/10 vote/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders all five emoji rows', () => {
    render(<EmojiScaleResults fieldName="satisfaction" data={baseData} />)
    const container = screen.getByTestId('emoji-results-satisfaction')
    expect(container).toBeInTheDocument()
    for (const lbl of ['Very bad', 'Bad', 'Neutral', 'Good', 'Excellent']) {
      expect(screen.getAllByText(lbl).length).toBeGreaterThanOrEqual(1)
    }
  })

  it('shows count and percentage for each option', () => {
    render(<EmojiScaleResults fieldName="satisfaction" data={baseData} />)
    expect(screen.getByText('3 (30%)')).toBeInTheDocument()
    expect(screen.getByText('1 (10%)')).toBeInTheDocument()
  })

  it('does not show average when all counts are zero', () => {
    const emptyData = {
      ...baseData,
      options: [
        { option: '2', count: 0, percentage: 0 },
        { option: '6', count: 0, percentage: 0 },
        { option: '10', count: 0, percentage: 0 },
      ],
    }
    render(<EmojiScaleResults fieldName="satisfaction" data={emptyData} />)
    expect(screen.queryByText('Average')).toBeNull()
  })

  it('fills missing emoji values with zero counts', () => {
    const partial = {
      ...baseData,
      options: [{ option: '6', count: 5, percentage: 100 }],
    }
    render(<EmojiScaleResults fieldName="mood" data={partial} />)
    expect(screen.getByText('5 (100%)')).toBeInTheDocument()
    expect(screen.getAllByText('0 (0%)').length).toBe(4)
  })

  it('shows Excellent average when scale values are high (avg > 9)', () => {
    const highData = {
      ...baseData,
      options: [
        { option: '9', count: 2, percentage: 50 },
        { option: '10', count: 2, percentage: 50 },
      ],
    }
    render(<EmojiScaleResults fieldName="satisfaction" data={highData} />)
    expect(screen.getByText('Average')).toBeInTheDocument()
    expect(screen.getAllByText('Excellent').length).toBeGreaterThanOrEqual(1)
  })
})
