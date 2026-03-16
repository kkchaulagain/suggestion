import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import Input from '../../components/ui/Input'

const meta = {
  title: 'UI/Input',
  component: Input,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
  args: {
    id: 'story-input',
    label: 'Label',
    value: '',
    onChange: fn(),
    placeholder: 'Placeholder text',
    type: 'text',
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithValue: Story = {
  args: { value: 'Prefilled value' },
}

export const WithError: Story = {
  args: {
    value: 'invalid@',
    error: 'Please enter a valid email address.',
  },
}

export const Email: Story = {
  args: {
    id: 'email-input',
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
  },
}

export const Password: Story = {
  args: {
    id: 'password-input',
    label: 'Password',
    type: 'password',
    placeholder: '••••••••',
  },
}

export const Required: Story = {
  args: { required: true, label: 'Required field' },
}

export const Disabled: Story = {
  args: { value: 'Disabled', disabled: true },
}
