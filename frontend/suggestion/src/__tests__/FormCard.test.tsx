import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import FormCard from '../components/layout/FormCard'

describe('FormCard', () => {
  test('renders title', () => {
    render(<FormCard title="Form One" />)
    expect(screen.getByText('Form One')).toBeInTheDocument()
  })

  test('renders subtitle and description when provided', () => {
    render(
      <FormCard
        title="Form"
        subtitle="Business ID: 123"
        description="Feedback form"
      />,
    )
    expect(screen.getByText('Business ID: 123')).toBeInTheDocument()
    expect(screen.getByText('Feedback form')).toBeInTheDocument()
  })

  test('renders actions and children', () => {
    render(
      <FormCard
        title="Form"
        actions={<button type="button">Generate QR</button>}
      >
        <p>Fields list</p>
      </FormCard>,
    )
    expect(screen.getByRole('button', { name: 'Generate QR' })).toBeInTheDocument()
    expect(screen.getByText('Fields list')).toBeInTheDocument()
  })
})
