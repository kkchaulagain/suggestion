import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Textarea from '../components/ui/Textarea'

describe('Textarea', () => {
  test('renders textarea with value and label', () => {
    render(
      <Textarea
        id="desc"
        label="Description"
        value=""
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText('Description')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'desc')
  })

  test('calls onChange with new value', () => {
    const onChange = jest.fn()
    render(<Textarea id="t" value="" onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalledWith('hello')
  })

  test('renders without label', () => {
    render(<Textarea id="n" value="some" onChange={() => {}} />)
    expect(screen.getByDisplayValue('some')).toBeInTheDocument()
  })

  test('shows error message when error prop is set', () => {
    render(
      <Textarea id="e" value="" onChange={() => {}} error="Required" />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Required')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  test('applies rows and required', () => {
    render(
      <Textarea id="r" label="Notes" value="" onChange={() => {}} rows={5} required />,
    )
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveAttribute('rows', '5')
    expect(textarea).toBeRequired()
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})
