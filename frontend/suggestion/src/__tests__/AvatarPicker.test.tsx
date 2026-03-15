import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import AvatarPicker from '../components/AvatarPicker'

describe('AvatarPicker', () => {
  it('renders preset options and Skip button', () => {
    const onChange = jest.fn()
    render(<AvatarPicker value={null} onChange={onChange} />)

    expect(screen.getByRole('radiogroup', { name: /choose your avatar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Skip for now/i })).toBeInTheDocument()
  })

  it('calls onChange with avatar id when preset is clicked', () => {
    const onChange = jest.fn()
    render(<AvatarPicker value={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: /Person/i }))
    expect(onChange).toHaveBeenCalledWith('avatar-1')
  })

  it('calls onChange with null when Skip is clicked', () => {
    const onChange = jest.fn()
    render(<AvatarPicker value="avatar-2" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Skip for now/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('deselects when clicking selected preset again', () => {
    const onChange = jest.fn()
    render(<AvatarPicker value="avatar-1" onChange={onChange} />)

    fireEvent.click(screen.getByRole('radio', { name: /Person/i }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
