import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Modal from '../components/ui/Modal'

describe('Modal', () => {
  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>,
    )
    expect(container.firstChild).toBeNull()
  })

  test('renders title and children when isOpen', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  test('calls onClose when backdrop is clicked', () => {
    const onClose = jest.fn()
    render(
      <Modal isOpen onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>,
    )
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalled()
  })
})
