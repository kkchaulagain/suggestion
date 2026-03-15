import type { Meta, StoryObj } from '@storybook/react-vite'
import Card from '../../components/ui/Card'

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    children: { control: false },
  },
  args: {
    children: 'Card content goes here.',
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { padding: 'md' },
}

export const NoPadding: Story = {
  args: { padding: 'none', children: 'Content flush to edges.' },
}

export const SmallPadding: Story = {
  args: { padding: 'sm', children: 'Compact card with small padding.' },
}

export const LargePadding: Story = {
  args: { padding: 'lg', children: 'Spacious card with large padding.' },
}

export const WithRichContent: Story = {
  args: {
    padding: 'md',
    children: (
      <>
        <h3 className="font-semibold text-stone-900 dark:text-stone-100">Card title</h3>
        <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
          Supporting text and description. Cards can hold any layout or components.
        </p>
      </>
    ),
  },
}
