import type { Meta, StoryObj } from '@storybook/react-vite'
import HeroSection from '../../components/landing/HeroSection'

const meta = {
  title: 'Landing/HeroSection',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['centered', 'split', 'splitReversed', 'centeredWithMediaBelow'],
    },
    style: {
      control: 'select',
      options: ['default', 'minimal', 'dark'],
    },
  },
  args: {
    headline: 'Collect feedback from your customers',
    subheadline: 'Create forms, share a link or QR code, and get responses in one place.',
  },
} satisfies Meta<typeof HeroSection>

export default meta
type Story = StoryObj<typeof meta>

export const Centered: Story = {
  args: {
    variant: 'centered',
    headline: 'Welcome to the platform',
    subheadline: 'A short line that supports the headline and encourages action.',
    primaryCta: { label: 'Get started', href: '/signup' },
    secondaryCta: { label: 'Log in', href: '/login' },
  },
}

export const CenteredWithBadge: Story = {
  args: {
    ...Centered.args,
    badge: 'New: Poll support',
  },
}

export const Split: Story = {
  args: {
    variant: 'split',
    headline: 'Feedback made simple',
    subheadline: 'Share a link or QR code and get responses in one place.',
    primaryCta: { label: 'Get started', href: '/signup' },
    secondaryCta: { label: 'Log in', href: '/login' },
    media: (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-500">
        Hero image or illustration
      </div>
    ),
  },
}

export const SplitReversed: Story = {
  args: {
    ...Split.args,
    variant: 'splitReversed',
    headline: 'Media on the left',
    subheadline: 'Same layout with media and copy order flipped.',
  },
}

export const CenteredWithMediaBelow: Story = {
  args: {
    variant: 'centeredWithMediaBelow',
    headline: 'Centered with media below',
    subheadline: 'Full-width media block under the copy.',
    primaryCta: { label: 'Start now', href: '/signup' },
    media: (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-200 dark:bg-stone-700 text-stone-500">
        Media below
      </div>
    ),
  },
}

export const Minimal: Story = {
  args: {
    ...Centered.args,
    style: 'minimal',
    headline: 'Minimal hero',
    subheadline: 'Tighter spacing and smaller type.',
  },
}

export const Dark: Story = {
  args: {
    ...Centered.args,
    style: 'dark',
    headline: 'Dark style hero',
    subheadline: 'Dark background with light text and CTAs.',
    primaryCta: { label: 'Get started', href: '/signup' },
    secondaryCta: { label: 'Log in', href: '/login' },
  },
}
