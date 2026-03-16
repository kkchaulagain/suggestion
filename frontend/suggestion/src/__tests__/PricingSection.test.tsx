import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import PricingSection from '../components/landing/PricingSection'

const defaultPlans = [
  {
    name: 'Free',
    price: '$0',
    features: ['3 forms'],
    cta: { label: 'Start', href: '/signup' },
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: ['Unlimited'],
    cta: { label: 'Get Pro', href: '/signup' },
  },
]

function renderSection(props: Parameters<typeof PricingSection>[0]) {
  return render(
    <MemoryRouter>
      <PricingSection {...props} />
    </MemoryRouter>,
  )
}

describe('PricingSection', () => {
  test('returns null when plans is empty', () => {
    const { container } = renderSection({ plans: [] })
    expect(container.firstChild).toBeNull()
  })

  test('renders all plans', () => {
    renderSection({ plans: defaultPlans })
    expect(screen.getByRole('heading', { name: 'Free' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pro' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get Pro' })).toBeInTheDocument()
  })

  test('renders heading and subheading when provided', () => {
    renderSection({
      plans: defaultPlans,
      heading: 'Pricing',
      subheading: 'Choose a plan',
    })
    expect(screen.getByRole('heading', { name: /pricing/i })).toBeInTheDocument()
    expect(screen.getByText(/choose a plan/i)).toBeInTheDocument()
  })

  test('renders without SectionHeading when no heading or subheading', () => {
    renderSection({ plans: defaultPlans })
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })
})
