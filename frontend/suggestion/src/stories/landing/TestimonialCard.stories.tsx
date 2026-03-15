import type { Meta, StoryObj } from '@storybook/react-vite'
import TestimonialCard from '../../components/landing/TestimonialCard'

const meta = {
  title: 'Landing/TestimonialCard',
  component: TestimonialCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    quote: 'This product saved us hours every week. The feedback forms are easy to set up and our customers love them.',
    name: 'Jane Smith',
    role: 'CTO, Acme Inc',
  },
} satisfies Meta<typeof TestimonialCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAvatar: Story = {
  args: {
    quote: 'Incredible support and a seamless experience from day one.',
    name: 'Alex Chen',
    role: 'Product Lead',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  },
}

export const NoRole: Story = {
  args: {
    quote: 'Simple and effective. Exactly what we needed.',
    name: 'Sam Wilson',
  },
}

export const ShortQuote: Story = {
  args: {
    quote: 'Game changer.',
    name: 'Jordan Lee',
    role: 'Founder',
  },
}
