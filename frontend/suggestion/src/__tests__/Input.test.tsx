import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Input from '../components/ui/Input'

describe('Input', () => {
  test('renders input with value and label', () => {
    render(
      <Input
        id="test-id"
        label="Email"
        value=""
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'test-id')
  })

  test('calls onChange with new value', () => {
    const onChange = jest.fn()
    render(
      <Input id="x" value="" onChange={onChange} />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  test('renders without label', () => {
    render(<Input id="y" value="val" onChange={() => {}} />)
    expect(screen.getByDisplayValue('val')).toBeInTheDocument()
    expect(screen.queryByRole('label', { hidden: true })).not.toBeInTheDocument()
  })

  test('shows error message when error prop is set', () => {
    render(
      <Input id="z" value="" onChange={() => {}} error="Required field" />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required field')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('applies required to label and input', () => {
    render(
      <Input id="r" label="Name" value="" onChange={() => {}} required />,
    )
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeRequired()
  })

  test('supports type password', () => {
    const { container } = render(<Input id="p" type="password" value="" onChange={() => {}} />)
    const input = container.querySelector('#p')
    expect(input).toHaveAttribute('type', 'password')
  })
})
