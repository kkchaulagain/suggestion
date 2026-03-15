import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EmailField } from '../components/forms'

describe('EmailField', () => {
  test('renders an email input with the given label and placeholder', () => {
    render(
      <EmailField
        id="email"
        label="Email Address"
        value=""
        onChange={() => {}}
        placeholder="you@example.com"
      />,
    )
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
  })

  test('input has type="email"', () => {
    render(
      <EmailField
        id="email"
        label="Email Address"
        value=""
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })

  test('calls onChange when text is typed', () => {
    const onChange = jest.fn()
    render(
      <EmailField
        id="email"
        label="Email Address"
        value=""
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'alice@example.com' } })
    expect(onChange).toHaveBeenCalledWith('alice@example.com')
  })

  test('reflects the controlled value', () => {
    render(
      <EmailField
        id="email"
        label="Email Address"
        value="bob@example.com"
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveValue('bob@example.com')
  })

  test('is disabled when disabled prop is true', () => {
    render(
      <EmailField
        id="email"
        label="Email Address"
        value=""
        onChange={() => {}}
        disabled={true}
      />,
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
  })

  test('shows error message and marks input invalid when error prop is set', () => {
    render(
      <EmailField
        id="email"
        label="Email Address"
        value=""
        onChange={() => {}}
        error="Invalid email address"
      />,
    )
    expect(screen.getByText('Invalid email address')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('marks input as required when required prop is true', () => {
    render(
      <EmailField
        id="email"
        label="Email Address"
        value=""
        onChange={() => {}}
        required={true}
      />,
    )
    expect(screen.getByRole('textbox')).toBeRequired()
  })
})
