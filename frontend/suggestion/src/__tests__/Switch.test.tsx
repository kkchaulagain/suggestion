import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Switch from '../components/ui/Switch'

describe('Switch', () => {
  test('renders with role switch and aria-checked', () => {
    render(<Switch id="s1" checked={false} onChange={() => {}} />)
    const sw = screen.getByRole('switch', { name: '' })
    expect(sw).toHaveAttribute('aria-checked', 'false')
  })

  test('shows aria-checked true when checked', () => {
    render(<Switch id="s2" checked onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  test('calls onChange with true when clicking unchecked switch', () => {
    const onChange = jest.fn()
    render(<Switch id="s3" checked={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  test('calls onChange with false when clicking checked switch', () => {
    const onChange = jest.fn()
    render(<Switch id="s4" checked onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  test('does not call onChange when disabled', () => {
    const onChange = jest.fn()
    render(<Switch id="s5" checked={false} onChange={onChange} disabled />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('applies aria-label when provided', () => {
    render(<Switch id="s6" checked={false} onChange={() => {}} aria-label="Toggle setting" />)
    expect(screen.getByRole('switch', { name: 'Toggle setting' })).toBeInTheDocument()
  })
})
