import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import ResultsSummary from '../components/results/ResultsSummary'
import type { FormResultsData } from '../types/results'

describe('ResultsSummary', () => {
  const baseData: FormResultsData = {
    formId: 'f1',
    formTitle: 'Test Form',
    totalResponses: 10,
    byField: {},
  }

  it('renders form title and response count', () => {
    render(<ResultsSummary data={baseData} />)
    expect(screen.getByTestId('results-title')).toHaveTextContent('Test Form')
    expect(screen.getByText('people responded')).toBeInTheDocument()
    expect(screen.getByText('10', { selector: 'span' })).toBeInTheDocument()
  })

  it('renders "person responded" when totalResponses is 1', () => {
    render(<ResultsSummary data={{ ...baseData, totalResponses: 1 }} />)
    expect(screen.getByText('person responded')).toBeInTheDocument()
  })

  it('shows scale summary badge when scale data exists', () => {
    const data: FormResultsData = {
      ...baseData,
      byField: {
        s1: {
          label: 'Score',
          type: 'scale_1_10',
          options: [
            { option: '8', count: 3, percentage: 60 },
            { option: '10', count: 2, percentage: 40 },
          ],
        },
      },
    }
    render(<ResultsSummary data={data} />)
    expect(screen.getByTestId('scale-summary-badge')).toBeInTheDocument()
    expect(screen.getByText('Scale average')).toBeInTheDocument()
  })

  it('shows top choice badge when choice data exists', () => {
    const data: FormResultsData = {
      ...baseData,
      byField: {
        c1: {
          label: 'Choice',
          type: 'radio',
          options: [
            { option: 'A', count: 5, percentage: 50 },
            { option: 'B', count: 5, percentage: 50 },
          ],
        },
      },
    }
    render(<ResultsSummary data={data} />)
    expect(screen.getByTestId('top-choice-badge')).toBeInTheDocument()
    expect(screen.getByText('Top choice')).toBeInTheDocument()
  })

  it('shows date filter and preset buttons when showDateFilter is true', () => {
    const onFrom = jest.fn()
    const onTo = jest.fn()
    render(
      <ResultsSummary
        data={baseData}
        showDateFilter
        onDateFromChange={onFrom}
        onDateToChange={onTo}
        dateFrom=""
        dateTo=""
      />,
    )
    expect(screen.getByTestId('date-filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('date-filter-today')).toBeInTheDocument()
    expect(screen.getByTestId('date-filter-last_1_week')).toBeInTheDocument()
    expect(screen.getByTestId('date-filter-last_4_weeks')).toBeInTheDocument()
    expect(screen.getByTestId('date-filter-custom')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('date-filter-today'))
    expect(onFrom).toHaveBeenCalled()
    expect(onTo).toHaveBeenCalled()

    fireEvent.click(screen.getByTestId('date-filter-last_1_week'))
    expect(onFrom).toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('date-filter-last_4_weeks'))
    expect(onFrom).toHaveBeenCalled()
  })

  it('shows custom date inputs when dates are custom and updates on change', () => {
    const onFrom = jest.fn()
    const onTo = jest.fn()
    render(
      <ResultsSummary
        data={baseData}
        showDateFilter
        onDateFromChange={onFrom}
        onDateToChange={onTo}
        dateFrom="2025-01-01"
        dateTo="2025-01-15"
      />,
    )
    const fromInput = screen.getByTestId('date-filter-from')
    const toInput = screen.getByTestId('date-filter-to')
    expect(fromInput).toBeInTheDocument()
    expect(toInput).toBeInTheDocument()
    fireEvent.change(fromInput, { target: { value: '2025-02-01' } })
    fireEvent.change(toInput, { target: { value: '2025-02-28' } })
    expect(onFrom).toHaveBeenCalledWith('2025-02-01')
    expect(onTo).toHaveBeenCalledWith('2025-02-28')
  })

  it('copies link when Share is clicked', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    render(<ResultsSummary data={baseData} />)
    fireEvent.click(screen.getByTestId('copy-link-btn'))
    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(await screen.findByText('Copied!')).toBeInTheDocument()
  })

  it('shows Activity section with sparkline when responsesOverTime has multiple days', () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const data: FormResultsData = {
      ...baseData,
      responsesOverTime: [
        { date: today, count: 5 },
        { date: yesterday, count: 3 },
      ],
    }
    render(<ResultsSummary data={data} />)
    expect(screen.getByText('Activity')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
    expect(screen.getByText('this week')).toBeInTheDocument()
  })
})
