import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ErrorMessage from '../components/ui/ErrorMessage'

describe('ErrorMessage', () => {
  test('renders message', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  test('has role="alert" for accessibility', () => {
    render(<ErrorMessage message="Error" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Error')
  })

  test('applies default size (md) and rose color', () => {
    render(<ErrorMessage message="Error" />)
    const el = screen.getByRole('alert')
    expect(el).toHaveClass('text-sm', 'text-rose-600')
  })

  test('applies size sm when specified', () => {
    render(<ErrorMessage message="Field error" size="sm" />)
    expect(screen.getByRole('alert')).toHaveClass('text-xs')
  })

  test('allows custom className', () => {
    render(<ErrorMessage message="Error" className="mt-2 text-center" />)
    const el = screen.getByRole('alert')
    expect(el).toHaveClass('mt-2', 'text-center')
  })
})
