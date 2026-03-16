import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import Tag from '../../components/ui/Tag'

const meta = {
  title: 'UI/Tag',
  component: Tag,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'emerald', 'stone'],
    },
    onRemove: { action: 'removed' },
  },
  args: {
    children: 'Tag label',
  },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Emerald: Story = {
  args: { variant: 'emerald', children: 'Success' },
}

export const Stone: Story = {
  args: { variant: 'stone', children: 'Neutral' },
}

export const Removable: Story = {
  args: {
    children: 'Removable tag',
    onRemove: fn(),
    removeLabel: 'Remove this tag',
  },
}

export const Group: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag>Default</Tag>
      <Tag variant="emerald">Emerald</Tag>
      <Tag variant="stone">Stone</Tag>
      <Tag onRemove={fn()}>Removable</Tag>
    </div>
  ),
}
