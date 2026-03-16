import type { Meta, StoryObj } from '@storybook/react-vite'
import FAQSection from '../../components/landing/FAQSection'

const defaultItems = [
  {
    question: 'How do I create a form?',
    answer:
      'Sign up, then click "Create form" in the dashboard. Choose a template or start from scratch, add your questions, and share the link or QR code.',
  },
  {
    question: 'Can I customize the look of my forms?',
    answer:
      'Yes. You can change colors, add your logo, and adjust fields to match your brand. Custom branding is available on paid plans.',
  },
  {
    question: 'Where are responses stored?',
    answer:
      'Responses are stored securely and can be viewed in the dashboard, exported as CSV, or sent to your email or integrations.',
  },
]

const meta = {
  title: 'Landing/FAQSection',
  component: FAQSection,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    items: defaultItems,
    heading: 'Frequently asked questions',
    subheading: 'Everything you need to know about getting started.',
  },
} satisfies Meta<typeof FAQSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoHeading: Story = {
  args: {
    items: defaultItems,
  },
}

export const SingleItem: Story = {
  args: {
    items: [defaultItems[0]],
    heading: 'FAQ',
  },
}
