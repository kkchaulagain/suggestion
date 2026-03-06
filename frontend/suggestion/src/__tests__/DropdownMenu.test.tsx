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
})
