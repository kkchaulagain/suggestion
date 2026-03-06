import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import Pagination from '../components/layout/Pagination'

describe('Pagination', () => {
  test('shows page info and Previous/Next buttons', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination
        page={2}
        totalPages={5}
        totalItems={100}
        onPageChange={onPageChange}
      />,
    )
    expect(screen.getByText(/Page 2 of 5 \(100 total\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
  })

  test('calls onPageChange when Next is clicked', () => {
    const onPageChange = jest.fn()
    render(
      <Pagination page={1} totalPages={3} totalItems={30} onPageChange={onPageChange} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  test('Previous is disabled on first page', () => {
    render(
      <Pagination page={1} totalPages={2} totalItems={20} onPageChange={() => {}} />,
    )
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })
})
