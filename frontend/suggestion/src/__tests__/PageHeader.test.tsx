import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import PageHeader from '../components/layout/PageHeader'

describe('PageHeader', () => {
  test('renders title', () => {
    render(<PageHeader title="Saved Forms" />)
    expect(screen.getByText('Saved Forms')).toBeInTheDocument()
  })

  test('renders actions when provided', () => {
    render(
      <PageHeader title="Page" actions={<button type="button">Add</button>} />,
    )
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
  })
})
