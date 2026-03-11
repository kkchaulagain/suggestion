import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NameField } from '../components/forms'

describe('NameField', () => {
  test('renders a text input with the given label and placeholder', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={() => {}}
        placeholder="Enter name"
      />,
    )
    expect(screen.getByText('Your Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument()
  })

  test('calls onChange when text is typed', () => {
    const onChange = jest.fn()
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={onChange}
      />,
    )
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Alice' } })
    expect(onChange).toHaveBeenCalledWith('Alice')
  })

  test('does not show anonymous checkbox when isAnonymous is false', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={() => {}}
        isAnonymous={false}
      />,
    )
    expect(screen.queryByLabelText(/submit anonymously/i)).not.toBeInTheDocument()
  })

  test('shows anonymous checkbox when isAnonymous is true', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={() => {}}
        isAnonymous={true}
      />,
    )
    expect(screen.getByLabelText(/submit anonymously/i)).toBeInTheDocument()
  })

  test('toggling anonymous disables input and sets placeholder to "You are anonymous"', () => {
    const onChange = jest.fn()
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={onChange}
        isAnonymous={true}
        placeholder="Enter name"
      />,
    )
    const checkbox = screen.getByLabelText(/submit anonymously/i)
    fireEvent.click(checkbox)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveAttribute('placeholder', 'You are anonymous')
    expect(onChange).toHaveBeenCalledWith('Anonymous')
  })

  test('unchecking anonymous re-enables input and restores placeholder', () => {
    const onChange = jest.fn()
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={onChange}
        isAnonymous={true}
        placeholder="Enter name"
      />,
    )
    const checkbox = screen.getByLabelText(/submit anonymously/i)
    // Check
    fireEvent.click(checkbox)
    // Uncheck
    fireEvent.click(checkbox)

    const input = screen.getByRole('textbox')
    expect(input).not.toBeDisabled()
    expect(input).toHaveAttribute('placeholder', 'Enter name')
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  test('when anonymous is checked, required is bypassed on the input', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={() => {}}
        isAnonymous={true}
        required={true}
      />,
    )
    const checkbox = screen.getByLabelText(/submit anonymously/i)
    fireEvent.click(checkbox)

    const input = screen.getByRole('textbox')
    expect(input).not.toBeRequired()
  })

  test('when anonymous is checked, error is not shown', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={() => {}}
        isAnonymous={true}
        error="Name is required"
      />,
    )
    const checkbox = screen.getByLabelText(/submit anonymously/i)
    fireEvent.click(checkbox)

    expect(screen.queryByText('Name is required')).not.toBeInTheDocument()
  })

  test('shows error when not anonymous', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value=""
        onChange={() => {}}
        isAnonymous={false}
        error="Name is required"
      />,
    )
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  test('input is disabled when disabled prop is true', () => {
    render(
      <NameField
        id="name"
        label="Your Name"
        value="Alice"
        onChange={() => {}}
        disabled={true}
      />,
    )
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
})
