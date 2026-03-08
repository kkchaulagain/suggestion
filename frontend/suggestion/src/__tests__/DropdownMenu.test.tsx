import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import DropdownMenu from '../components/ui/DropdownMenu'

describe('DropdownMenu', () => {
  test('renders trigger', () => {
    render(
      <DropdownMenu trigger={<button type="button">Menu</button>}>
        <button type="button">Item 1</button>
      </DropdownMenu>,
    )
    expect(screen.getByText('Menu')).toBeInTheDocument()
  })

  test('shows menu when trigger is clicked', () => {
    render(
      <DropdownMenu trigger={<span>Open</span>}>
        <button type="button">Action</button>
      </DropdownMenu>,
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
  })

  test('supports keyboard open and left alignment', () => {
    render(
      <DropdownMenu trigger={<span>Open</span>} align="left">
        <button type="button">Action</button>
      </DropdownMenu>,
    )

    fireEvent.keyDown(screen.getByRole('button', { name: /open/i }), { key: 'Enter', code: 'Enter' })

    const menu = screen.getByRole('menu')
    expect(menu).toBeInTheDocument()
    expect(menu.className).toMatch(/left-0/)
  })

  test('closes when clicking outside', () => {
    render(
      <div>
        <DropdownMenu trigger={<span>Open</span>}>
          <button type="button">Action</button>
        </DropdownMenu>
        <button type="button">Outside</button>
      </div>,
    )

    fireEvent.click(screen.getByText('Open'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
