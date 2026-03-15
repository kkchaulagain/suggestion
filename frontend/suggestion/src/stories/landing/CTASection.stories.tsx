import type { Meta, StoryObj } from '@storybook/react-vite'
import CTASection from '../../components/landing/CTASection'

const meta = {
  title: 'Landing/CTASection',
  component: CTASection,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['simple', 'banner'] },
  },
  args: {
    text: 'Ready to get started? Create your first form in minutes.',
    ctaLabel: 'Get started free',
    ctaHref: '/signup',
    variant: 'simple',
  },
} satisfies Meta<typeof CTASection>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {}

export const SimpleWithSecondary: Story = {
  args: {
    text: 'Start collecting feedback today.',
    ctaLabel: 'Sign up',
    ctaHref: '/signup',
    secondaryCta: { label: 'Contact sales', href: '/contact' },
  },
}

export const Banner: Story = {
  args: {
    variant: 'banner',
    text: 'Ready to get started? Create your first form in minutes.',
    ctaLabel: 'Get started free',
    ctaHref: '/signup',
  },
}

export const BannerWithSecondary: Story = {
  args: {
    variant: 'banner',
    text: 'Join thousands of teams already using our product.',
    ctaLabel: 'Start free trial',
    ctaHref: '/signup',
    secondaryCta: { label: 'Watch demo', href: '/demo' },
  },
}
