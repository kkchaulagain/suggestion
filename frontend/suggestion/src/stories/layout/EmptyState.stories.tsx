import type { Meta, StoryObj } from '@storybook/react-vite'
import EmptyState from '../../components/layout/EmptyState'

const meta = {
  title: 'Layout/EmptyState',
  component: EmptyState,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['loading', 'empty', 'error'],
    },
  },
  args: {
    type: 'empty',
    message: 'No items yet.',
  },
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: { type: 'empty', message: 'No forms yet. Create your first form to get started.' },
}

export const Loading: Story = {
  args: { type: 'loading', message: 'Loading…' },
}

export const Error: Story = {
  args: {
    type: 'error',
    message: 'Something went wrong. Please try again.',
  },
}
