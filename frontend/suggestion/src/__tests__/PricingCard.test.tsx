import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import PricingCard from '../components/landing/PricingCard'

function renderCard(props: Parameters<typeof PricingCard>[0]) {
  return render(
    <MemoryRouter>
      <PricingCard {...props} />
    </MemoryRouter>,
  )
}

describe('PricingCard', () => {
  const defaultProps = {
    name: 'Pro',
    price: '$29',
    features: ['Feature A', 'Feature B'],
    cta: { label: 'Get started', href: '/signup' },
  }

  test('renders name, price, features and CTA', () => {
    renderCard(defaultProps)
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument()
    expect(screen.getByText('$29')).toBeInTheDocument()
    expect(screen.getByText('Feature A')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '/signup')
  })

  test('renders period when provided', () => {
    renderCard({ ...defaultProps, period: 'per month' })
    expect(screen.getByText('per month')).toBeInTheDocument()
  })

  test('does not render period when omitted', () => {
    renderCard(defaultProps)
    expect(screen.queryByText('per month')).not.toBeInTheDocument()
  })

  test('shows Popular badge when highlighted', () => {
    renderCard({ ...defaultProps, highlighted: true })
    expect(screen.getByText('Popular')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get started' }).closest('div')?.parentElement).toHaveClass(
      'border-emerald-500',
    )
  })

  test('uses primary button when highlighted', () => {
    renderCard({ ...defaultProps, highlighted: true })
    const btn = screen.getByRole('link', { name: 'Get started' }).querySelector('button')
    expect(btn).toHaveClass(/bg-emerald|primary/)
  })

  test('uses secondary button when not highlighted', () => {
    renderCard(defaultProps)
    const link = screen.getByRole('link', { name: 'Get started' })
    expect(link).toBeInTheDocument()
  })
})
