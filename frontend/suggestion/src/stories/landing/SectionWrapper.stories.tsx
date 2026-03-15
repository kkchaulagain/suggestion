import type { Meta, StoryObj } from '@storybook/react-vite'
import SectionWrapper from '../../components/landing/SectionWrapper'

const meta = {
  title: 'Landing/SectionWrapper',
  component: SectionWrapper,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    background: { control: 'select', options: ['default', 'muted', 'accent'] },
  },
  args: {
    children: 'Section content. Use for max-width container and optional background.',
    background: 'default',
  },
} satisfies Meta<typeof SectionWrapper>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Muted: Story = {
  args: {
    background: 'muted',
    children: (
      <p className="text-stone-600 dark:text-stone-400">
        Muted background for alternating sections.
      </p>
    ),
  },
}

export const Accent: Story = {
  args: {
    background: 'accent',
    children: (
      <p className="text-stone-700 dark:text-stone-300">
        Accent (brand tint) background for highlighted sections.
      </p>
    ),
  },
}

export const WithId: Story = {
  args: {
    id: 'pricing',
    children: (
      <>
        <h2 className="text-xl font-semibold">Section with anchor</h2>
        <p className="mt-2 text-stone-600 dark:text-stone-400">
          Use the <code>id</code> prop for anchor links (e.g. #pricing).
        </p>
      </>
    ),
  },
}
