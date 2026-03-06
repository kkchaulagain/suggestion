import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Label from '../components/ui/Label'

describe('Label', () => {
  test('renders children and associates with htmlFor', () => {
    render(<Label htmlFor="input-id">Email</Label>)
    const label = screen.getByText('Email')
    expect(label).toBeInTheDocument()
    expect(label).toHaveAttribute('for', 'input-id')
  })

  test('renders required asterisk when required is true', () => {
    render(
      <Label htmlFor="field" required>
        Name
      </Label>,
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
  })

  test('does not render asterisk when required is false', () => {
    render(<Label htmlFor="field">Optional</Label>)
    expect(screen.getByText('Optional')).toBeInTheDocument()
    expect(screen.queryByText('*')).not.toBeInTheDocument()
  })

  test('applies size classes', () => {
    const { rerender } = render(
      <Label htmlFor="a" size="sm">
        Small
      </Label>,
    )
    expect(screen.getByText('Small')).toHaveClass('text-xs')

    rerender(
      <Label htmlFor="a" size="md">
        Medium
      </Label>,
    )
    expect(screen.getByText('Medium')).toHaveClass('text-sm')
  })

  test('allows custom className', () => {
    render(
      <Label htmlFor="x" className="mb-2">
        Custom
      </Label>,
    )
    expect(screen.getByText('Custom')).toHaveClass('mb-2')
  })
})
