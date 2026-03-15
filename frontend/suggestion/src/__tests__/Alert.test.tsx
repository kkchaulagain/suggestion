import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Alert from '../components/ui/Alert'

describe('Alert', () => {
  test('renders children', () => {
    render(<Alert>Something went wrong.</Alert>)
    expect(screen.getByText('Something went wrong.')).toBeInTheDocument()
  })

  test('has role alert', () => {
    render(<Alert>Message</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  test('renders title when provided', () => {
    render(
      <Alert title="Error">
        <p>Details here.</p>
      </Alert>,
    )
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Details here.')).toBeInTheDocument()
  })

  test('default variant is info', () => {
    const { container } = render(<Alert>Info message</Alert>)
    expect(container.firstChild).toHaveClass('border-sky-200', 'bg-sky-50')
  })

  test('variant success applies success classes', () => {
    const { container } = render(<Alert variant="success">Done</Alert>)
    expect(container.firstChild).toHaveClass('border-emerald-200', 'bg-emerald-50')
  })

  test('variant warning applies warning classes', () => {
    const { container } = render(<Alert variant="warning">Careful</Alert>)
    expect(container.firstChild).toHaveClass('border-amber-200', 'bg-amber-50')
  })

  test('variant error applies error classes', () => {
    const { container } = render(<Alert variant="error">Failed</Alert>)
    expect(container.firstChild).toHaveClass('border-rose-200', 'bg-rose-50')
  })

  test('applies custom className', () => {
    const { container } = render(<Alert className="my-alert">Text</Alert>)
    expect(container.firstChild).toHaveClass('my-alert')
  })
})
