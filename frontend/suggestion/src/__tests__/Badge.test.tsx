import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Badge from '../components/ui/Badge'

describe('Badge', () => {
  test('renders children', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  test('default variant is success', () => {
    const { container } = render(<Badge>OK</Badge>)
    expect(container.firstChild).toHaveClass('border-emerald-200', 'bg-emerald-50')
  })

  test('variant warning applies warning classes', () => {
    const { container } = render(<Badge variant="warning">Pending</Badge>)
    expect(container.firstChild).toHaveClass('border-amber-200', 'bg-amber-50')
  })

  test('variant info applies info classes', () => {
    const { container } = render(<Badge variant="info">Info</Badge>)
    expect(container.firstChild).toHaveClass('border-sky-200', 'bg-sky-50')
  })

  test('variant neutral applies neutral classes', () => {
    const { container } = render(<Badge variant="neutral">Default</Badge>)
    expect(container.firstChild).toHaveClass('border-stone-200', 'bg-stone-100')
  })

  test('variant danger applies danger classes', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>)
    expect(container.firstChild).toHaveClass('border-rose-200', 'bg-rose-50')
  })

  test('applies custom className', () => {
    const { container } = render(<Badge className="uppercase">Badge</Badge>)
    expect(container.firstChild).toHaveClass('uppercase')
  })
})
