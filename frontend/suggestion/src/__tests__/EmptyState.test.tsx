import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import EmptyState from '../components/layout/EmptyState'

describe('EmptyState', () => {
  test('renders message', () => {
    render(<EmptyState type="empty" message="No items." />)
    expect(screen.getByText('No items.')).toBeInTheDocument()
  })

  test('applies loading type class', () => {
    const { container } = render(<EmptyState type="loading" message="Loading..." />)
    expect(container.querySelector('p')).toHaveClass('text-slate-500')
  })
})
