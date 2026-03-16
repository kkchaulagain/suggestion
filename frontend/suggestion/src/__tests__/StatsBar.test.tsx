import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import StatsBar from '../components/landing/StatsBar'

describe('StatsBar', () => {
  test('returns null when stats is empty', () => {
    const { container } = render(<StatsBar stats={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders stat values and labels', () => {
    const stats = [
      { value: '10k+', label: 'Users' },
      { value: '99%', label: 'Satisfaction' },
    ]
    render(<StatsBar stats={stats} />)
    expect(screen.getByText('10k+')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('99%')).toBeInTheDocument()
    expect(screen.getByText('Satisfaction')).toBeInTheDocument()
  })

  test('showDividers true adds border between items', () => {
    const stats = [
      { value: '1', label: 'A' },
      { value: '2', label: 'B' },
    ]
    const { container } = render(<StatsBar stats={stats} showDividers={true} />)
    const wrappers = container.querySelectorAll('.flex.flex-col.items-center')
    expect(wrappers.length).toBe(2)
    expect(wrappers[1]).toHaveClass('border-l')
  })

  test('showDividers false does not add border', () => {
    const stats = [
      { value: '1', label: 'A' },
      { value: '2', label: 'B' },
    ]
    const { container } = render(<StatsBar stats={stats} showDividers={false} />)
    const withBorder = container.querySelectorAll('.border-l')
    expect(withBorder.length).toBe(0)
  })
})
