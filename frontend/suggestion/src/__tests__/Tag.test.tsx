import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Tag from '../components/ui/Tag'

describe('Tag', () => {
  test('renders children', () => {
    render(<Tag>Short Text</Tag>)
    expect(screen.getByText('Short Text')).toBeInTheDocument()
  })

  test('applies default variant styles', () => {
    const { container } = render(<Tag>Label</Tag>)
    const span = container.querySelector('span')
    expect(span).toHaveClass('bg-slate-100', 'text-slate-700')
  })

  test('applies emerald variant when specified', () => {
    const { container } = render(<Tag variant="emerald">Option</Tag>)
    const span = container.querySelector('span')
    expect(span).toHaveClass('bg-emerald-100', 'text-emerald-800')
  })

  test('renders remove button when onRemove is provided', () => {
    const onRemove = jest.fn()
    render(<Tag onRemove={onRemove}>Removable</Tag>)
    const btn = screen.getByRole('button', { name: 'Remove' })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  test('uses removeLabel for aria-label when provided', () => {
    render(<Tag onRemove={() => {}} removeLabel="Remove option Foo">Foo</Tag>)
    expect(screen.getByRole('button', { name: 'Remove option Foo' })).toBeInTheDocument()
  })
})
