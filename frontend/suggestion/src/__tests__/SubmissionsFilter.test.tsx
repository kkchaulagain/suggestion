import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SubmissionsFilter from '../pages/business-dashboard/components/SubmissionsFilter'

describe('SubmissionsFilter', () => {
  it('shows On badge when fieldFilters has non-empty value and no form/date', () => {
    const onFieldFilterChange = jest.fn()
    render(
      <SubmissionsFilter
        forms={[]}
        formId=""
        onFormIdChange={() => {}}
        dateFrom=""
        onDateFromChange={() => {}}
        dateTo=""
        onDateToChange={() => {}}
        selectedFormFields={null}
        fieldFilters={{ comment: 'test' }}
        onFieldFilterChange={onFieldFilterChange}
        onApply={() => {}}
      />,
    )
    expect(screen.getByText(/On/i)).toBeInTheDocument()
  })

  it('calls onFieldFilterChange when text field filter input changes', () => {
    const onFieldFilterChange = jest.fn()
    render(
      <SubmissionsFilter
        forms={[]}
        formId=""
        onFormIdChange={() => {}}
        dateFrom=""
        onDateFromChange={() => {}}
        dateTo=""
        onDateToChange={() => {}}
        selectedFormFields={[{ name: 'comment', label: 'Comment', type: 'text' }]}
        fieldFilters={{}}
        onFieldFilterChange={onFieldFilterChange}
        onApply={() => {}}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /Filters/i }))
    const commentInput = screen.getByLabelText(/Comment/i)
    expect(commentInput).toBeInTheDocument()
    fireEvent.change(commentInput, { target: { value: 'hello' } })
    expect(onFieldFilterChange).toHaveBeenCalledWith('comment', 'hello')
  })
})
