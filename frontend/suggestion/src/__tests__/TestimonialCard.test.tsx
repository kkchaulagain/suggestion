import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import TestimonialCard from '../components/landing/TestimonialCard'

describe('TestimonialCard', () => {
  test('renders quote and name', () => {
    render(<TestimonialCard quote="Great product" name="Jane Doe" />)
    expect(screen.getByText(/Great product/)).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  test('renders role when provided', () => {
    render(
      <TestimonialCard
        quote="Amazing"
        name="John"
        role="CTO, Acme Inc"
      />,
    )
    expect(screen.getByText('CTO, Acme Inc')).toBeInTheDocument()
  })

  test('shows avatar image when avatarUrl provided', () => {
    render(
      <TestimonialCard
        quote="Hi"
        name="Alice"
        avatarUrl="https://example.com/avatar.png"
      />,
    )
    const img = screen.getByRole('img', { name: 'Alice' })
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.png')
  })

  test('shows initial when no avatarUrl', () => {
    render(<TestimonialCard quote="Hi" name="Bob" />)
    expect(screen.getByText('B')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
