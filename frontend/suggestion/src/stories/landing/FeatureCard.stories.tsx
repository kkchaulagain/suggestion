import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileText } from 'lucide-react'
import FeatureCard from '../../components/landing/FeatureCard'

const meta = {
  title: 'Landing/FeatureCard',
  component: FeatureCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    icon: { control: false },
  },
  args: {
    icon: <FileText className="h-6 w-6" />,
    title: 'Feature title',
    description: 'Short description of the feature for the card.',
  },
} satisfies Meta<typeof FeatureCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LongContent: Story = {
  args: {
    icon: <FileText className="h-6 w-6" />,
    title: 'Collect feedback at scale',
    description:
      'Create custom forms, share via link or QR code, and receive responses in one place. Built for businesses that need simple, fast feedback collection.',
  },
}
