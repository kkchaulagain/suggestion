import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Select from '../components/ui/Select'

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
]

describe('Select', () => {
  test('renders select with label and options', () => {
    render(
      <Select
        id="sel"
        label="Choose"
        value=""
        onChange={() => {}}
        options={options}
      />,
    )
    expect(screen.getByLabelText('Choose')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('id', 'sel')
    expect(screen.getByRole('option', { name: 'Option A' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Option B' })).toBeInTheDocument()
  })

  test('calls onChange with selected value', () => {
    const onChange = jest.fn()
    render(
      <Select id="s" value="" onChange={onChange} options={options} />,
    )
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } })
    expect(onChange).toHaveBeenCalledWith('b')
  })

  test('renders placeholder option when placeholder prop is set', () => {
    render(
      <Select
        id="p"
        value=""
        onChange={() => {}}
        options={options}
        placeholder="All forms"
      />,
    )
    expect(screen.getByRole('option', { name: 'All forms' })).toHaveAttribute('value', '')
  })

  test('shows error message when error prop is set', () => {
    render(
      <Select id="e" value="" onChange={() => {}} options={options} error="Required" />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('applies required to label and select', () => {
    render(
      <Select id="r" label="Type" value="" onChange={() => {}} options={options} required />,
    )
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeRequired()
  })
})
