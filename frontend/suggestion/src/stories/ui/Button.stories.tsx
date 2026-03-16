import type { Meta, StoryObj } from '@storybook/react-vite'
import Button from '../../components/ui/Button'

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    children: { control: 'text' },
  },
  args: {
    children: 'Button',
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary action' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', children: 'Secondary' },
}

export const Danger: Story = {
  args: { variant: 'danger', children: 'Delete' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
}

export const Large: Story = {
  args: { size: 'lg', children: 'Large button' },
}
