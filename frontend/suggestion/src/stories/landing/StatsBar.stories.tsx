import type { Meta, StoryObj } from '@storybook/react-vite'
import StatsBar from '../../components/landing/StatsBar'

const meta = {
  title: 'Landing/StatsBar',
  component: StatsBar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    stats: [
      { value: '10k+', label: 'Active users' },
      { value: '99.9%', label: 'Uptime' },
      { value: '50+', label: 'Integrations' },
    ],
    showDividers: true,
  },
} satisfies Meta<typeof StatsBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoDividers: Story = {
  args: { showDividers: false },
}

export const TwoStats: Story = {
  args: {
    stats: [
      { value: '500+', label: 'Forms created' },
      { value: '1M+', label: 'Responses' },
    ],
  },
}

export const FourStats: Story = {
  args: {
    stats: [
      { value: '10k+', label: 'Users' },
      { value: '99.9%', label: 'Uptime' },
      { value: '50+', label: 'Integrations' },
      { value: '24/7', label: 'Support' },
    ],
  },
}
