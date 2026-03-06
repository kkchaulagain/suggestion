import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Card from '../components/ui/Card'

describe('Card', () => {
  test('renders children', () => {
    render(<Card>Card content</Card>)
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  test('applies base card styles', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('rounded-2xl', 'border', 'border-slate-200', 'bg-white', 'shadow-sm')
  })

  test('applies default padding (md)', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('p-6')
  })

  test('applies padding size', () => {
    const { container, rerender } = render(<Card padding="none">Content</Card>)
    expect((container.firstChild as HTMLElement).className).not.toMatch(/\bp-\d+\b/)

    rerender(<Card padding="sm">Content</Card>)
    expect((container.firstChild as HTMLElement)).toHaveClass('p-4')

    rerender(<Card padding="lg">Content</Card>)
    expect((container.firstChild as HTMLElement)).toHaveClass('p-8')
  })

  test('allows custom className', () => {
    const { container } = render(<Card className="xl:col-span-3">Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('xl:col-span-3')
  })
})
