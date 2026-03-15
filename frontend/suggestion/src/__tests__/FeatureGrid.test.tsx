import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import FeatureGrid from '../components/landing/FeatureGrid'

const defaultItems = [
  { icon: <span data-testid="icon-1">Icon</span>, title: 'Feature 1', description: 'Desc 1' },
  { icon: <span data-testid="icon-2">Icon2</span>, title: 'Feature 2', description: 'Desc 2' },
]

describe('FeatureGrid', () => {
  test('returns null when items is empty', () => {
    const { container } = render(<FeatureGrid items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  test('renders items with default columns (3)', () => {
    render(<FeatureGrid items={defaultItems} />)
    expect(screen.getByText('Feature 1')).toBeInTheDocument()
    expect(screen.getByText('Feature 2')).toBeInTheDocument()
    expect(screen.getByText('Desc 1')).toBeInTheDocument()
    const grid = screen.getByText('Feature 1').closest('.grid')
    expect(grid).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-3')
  })

  test('renders with columns 2', () => {
    const { container } = render(<FeatureGrid items={defaultItems} columns={2} />)
    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('sm:grid-cols-2')
  })

  test('renders with columns 4', () => {
    const { container } = render(<FeatureGrid items={defaultItems} columns={4} />)
    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('sm:grid-cols-2', 'lg:grid-cols-4')
  })

  test('renders heading and subheading when provided', () => {
    render(
      <FeatureGrid
        items={defaultItems}
        heading="Features"
        subheading="What we offer"
      />,
    )
    expect(screen.getByRole('heading', { name: /features/i })).toBeInTheDocument()
    expect(screen.getByText(/what we offer/i)).toBeInTheDocument()
  })

  test('renders without SectionHeading (h2) when no heading or subheading', () => {
    render(<FeatureGrid items={defaultItems} />)
    expect(screen.getByText('Feature 1')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })
})
