import type { Meta, StoryObj } from '@storybook/react-vite'
import Badge from '../../components/ui/Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['success', 'warning', 'info', 'neutral', 'danger'],
    },
  },
  args: {
    children: 'Badge',
    variant: 'success',
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: { variant: 'success', children: 'New' },
}

export const Warning: Story = {
  args: { variant: 'warning', children: 'Beta' },
}

export const Info: Story = {
  args: { variant: 'info', children: 'Info' },
}

export const Neutral: Story = {
  args: { variant: 'neutral', children: 'Draft' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Ending soon' },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="success">New</Badge>
      <Badge variant="warning">Beta</Badge>
      <Badge variant="info">Updated</Badge>
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="danger">Ending soon</Badge>
    </div>
  ),
}
