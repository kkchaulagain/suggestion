import type { Meta, StoryObj } from '@storybook/react-vite'
import Alert from '../../components/ui/Alert'

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
  args: {
    children: 'This is an alert message. Use it for callouts, notices, or feedback.',
    variant: 'info',
  },
} satisfies Meta<typeof Alert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { variant: 'info' },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your changes have been saved successfully.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'This action cannot be undone. Please confirm before proceeding.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Something went wrong. Please try again or contact support.',
  },
}

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Tip',
    children: 'You can export your data as CSV from the dashboard at any time.',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Alert variant="info" title="Info">Informational message for the user.</Alert>
      <Alert variant="success" title="Success">Operation completed successfully.</Alert>
      <Alert variant="warning" title="Warning">Please review before continuing.</Alert>
      <Alert variant="error" title="Error">An error occurred. Try again.</Alert>
    </div>
  ),
}
