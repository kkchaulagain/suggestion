import type { Meta, StoryObj } from '@storybook/react-vite'
import SectionHeading from '../../components/landing/SectionHeading'

const meta = {
  title: 'Landing/SectionHeading',
  component: SectionHeading,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    align: { control: 'select', options: ['left', 'center'] },
  },
  args: {
    title: 'Section title',
    align: 'center',
  },
} satisfies Meta<typeof SectionHeading>

export default meta
type Story = StoryObj<typeof meta>

export const Centered: Story = {}

export const WithSubtitle: Story = {
  args: {
    title: 'How it works',
    subtitle: 'Three steps to start collecting feedback from your customers.',
  },
}

export const LeftAligned: Story = {
  args: {
    title: 'Left-aligned heading',
    subtitle: 'Use for sidebar or narrow layouts.',
    align: 'left',
  },
}
