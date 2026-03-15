import type { Meta, StoryObj } from '@storybook/react-vite'
import PricingCard from '../../components/landing/PricingCard'

const defaultFeatures = [
  'Up to 10 forms',
  '1,000 responses/month',
  'Email support',
  'QR codes & share links',
]

const meta = {
  title: 'Landing/PricingCard',
  component: PricingCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    name: 'Starter',
    price: '$0',
    period: 'per month',
    features: defaultFeatures,
    cta: { label: 'Get started', href: '/signup' },
    highlighted: false,
  },
} satisfies Meta<typeof PricingCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Highlighted: Story = {
  args: {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    features: [
      'Unlimited forms',
      '10,000 responses/month',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    cta: { label: 'Start free trial', href: '/signup' },
    highlighted: true,
  },
}

export const NoPeriod: Story = {
  args: {
    name: 'Enterprise',
    price: 'Custom',
    features: ['Everything in Pro', 'Unlimited responses', 'Dedicated support', 'SLA'],
    cta: { label: 'Contact sales', href: '/contact' },
  },
}
