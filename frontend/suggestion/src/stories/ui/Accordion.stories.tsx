import type { Meta, StoryObj } from '@storybook/react-vite'
import Accordion from '../../components/ui/Accordion'

const defaultItems = [
  {
    id: 'one',
    title: 'First item',
    content: <p>Content for the first accordion panel. Can include any React nodes.</p>,
  },
  {
    id: 'two',
    title: 'Second item',
    content: <p>Content for the second panel. Useful for FAQs, settings, or step-by-step content.</p>,
  },
  {
    id: 'three',
    title: 'Third item',
    content: <p>You can set <code>defaultOpenId</code> to open a specific item by default.</p>,
  },
]

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    items: defaultItems,
  },
} satisfies Meta<typeof Accordion>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FirstOpen: Story = {
  args: { defaultOpenId: 'one', items: defaultItems },
}

export const SecondOpen: Story = {
  args: { defaultOpenId: 'two', items: defaultItems },
}

export const SingleItem: Story = {
  args: {
    items: [defaultItems[0]],
  },
}
