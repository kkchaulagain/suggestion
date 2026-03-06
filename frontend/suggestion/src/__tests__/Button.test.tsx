import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Button from '../components/ui/Button'

describe('Button', () => {
  test('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  test('calls onClick when clicked', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Submit</Button>)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('does not call onClick when disabled', () => {
    const onClick = jest.fn()
    render(
      <Button onClick={onClick} disabled>
        Submit
      </Button>,
    )
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(onClick).not.toHaveBeenCalled()
  })

  test('renders as submit type by default when type is submit', () => {
    render(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button', { name: /save/i })).toHaveAttribute('type', 'submit')
  })

  test('renders with variant classes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    const primaryBtn = screen.getByRole('button', { name: /primary/i })
    expect(primaryBtn).toHaveClass('bg-emerald-600')

    rerender(<Button variant="secondary">Secondary</Button>)
    const secondaryBtn = screen.getByRole('button', { name: /secondary/i })
    expect(secondaryBtn).toHaveClass('border')

    rerender(<Button variant="danger">Danger</Button>)
    const dangerBtn = screen.getByRole('button', { name: /danger/i })
    expect(dangerBtn).toHaveClass('bg-rose-600')
  })

  test('applies size classes', () => {
    render(<Button size="sm">Small</Button>)
    expect(screen.getByRole('button', { name: /small/i })).toHaveClass('text-xs')
  })
})
